(function () {
  const trackingId = "AW-18284708507";
  let loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", trackingId);

  function loadTracking() {
    if (loaded) return;
    loaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + trackingId;
    document.head.appendChild(script);
    ["pointerdown", "keydown", "touchstart"].forEach((name) => {
      document.removeEventListener(name, loadTracking, true);
    });
  }

  ["pointerdown", "keydown", "touchstart"].forEach((name) => {
    document.addEventListener(name, loadTracking, { capture: true, once: true, passive: true });
  });
})();
