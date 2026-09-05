// Lead tracking shared by the homepage and every service page.
//   1. Phone taps: any tel: link fires the Google Ads "Website phone tap"
//      conversion before the dialer opens. Uses event delegation so links
//      injected by <service-header>/<service-footer> are covered too.
//   2. Click-ID passthrough: when the visitor arrived from an ad (gclid /
//      gbraid / wbraid / utm_*), those params are copied onto every same-site
//      link before it navigates, so the ID survives the hop from a service
//      page to the homepage quote form and the lead is credited to the ad.
// The quote-form conversion itself lives in quote-form.js.
(function () {
  const websitePhoneTapConversion = "AW-18284708507/wkVlCLD-utEcEJuF6o5E";
  const passthroughParams = [
    "gclid",
    "gbraid",
    "wbraid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];

  function sendTrackingEvent(name, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  }

  function trackAdsConversion(destination, label, callback) {
    let completed = false;
    const done = () => {
      if (completed) return;
      completed = true;
      if (typeof callback === "function") callback();
    };

    if (typeof window.gtag !== "function") {
      done();
      return;
    }

    sendTrackingEvent("conversion", {
      send_to: destination,
      value: 1.0,
      currency: "USD",
      event_label: label,
      event_callback: done,
      event_timeout: 800,
    });

    window.setTimeout(done, 900);
  }

  // --- 1. Phone tap conversion -------------------------------------------
  document.addEventListener("click", (e) => {
    const link = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!link) return;
    const href = link.getAttribute("href");
    sendTrackingEvent("phone_click", {
      event_category: "lead",
      event_label: href,
    });
    if (!href) return;
    e.preventDefault();
    trackAdsConversion(websitePhoneTapConversion, "Website phone tap", () => {
      window.location.href = href;
    });
  });

  // --- 2. Click-ID passthrough --------------------------------------------
  const incoming = new URLSearchParams(window.location.search);
  const carried = passthroughParams
    .map((name) => [name, incoming.get(name)])
    .filter(([, value]) => value);
  if (!carried.length) return;

  function decorate(link) {
    const raw = link.getAttribute("href");
    if (!raw) return;
    if (/^(tel:|mailto:|sms:|javascript:|#)/i.test(raw)) return;
    let url;
    try {
      url = new URL(raw, window.location.href);
    } catch (_) {
      return;
    }
    if (url.origin !== window.location.origin) return;
    let changed = false;
    carried.forEach(([name, value]) => {
      if (url.searchParams.has(name)) return;
      url.searchParams.set(name, value);
      changed = true;
    });
    if (changed) link.setAttribute("href", url.href);
  }

  // Decorate at click time (covers links injected after load) and also at
  // load time so long-press / copy-link / middle-click carry the ID too.
  document.addEventListener(
    "click",
    (e) => {
      const link = e.target.closest && e.target.closest("a[href]");
      if (link) decorate(link);
    },
    true,
  );
  document.querySelectorAll("a[href]").forEach(decorate);
})();
