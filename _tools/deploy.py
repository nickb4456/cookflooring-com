#!/usr/bin/python3
"""Cook Flooring deploy gate. Stdlib only. Runs on the macOS system python.

  _tools/deploy.py check         offline gates on what HEAD would ship; changes nothing
  _tools/deploy.py build-css     regenerate css/styles.min.css from css/styles.css
  _tools/deploy.py ship          check, fast-forward push to main, wait, prove live
  _tools/deploy.py verify-live   compare live files to HEAD (add --all for every text file)

Every gate reads the COMMIT (git show HEAD:path), never the working tree, so an
untracked photo or an uncommitted edit cannot make a check pass. This script
never runs git add, stash, reset, or a force push.

Exit 0 = every gate passed. Exit 1 = at least one FAIL. WARN never fails.
"""

import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from html.parser import HTMLParser

SITE = "https://cookflooring.com"
REPO = "nickb4456/cookflooring-com"
BRANCH = "main"
CLEANCSS = ["npx", "-y", "clean-css-cli@5.6.3"]
CSS_SRC, CSS_MIN = "css/styles.css", "css/styles.min.css"

# The repo is PUBLIC and serves the live site. Nothing under these may be tracked.
FORBIDDEN = (".reports/", "scratchpad/", "tmp/")
MEDIA_EXT = (".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".mp4", ".webm", ".mov")
MAX_BYTES = 10 * 1024 * 1024
SECRET_RES = [
    re.compile(p)
    for p in (
        r"gh[opsu]_[A-Za-z0-9]{30,}",
        r"sk-[A-Za-z0-9_-]{24,}",
        r"xai-[A-Za-z0-9]{24,}",
        r"AKIA[0-9A-Z]{16}",
        r"AIza[0-9A-Za-z_-]{35}",
        r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    )
]
TEXT_EXT = (".html", ".css", ".js", ".xml", ".txt", ".svg", ".json", ".md")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
results = []
receipt = []


def git(*args, check=True, binary=False):
    p = subprocess.run(["git", "-C", ROOT] + list(args), capture_output=True)
    if check and p.returncode != 0:
        sys.exit("git %s failed: %s" % (" ".join(args), p.stderr.decode().strip()))
    return p.stdout if binary else p.stdout.decode("utf-8", "replace")


def blob(path, rev="HEAD"):
    p = subprocess.run(
        ["git", "-C", ROOT, "show", "%s:%s" % (rev, path)], capture_output=True
    )
    return p.stdout if p.returncode == 0 else None


def report(level, gate, msg):
    results.append(level)
    line = "%-4s %-12s %s" % (level, gate, msg)
    receipt.append(line)
    print(line)


def published(path):
    """True when GitHub Pages (Jekyll) serves this path: no _ or . path parts."""
    return not any(part[0] in "._" for part in path.split("/"))


def changed_files(base):
    out = git("diff", "--name-status", "--no-renames", base, "HEAD")
    rows = [line.split("\t", 1) for line in out.splitlines() if line]
    return [(status, path) for status, path in rows]


# ---------------------------------------------------------------- gates


def gate_branch():
    name = git("rev-parse", "--abbrev-ref", "HEAD").strip()
    if name == BRANCH:
        report("PASS", "branch", "on %s" % BRANCH)
    else:
        report(
            "FAIL",
            "branch",
            "on '%s'. Deploys go from %s: git switch %s && git merge --ff-only %s"
            % (name, BRANCH, BRANCH, name),
        )


def gate_dirty(tracked):
    out = git("status", "--porcelain", "--untracked-files=no")
    dirty = [
        l[3:]
        for l in out.splitlines()
        if published(l[3:]) and l[3:].endswith(TEXT_EXT[:3])
    ]
    if dirty:
        report(
            "WARN",
            "uncommitted",
            "edited but NOT in this deploy: %s" % ", ".join(dirty),
        )
    else:
        report("PASS", "uncommitted", "no uncommitted site files")


def gate_forbidden(tracked):
    bad = [p for p in tracked if p.startswith(FORBIDDEN) or p == ".env"]
    if bad:
        tops = sorted({p.split("/")[0] for p in bad})
        report(
            "FAIL",
            "private",
            "%d internal files tracked in a PUBLIC repo under %s. Fix: git rm -r --cached <dir> (keeps your local copy), then commit"
            % (len(bad), ", ".join(tops)),
        )
    else:
        report("PASS", "private", "no internal files tracked")


def gate_cname():
    got = (blob("CNAME") or b"").decode().strip()
    if got == "cookflooring.com":
        report("PASS", "cname", got)
    else:
        report(
            "FAIL",
            "cname",
            "CNAME is '%s', expected cookflooring.com. Losing it takes the domain offline"
            % got,
        )


def gate_secrets(base):
    diff = git("diff", "-U0", "--no-renames", base, "HEAD")
    hits, path = [], "?"
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            path = line[6:]
        elif line.startswith("+") and any(r.search(line) for r in SECRET_RES):
            hits.append(path)
    if hits:
        report(
            "FAIL",
            "secrets",
            "key-shaped text added in: %s" % ", ".join(sorted(set(hits))),
        )
    else:
        report("PASS", "secrets", "no key-shaped text in the outgoing diff")


def gate_size(changes):
    big = []
    for status, path in changes:
        if status != "D":
            size = int(git("cat-file", "-s", "HEAD:%s" % path).strip() or 0)
            if size > MAX_BYTES:
                big.append("%s (%.1f MB)" % (path, size / 1048576.0))
    if big:
        report("FAIL", "size", "over 10 MB: %s" % ", ".join(big))
    else:
        report("PASS", "size", "no outgoing file over 10 MB")


def gate_unused_media(changes, tracked):
    added = [p for s, p in changes if s == "A" and p.lower().endswith(MEDIA_EXT)]
    if not added:
        return
    pages = [
        p for p in tracked if p.endswith((".html", ".css", ".js")) and published(p)
    ]
    haystack = b"".join(blob(p) or b"" for p in pages)
    unused = [p for p in added if os.path.basename(p).encode() not in haystack]
    if unused:
        report(
            "WARN",
            "unused-media",
            "%d new photo/video file(s) that no page uses (public repo weight): %s"
            % (len(unused), ", ".join(unused[:6])),
        )


def gate_css(changes):
    touched = {p for _, p in changes}
    if CSS_SRC not in touched and CSS_MIN not in touched:
        report("PASS", "css", "stylesheet not in this deploy")
        return
    if CSS_SRC in touched and CSS_MIN not in touched:
        report(
            "FAIL",
            "css",
            "%s changed but %s did not. The site serves the min file. Run: _tools/deploy.py build-css, then commit it"
            % (CSS_SRC, CSS_MIN),
        )
        return
    if not shutil.which("npx"):
        report(
            "WARN",
            "css",
            "npx not found, could not confirm the min file matches the source",
        )
        return
    with tempfile.TemporaryDirectory() as tmp:
        src, out = os.path.join(tmp, "styles.css"), os.path.join(tmp, "styles.min.css")
        with open(src, "wb") as f:
            f.write(blob(CSS_SRC))
        try:
            p = subprocess.run(
                CLEANCSS + ["-o", out, src], capture_output=True, timeout=90
            )
            built = open(out, "rb").read() if p.returncode == 0 else None
        except (subprocess.TimeoutExpired, OSError):
            built = None
    if built is None:
        report(
            "WARN",
            "css",
            "could not run clean-css (no network?), min file not confirmed against source",
        )
    elif built == blob(CSS_MIN):
        report("PASS", "css", "%s is an exact build of %s" % (CSS_MIN, CSS_SRC))
    else:
        report(
            "FAIL",
            "css",
            "%s is stale. Run: _tools/deploy.py build-css, then commit it" % CSS_MIN,
        )


def cache_tokens(rev, html_paths, asset_name):
    """All ?v= tokens used for one asset file name across the site's HTML at rev."""
    pat = re.compile(r"""["'/]%s(?:\?v=([^"'&\s]*))?["']""" % re.escape(asset_name))
    tokens = set()
    for path in html_paths:
        data = blob(path, rev)
        if data:
            for m in pat.finditer(data.decode("utf-8", "replace")):
                tokens.add(m.group(1) or "")
    return tokens


def gate_cache_keys(changes, base, html_paths):
    names = set()
    for status, path in changes:
        if status == "D":
            continue
        if path in (CSS_SRC, CSS_MIN):
            names.add(os.path.basename(CSS_MIN))
        elif path.startswith("js/") and path.endswith(".js"):
            names.add(os.path.basename(path))
    if not names:
        report("PASS", "cache-key", "no css/js in this deploy")
        return
    bad = False
    for name in sorted(names):
        new, old = cache_tokens("HEAD", html_paths, name), cache_tokens(
            base, html_paths, name
        )
        if not new:
            continue  # loaded by another script or not referenced from HTML
        if "" in new:
            report(
                "WARN",
                "cache-key",
                "%s is linked with no ?v= on some page, browsers may hold the old copy up to 10 min"
                % name,
            )
        elif new & old:
            bad = True
            report(
                "FAIL",
                "cache-key",
                "%s changed but its ?v=%s did not. Bump ?v= on EVERY page that links it"
                % (name, sorted(new & old)[0]),
            )
        elif len(new) > 1:
            report(
                "WARN",
                "cache-key",
                "%s has mixed ?v= values across pages: %s"
                % (name, ", ".join(sorted(new))),
            )
    if not bad:
        report("PASS", "cache-key", "?v= bumped for: %s" % ", ".join(sorted(names)))


class RefParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.refs, self.jsonld, self._in_ld, self._buf = [], [], False, []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ("href", "src", "poster"):
            if a.get(key):
                self.refs.append(a[key])
        for key in ("srcset", "imagesrcset"):
            for part in (a.get(key) or "").split(","):
                if part.strip():
                    self.refs.append(part.strip().split()[0])
        if tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self._in_ld, self._buf = True, []

    def handle_data(self, data):
        if self._in_ld:
            self._buf.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._in_ld:
            self._in_ld = False
            self.jsonld.append("".join(self._buf))


def resolve(page, ref):
    """Map a local reference to a repo path, or None when it is not a local file."""
    ref = ref.strip()
    if not ref or ref.startswith(
        ("#", "mailto:", "tel:", "data:", "javascript:", "sms:", "//")
    ):
        return None
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", ref):
        if not ref.startswith(SITE):
            return None
        ref = ref[len(SITE) :] or "/"
    ref = ref.split("#")[0].split("?")[0]
    if not ref:
        return None
    if ref.startswith("/"):
        path = ref.lstrip("/")
    else:
        path = os.path.normpath(os.path.join(os.path.dirname(page), ref))
        if path == ".":
            path = ""
    if path.startswith(("cdn-cgi/", "..")):
        return None
    if path == "" or ref.endswith("/"):
        return (path.rstrip("/") + "/index.html").lstrip("/")
    return path


def gate_links(html_paths, tracked):
    tracked_set, missing, bad_ld = set(tracked), [], []
    for page in html_paths:
        parser = RefParser()
        parser.feed(blob(page).decode("utf-8", "replace"))
        for ref in parser.refs:
            path = resolve(page, ref)
            if (
                path
                and path not in tracked_set
                and path + "/index.html" not in tracked_set
            ):
                missing.append("%s -> %s" % (page, ref))
        for i, text in enumerate(parser.jsonld):
            try:
                json.loads(text)
            except ValueError as e:
                bad_ld.append("%s block %d: %s" % (page, i + 1, e))
    css = (blob(CSS_MIN) or b"").decode("utf-8", "replace")
    for ref in re.findall(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", css):
        if ref.startswith("%23"):
            continue  # "#id" filter ref inside an inline SVG data URI
        path = resolve(CSS_MIN, ref)
        if path and path not in tracked_set:
            missing.append("%s -> %s" % (CSS_MIN, ref))
    if missing:
        report(
            "FAIL",
            "links",
            "%d reference(s) point at files that are NOT committed, so they 404 live:"
            % len(missing),
        )
        for m in missing[:15]:
            print("                  %s" % m)
    else:
        report(
            "PASS",
            "links",
            "every local href/src/srcset/url() in %d pages resolves to a committed file"
            % len(html_paths),
        )
    if bad_ld:
        report("FAIL", "json-ld", "; ".join(bad_ld))
    else:
        report("PASS", "json-ld", "all JSON-LD blocks parse")


def gate_sitemap(tracked):
    data = (blob("sitemap.xml") or b"").decode("utf-8", "replace")
    locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", data)
    tracked_set = set(tracked)
    bad = [
        u
        for u in locs
        if not u.startswith(SITE) or resolve("sitemap.xml", u) not in tracked_set
    ]
    if not locs:
        report("FAIL", "sitemap", "sitemap.xml has no <loc> entries")
    elif bad:
        report(
            "FAIL",
            "sitemap",
            "sitemap lists pages that are not committed: %s" % ", ".join(bad),
        )
    else:
        report(
            "PASS", "sitemap", "%d sitemap URLs all map to committed pages" % len(locs)
        )


def run_check(base):
    tracked = git("ls-tree", "-r", "--name-only", "HEAD").splitlines()
    html_paths = [
        p
        for p in tracked
        if p.endswith(".html") and published(p) and not p.startswith(FORBIDDEN)
    ]
    changes = changed_files(base)
    print(
        "Outgoing: %d file(s) between %s and HEAD %s\n"
        % (len(changes), base, git("rev-parse", "--short", "HEAD").strip())
    )
    gate_branch()
    gate_dirty(tracked)
    gate_forbidden(tracked)
    gate_cname()
    gate_secrets(base)
    gate_size(changes)
    gate_unused_media(changes, tracked)
    gate_css(changes)
    gate_cache_keys(changes, base, html_paths)
    gate_links(html_paths, tracked)
    gate_sitemap(tracked)
    return changes


# ---------------------------------------------------------------- live proof

CF_SCRIPT = re.compile(
    rb'<script data-cfasync="false" src="/cdn-cgi/scripts/[^"]+/email-decode\.min\.js"></script>'
)
CF_HREF = re.compile(rb"/cdn-cgi/l/email-protection#([0-9a-f]+)")
CF_SPAN = re.compile(
    rb'<(?:span|a)[^>]*data-cfemail="([0-9a-f]+)"[^>]*>.*?</(?:span|a)>', re.S
)


def cf_decode(hexed):
    raw = bytes.fromhex(hexed.decode())
    return bytes(b ^ raw[0] for b in raw[1:])


def normalize(data):
    """Undo Cloudflare's email obfuscation so live HTML can be compared to the commit."""
    data = CF_SCRIPT.sub(b"", data)
    data = CF_HREF.sub(lambda m: b"mailto:" + cf_decode(m.group(1)), data)
    return CF_SPAN.sub(lambda m: cf_decode(m.group(1)), data)


def fetch(path):
    url = "%s/%s?cb=%d" % (SITE, path, int(time.time() * 1000))
    p = subprocess.run(
        [
            "curl",
            "-sS",
            "--max-time",
            "30",
            "-A",
            "cookflooring-deploy-check",
            "-o",
            "-",
            "-w",
            "\n%{http_code}",
            url,
        ],
        capture_output=True,
    )
    if p.returncode != 0:
        return 0, b""
    body, _, code = p.stdout.rpartition(b"\n")
    return int(code or 0), body


def live_matches(status, path):
    code, body = fetch(path)
    if status == "D":
        return code == 404, "http %d (want 404, file was removed)" % code
    want = blob(path)
    if path.endswith(".html"):
        body, want = normalize(body), normalize(want)
    return code == 200 and body == want, "http %d, %d bytes live vs %d committed" % (
        code,
        len(body),
        len(want),
    )


def pages_build(sha, wait):
    if not shutil.which("gh"):
        report(
            "WARN",
            "pages-build",
            "gh not found, skipping the build status, the byte check below is the real proof",
        )
        return True
    deadline = time.time() + wait
    while True:
        p = subprocess.run(
            ["gh", "api", "repos/%s/pages/builds/latest" % REPO], capture_output=True
        )
        try:
            info = json.loads(p.stdout)
        except ValueError:
            info = {}
        if info.get("commit") == sha and info.get("status") == "built":
            report(
                "PASS",
                "pages-build",
                "GitHub Pages built %s in %.0f s"
                % (sha[:7], (info.get("duration") or 0) / 1000.0),
            )
            return True
        if info.get("commit") == sha and info.get("status") == "errored":
            report(
                "FAIL",
                "pages-build",
                "GitHub Pages build ERRORED: %s"
                % (info.get("error") or {}).get("message"),
            )
            return False
        if time.time() > deadline:
            report(
                "WARN",
                "pages-build",
                "no finished build for %s after %d s (last seen: %s %s)"
                % (sha[:7], wait, (info.get("commit") or "?")[:7], info.get("status")),
            )
            return True
        time.sleep(8)


def verify_live(changes, wait):
    targets = [
        (s, p) for s, p in changes if published(p) and not p.startswith(FORBIDDEN)
    ]
    if not targets:
        report(
            "PASS",
            "live",
            "nothing in this range is a published file, nothing to prove",
        )
        return
    deadline, pending, detail = time.time() + wait, list(targets), {}
    while pending:
        still = []
        for status, path in pending:
            ok, detail[path] = live_matches(status, path)
            if not ok:
                still.append((status, path))
        pending = still
        if not pending or time.time() > deadline:
            break
        time.sleep(10)
    for status, path in targets:
        if (status, path) in pending:
            report(
                "FAIL",
                "live",
                "%s/%s does NOT match the commit: %s" % (SITE, path, detail[path]),
            )
    if not pending:
        report(
            "PASS",
            "live",
            "%d/%d published file(s) on %s are byte-equal to the commit"
            % (len(targets), len(targets), SITE),
        )


def write_receipt(sha, lines):
    folder = os.path.join(ROOT, ".reports", "deploys")
    os.makedirs(folder, exist_ok=True)
    name = "%s-%s.md" % (datetime.datetime.now().strftime("%Y-%m-%d-%H%M"), sha[:7])
    with open(os.path.join(folder, name), "w") as f:
        f.write("# Deploy %s\n\n```\n%s\n```\n" % (sha[:7], "\n".join(lines)))
    print("\nReceipt: .reports/deploys/%s (gitignored)" % name)


def failed():
    return "FAIL" in results


# ---------------------------------------------------------------- commands


def cmd_check():
    git("fetch", "--quiet", "origin", BRANCH, check=False)
    run_check("origin/%s" % BRANCH)


def cmd_build_css():
    p = subprocess.run(CLEANCSS + ["-o", CSS_MIN, CSS_SRC], cwd=ROOT)
    if p.returncode != 0:
        sys.exit("clean-css failed (needs network the first time)")
    print(
        "Built %s. Now bump ?v= on the stylesheet link in EVERY page, then commit both files."
        % CSS_MIN
    )
    for path in sorted(
        git("grep", "-l", "styles.min.css", "--", "*.html", check=False).splitlines()
    ):
        print("  %s" % path)


def cmd_ship():
    p = subprocess.run(["git", "-C", ROOT, "fetch", "--quiet", "origin", BRANCH])
    if p.returncode != 0:
        sys.exit(
            "FAIL fetch: cannot reach GitHub. In Codex this needs network approval for the command."
        )
    base = "origin/%s" % BRANCH
    changes = run_check(base)
    if (
        subprocess.run(
            ["git", "-C", ROOT, "merge-base", "--is-ancestor", base, "HEAD"]
        ).returncode
        != 0
    ):
        report(
            "FAIL",
            "fast-forward",
            "%s has commits you do not. Run: git pull --rebase origin %s. Never force-push this repo"
            % (base, BRANCH),
        )
    if failed():
        print("\nHOLD. Nothing was pushed.")
        return
    sha = git("rev-parse", "HEAD").strip()
    if not changes:
        print("\nNothing to push. Proving the last commit is live instead.")
        changes = changed_files("HEAD~1")
    else:
        push = subprocess.run(
            ["git", "-C", ROOT, "push", "origin", "HEAD:refs/heads/%s" % BRANCH]
        )
        if push.returncode != 0:
            report("FAIL", "push", "git push was rejected, see the message above")
            return
        report("PASS", "push", "pushed %s to origin/%s" % (sha[:7], BRANCH))
    if pages_build(sha, 300):
        verify_live(changes, 240)
    print(
        "\n%s"
        % (
            "HOLD. Pushed, but NOT proven live. Do not report this as deployed."
            if failed()
            else "SHIPPED and proven live: %s" % sha[:7]
        )
    )


def cmd_verify_live():
    if "--all" in sys.argv:
        tracked = git("ls-tree", "-r", "--name-only", "HEAD").splitlines()
        changes = [("M", p) for p in tracked if p.endswith(TEXT_EXT[:5])]
    else:
        changes = changed_files("HEAD~1")
    local, remote = (
        git("rev-parse", "HEAD").strip(),
        git("rev-parse", "origin/%s" % BRANCH).strip(),
    )
    if local != remote:
        report(
            "WARN",
            "live",
            "HEAD %s is not pushed yet (origin/%s is %s), mismatches are expected"
            % (local[:7], BRANCH, remote[:7]),
        )
    verify_live(changes, 0)


def main():
    commands = {
        "check": cmd_check,
        "build-css": cmd_build_css,
        "ship": cmd_ship,
        "verify-live": cmd_verify_live,
    }
    name = sys.argv[1] if len(sys.argv) > 1 else ""
    if name not in commands:
        sys.exit(__doc__)
    commands[name]()
    if name == "ship":
        write_receipt(git("rev-parse", "HEAD").strip(), receipt)
    if name != "build-css" and name != "ship":
        print(
            "\n%s"
            % (
                "HOLD: fix every FAIL above."
                if failed()
                else "CLEAR: all gates passed."
            )
        )
    sys.exit(1 if failed() else 0)


if __name__ == "__main__":
    main()
