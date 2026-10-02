// Load the Google tag on every page, including visits without an interaction.
// Keep the verified Ads destination and conversion labels in sync with Ads.
(function () {
  if (window.cookTrackingInitialized) return;
  window.cookTrackingInitialized = true;

  const trackingId = "AW-18284708507";

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  window.gtag("js", new Date());
  window.gtag("config", trackingId);

  // A duplicate inclusion must not add another library or config command.
  if (!document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + trackingId;
    document.head.appendChild(script);
  }
})();
