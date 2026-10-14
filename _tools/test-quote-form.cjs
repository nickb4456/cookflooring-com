// Regression checks for real quote-form markup and scripts. All remote requests
// are intercepted: this test NEVER submits a lead to Formspree or sends email.
// Requires Playwright + Chromium. Run: node _tools/test-quote-form.cjs
// Optional: CHROMIUM_EXECUTABLE=/path/to/chromium QUOTE_TEST_URL=http://localhost:8000
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const calculator = "/guides/hardwood-floor-cost-calculator/?job=install";
const synthetic = {
  name: "SYNTHETIC TEST — not a customer",
  phone: "(202) 555-0147",
  town: "Cranston, RI — SYNTHETIC TEST",
  project_type: "Hardwood install",
};

(async () => {
  let server;
  let base = process.env.QUOTE_TEST_URL;
  if (!base) {
    server = http.createServer((req, res) => {
      let file = path.join(root, decodeURIComponent(new URL(req.url, "http://test").pathname));
      if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[path.extname(file)];
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404).end(); return; }
        res.writeHead(200, { "Content-Type": type || "application/octet-stream" }).end(data);
      });
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    base = "http://127.0.0.1:" + server.address().port;
  }
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
  });
  let checks = 0;
  async function scenario(label, viewport, run, options = {}) {
    const context = await browser.newContext({ viewport, ...options });
    const page = await context.newPage();
    const posts = [];
    let respond = route => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    await context.route("**/*", async route => {
      const req = route.request();
      if (req.method() === "POST") {
        const data = await new Request(req.url(), {
          method: "POST", headers: req.headers(), body: req.postDataBuffer(),
        }).formData();
        posts.push(Object.fromEntries(data));
        return respond(route);
      }
      if (new URL(req.url()).origin === new URL(base).origin) return route.continue();
      return route.abort();
    });
    await page.addInitScript(() => {
      window.__quoteEvents = [];
      window.gtag = (...args) => window.__quoteEvents.push(args);
    });
    const open = url => page.goto(base + (url || calculator));
    const fill = async (values = synthetic) => {
      for (const [name, value] of Object.entries(values)) {
        const el = page.locator('#quoteForm [name="' + name + '"]');
        if (["project_type", "preferred_call_time"].includes(name)) await el.selectOption(value);
        else await el.fill(value);
      }
    };
    const dispatch = () => page.evaluate(() => document.getElementById("quoteForm")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    const sent = () => page.locator("#quoteCard").evaluate(el => el.classList.contains("is-sent"));
    const settled = () => page.waitForFunction(() => document.getElementById("quoteForm").getAttribute("aria-busy") === "false");
    const noSuccess = async () => {
      assert.equal(await sent(), false);
      assert.equal(await page.locator(".quote-submit").isEnabled(), true);
      const events = await page.evaluate(() => window.__quoteEvents);
      assert.equal(events.some(x => ["conversion", "generate_lead"].includes(x[1])), false);
    };
    try {
      await run({ page, posts, open, fill, dispatch, sent, settled, noSuccess, reply: fn => { respond = fn; } });
      checks++;
      console.log("PASS", viewport.width, label);
    } finally { await context.close(); }
  }
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await scenario("native empty click is blocked", viewport, async t => {
        await t.open(); await t.page.locator(".quote-submit").click();
        assert.equal(t.posts.length, 0); await t.noSuccess();
      });
      await scenario("script-dispatched empty submit is blocked", viewport, async t => {
        await t.open(); await t.dispatch();
        await t.page.waitForTimeout(150);
        assert.equal(t.posts.length, 0); await t.noSuccess();
        assert.match(await t.page.locator(".quote-status").innerText(), /required|contact/i);
        if (process.env.QUOTE_SCREENSHOT_DIR) {
          fs.mkdirSync(process.env.QUOTE_SCREENSHOT_DIR, { recursive: true });
          await t.page.locator(".quote-status").scrollIntoViewIfNeeded();
          await t.page.screenshot({ path: path.join(process.env.QUOTE_SCREENSHOT_DIR, viewport.width + "-validation.png") });
        }
      });
      for (const name of ["name", "phone", "town", "project_type"]) {
        await scenario("required " + name, viewport, async t => {
          await t.open(); await t.fill();
          await t.page.locator('[name="' + name + '"]').evaluate(el => { el.value = ""; });
          await t.dispatch(); await t.page.waitForTimeout(150);
          assert.equal(t.posts.length, 0); await t.noSuccess();
        });
      }
      await scenario("whitespace-only contact is blocked and recoverable", viewport, async t => {
        await t.open(); await t.fill({ ...synthetic, name: "   ", phone: "   ", town: "   " });
        await t.page.locator(".quote-submit").click();
        await t.page.waitForTimeout(150); assert.equal(t.posts.length, 0); await t.noSuccess();
        await t.fill(); await t.page.locator(".quote-submit").click(); await t.settled();
        assert.equal(t.posts.length, 1); assert.equal(await t.sent(), true);
      });
      await scenario("invalid optional email is blocked", viewport, async t => {
        await t.open(); await t.fill({ ...synthetic, email: "bad-email" }); await t.dispatch();
        await t.page.waitForTimeout(150); assert.equal(t.posts.length, 0); await t.noSuccess();
      });
      await scenario("honeypot never sends or reports success", viewport, async t => {
        await t.open(); await t.fill();
        assert.equal(await t.page.locator('[name="_gotcha"]').isVisible(), false);
        await t.page.locator('[name="_gotcha"]').evaluate(el => { el.value = "automated junk"; });
        await t.dispatch(); await t.page.waitForTimeout(150);
        assert.equal(t.posts.length, 0); await t.noSuccess();
      });
      await scenario("valid details, calculator handoff, and one POST", viewport, async t => {
        await t.open(); await t.page.locator("[data-calc-send]").first().click();
        await t.fill({ ...synthetic, email: "synthetic-test@example.com", preferred_call_time: "Afternoon, noon–4 PM" });
        await t.page.locator(".quote-submit").click(); await t.settled();
        assert.equal(t.posts.length, 1);
        assert.equal(await t.sent(), true);
        for (const [name, value] of Object.entries(synthetic)) assert.equal(t.posts[0][name], value);
        assert.equal(t.posts[0].email, "synthetic-test@example.com");
        assert.equal(t.posts[0].preferred_call_time, "Afternoon, noon–4 PM");
        assert.match(t.posts[0].details, /install new hardwood.*300 sq ft/);
        assert.equal(t.posts[0].source_url, base + calculator);
        assert.equal(t.posts[0]._gotcha, "");
        await t.dispatch(); assert.equal(t.posts.length, 1);
        const events = await t.page.evaluate(() => window.__quoteEvents);
        assert.equal(events.filter(x => x[1] === "generate_lead").length, 1);
      });
      await scenario("in-flight duplicate events produce one POST", viewport, async t => {
        let release;
        const held = new Promise(resolve => { release = resolve; });
        t.reply(async route => { await held; return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }); });
        await t.open(); await t.fill(); await t.page.locator(".quote-submit").click();
        await t.page.waitForTimeout(50);
        assert.equal(await t.page.locator(".quote-submit").isEnabled(), false);
        await t.dispatch(); await t.dispatch(); assert.equal(t.posts.length, 1);
        release(); await t.settled(); assert.equal(await t.sent(), true);
        assert.equal(t.posts[0].email, ""); // Email remains optional.
      });
      const failures = [
        ["validation error", route => route.fulfill({ status: 422, contentType: "application/json", body: '{"errors":[{"field":"phone","message":"Required"}]}' })],
        ["server error", route => route.fulfill({ status: 500, body: "failed" })],
        ["network error", route => route.abort("failed")],
        ["200 HTML challenge", route => route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Verify your browser</h1>" })],
        ["200 unconfirmed JSON", route => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false}' })],
        ["200 JSON containing errors", route => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true,"errors":[{"message":"not accepted"}]}' })],
      ];
      for (const [label, reply] of failures) {
        await scenario(label + " preserves details and allows retry", viewport, async t => {
          t.reply(reply); await t.open(); await t.fill();
          await t.page.locator(".quote-submit").click(); await t.settled();
          assert.equal(t.posts.length, 1); await t.noSuccess();
          assert.equal(await t.page.locator("#qName").inputValue(), synthetic.name);
          assert.match(await t.page.locator(".quote-status").innerText(), /couldn’t confirm.*401/);
          t.reply(route => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
          await t.page.locator(".quote-submit").click(); await t.settled();
          assert.equal(t.posts.length, 2); assert.equal(await t.sent(), true);
        });
      }
      await scenario("timeout never reports success", viewport, async t => {
        await t.page.addInitScript(() => {
          const original = window.setTimeout;
          window.setTimeout = (fn, ms, ...args) => original(fn, ms === 12000 ? 100 : ms, ...args);
        });
        t.reply(() => {}); await t.open(); await t.fill();
        await t.page.locator(".quote-submit").click(); await t.settled();
        assert.equal(t.posts.length, 1); await t.noSuccess();
        assert.match(await t.page.locator(".quote-status").innerText(), /couldn’t confirm/);
      });
      for (const url of ["/", "/service-area/cranston-ri/"]) {
        await scenario("shared handler on " + url, viewport, async t => {
          await t.open(url); await t.fill(); await t.page.locator(".quote-submit").click(); await t.settled();
          assert.equal(t.posts.length, 1); assert.equal(await t.sent(), true);
        });
      }
      await scenario("generic HTTPS endpoint contract preserved", viewport, async t => {
        await t.page.route("**/guides/hardwood-floor-cost-calculator/?job=install", async route => {
          const html = fs.readFileSync(path.join(root, "guides/hardwood-floor-cost-calculator/index.html"), "utf8");
          await route.fulfill({ status: 200, contentType: "text/html", body: html.replace("https://formspree.io/f/mgogwyoz", "https://synthetic.invalid/quote") });
        });
        t.reply(route => route.fulfill({ status: 204, body: "" }));
        await t.open(); await t.fill(); await t.page.locator(".quote-submit").click(); await t.settled();
        assert.equal(t.posts.length, 1); assert.equal(await t.sent(), true);
      });
      await scenario("missing endpoint opens draft without success", viewport, async t => {
        await t.page.route("**/guides/hardwood-floor-cost-calculator/?job=install", async route => {
          const html = fs.readFileSync(path.join(root, "guides/hardwood-floor-cost-calculator/index.html"), "utf8");
          await route.fulfill({ status: 200, contentType: "text/html", body: html.replace("https://formspree.io/f/mgogwyoz", "") });
        });
        await t.open(); await t.fill(); await t.page.locator(".quote-submit").click(); await t.settled();
        assert.equal(t.posts.length, 0); await t.noSuccess();
        assert.match(await t.page.locator(".quote-status").innerText(), /Send it to complete/);
      });
      await scenario("native no-JavaScript form still validates and posts", viewport, async t => {
        await t.open(); await t.page.locator(".quote-submit").press("Enter"); assert.equal(t.posts.length, 0);
        await t.fill(); await t.page.locator(".quote-submit").press("Enter");
        await t.page.waitForURL("https://formspree.io/**");
        assert.equal(t.posts.length, 1);
        assert.equal(t.posts[0].phone, synthetic.phone);
        assert.equal(t.posts[0]._gotcha, "");
      }, { javaScriptEnabled: false });
    }
  } finally {
    await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
  console.log(checks + " quote form scenarios passed. No live leads sent.");
})().catch(err => { console.error(err); process.exitCode = 1; });
