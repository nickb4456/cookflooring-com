#!/bin/bash
# Proves the deploy gates really FAIL on bad commits. Works in a throwaway
# clone under /tmp; never touches this repo. Run after editing deploy.py.
set -u
SRC="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d /tmp/cf-gate-test.XXXXXX)"
trap 'rm -rf "$T"' EXIT
git clone --quiet --shared "$SRC" "$T/r" || exit 2
cd "$T/r" || exit 2
mkdir -p _tools && cp "$SRC/_tools/deploy.py" _tools/
git config user.email selftest@local && git config user.name selftest
# The clone's "origin/main" is the local main, so each case is one bad commit on top.
git rm -r --quiet --cached scratchpad .reports 2>/dev/null && git commit -qm "untrack internal" && git update-ref refs/remotes/origin/main HEAD

pass=0; fail=0
expect() { # expect "<case name>" "<regex that must appear in check output>"
  out="$(./_tools/deploy.py check 2>&1)"
  if echo "$out" | grep -Eq "$2"; then pass=$((pass+1)); echo "ok    $1"
  else fail=$((fail+1)); echo "WRONG $1"; echo "$out" | sed 's/^/        /'; fi
  git switch --quiet main 2>/dev/null; git reset --quiet --hard origin/main; git clean -qfd -e _tools
}
pages() { git ls-files '*.html' | grep -v '^scratchpad'; }

expect "clean tree is CLEAR" "^CLEAR"

echo "/* x */" >> css/styles.css; git commit -qam c
expect "styles.css edited, min not rebuilt -> FAIL css" "^FAIL css"

echo "// x" >> js/quote-form.js; git commit -qam c
expect "js edited, ?v= not bumped -> FAIL cache-key" "^FAIL cache-key"

echo "// x" >> js/lead-tracking.js
pages | xargs sed -i '' -e 's/lead-tracking.js?v=[0-9a-z]*/lead-tracking.js?v=selftest1/' 2>/dev/null || pages | xargs sed -i -e 's/lead-tracking.js?v=[0-9a-z]*/lead-tracking.js?v=selftest1/'
git commit -qam c
expect "js edited, ?v= bumped on every page -> PASS cache-key" "^PASS cache-key"

echo "// x" >> js/lead-tracking.js
sed -i.bak -e 's/lead-tracking.js?v=[0-9a-z]*/lead-tracking.js?v=selftest2/' index.html && rm -f index.html.bak
git commit -qam c
expect "js edited, ?v= bumped on ONE page only -> FAIL cache-key" "^FAIL cache-key"

sed -i.bak -e 's#</body>#<img src="assets/never-committed.jpg"></body>#' index.html && rm -f index.html.bak
git commit -qam c
expect "page uses a photo that was never committed -> FAIL links" "^FAIL links"

# Built at run time so this file itself holds no key-shaped text.
echo "token = ghp""_$(printf 'a%.0s' $(seq 1 36))" >> llms.txt; git commit -qam c
expect "key-shaped text added -> FAIL secrets" "^FAIL secrets"

sed -i.bak -e 's#/services/deck-builder-ri/#/services/nope/#' sitemap.xml && rm -f sitemap.xml.bak
git commit -qam c
expect "sitemap lists a missing page -> FAIL sitemap" "^FAIL sitemap"

sed -i.bak -e '1,/"@context"/s/"@context"/"@context" oops/' index.html && rm -f index.html.bak
git commit -qam c
expect "JSON-LD broken -> FAIL json-ld" "^FAIL json-ld"

mkdir -p scratchpad && echo "internal" > scratchpad/ads-notes.md && git add -f scratchpad/ads-notes.md && git commit -qm c
expect "internal file force-added -> FAIL private" "^FAIL private"

echo "other.com" > CNAME; git commit -qam c
expect "CNAME changed -> FAIL cname" "^FAIL cname"

git switch --quiet -c codex/selftest
expect "on a codex/ branch -> FAIL branch" "^FAIL branch"

echo; echo "selftest: $pass ok, $fail wrong"
[ "$fail" -eq 0 ]
