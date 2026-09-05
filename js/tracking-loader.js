// Google Ads tag loader.
//   - Normal visitors: gtag.js loads on the first interaction (perf pass, 08-23).
//   - Ad visitors (URL carries gclid / gbraid / wbraid): gtag.js loads
//     immediately so the conversion-linker cookie is written before they can
//     click away to another page. Without this, a click on a service page CTA
//     navigates before the deferred tag ever finishes loading, and the ad
//     click is never linked to the lead.
(function () {
  const trackingId = "AW-18284708507";
  const adClickParams = ["gclid", "gbraid", "wbraid"];
  let loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  window.gtag("js", new Date());
  window.gtag("config", trackingId);

  const interactionEvents = ["pointerdown", "keydown", "touchstart"];

  function loadTracking() {
    if (loaded) return;
    loaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + trackingId;
    document.head.appendChild(script);
    interactionEvents.forEach((name) => {
      document.removeEventListener(name, loadTracking, true);
    });
  }

  function hasAdClickId() {
    const params = new URLSearchParams(window.location.search);
    return adClickParams.some((name) => params.get(name));
  }

  if (hasAdClickId()) {
    loadTracking();
    return;
  }

  interactionEvents.forEach((name) => {
    document.addEventListener(name, loadTracking, {
      capture: true,
      once: true,
      passive: true,
    });
  });
})();
