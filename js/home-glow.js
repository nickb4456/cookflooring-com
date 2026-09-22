/* Feeds pointer positions to the CSS glows in home-v3.css:
   dark sections (--gx/--gy) and the footer wordmark spotlight (--fx/--fy).
   The wordmark light drifts on its own when no pointer is over it. */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (fine) {
    document.querySelectorAll(".diff, .craft, .funnel3").forEach((sec) => {
      sec.addEventListener("pointermove", (e) => {
        const r = sec.getBoundingClientRect();
        sec.style.setProperty("--gx", e.clientX - r.left + "px");
        sec.style.setProperty("--gy", e.clientY - r.top + "px");
      });
    });
  }

  const foot = document.querySelector(".foot3");
  const word = document.querySelector(".foot3__word");
  if (!foot || !word) return;
  let hover = false, visible = false, raf = 0, t = 0;
  const drift = () => {
    t += 0.006;
    if (!hover) {
      word.style.setProperty("--fx", 50 + Math.sin(t) * 38 + "%");
      word.style.setProperty("--fy", 55 + Math.sin(t * 1.7) * 25 + "%");
    }
    raf = visible ? requestAnimationFrame(drift) : 0;
  };
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(drift);
  }).observe(word);
  if (fine) {
    foot.addEventListener("pointermove", (e) => {
      const r = word.getBoundingClientRect();
      hover = true;
      word.style.setProperty("--fx", e.clientX - r.left + "px");
      word.style.setProperty("--fy", e.clientY - r.top + "px");
    });
    foot.addEventListener("pointerleave", () => (hover = false));
  }
})();
