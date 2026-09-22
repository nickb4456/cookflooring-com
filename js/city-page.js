// Declare readiness once above-the-fold images, fonts, and layout have settled.
// FAQs and contact links work without this enhancement.
(async function () {
  const images = [...document.querySelectorAll('img:not([loading="lazy"])')];
  await Promise.all(images.map((img) => img.decode().catch(() => {})));
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__done = images.every((img) => img.naturalWidth > 0);
  }));
})();
