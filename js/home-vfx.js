/* Homepage v3 effects. Purely decorative: every effect is skipped under
   prefers-reduced-motion, pauses when off screen, and never blocks input.
   - Hero: dust drifting in window light (canvas), a light sweep across the
     finish, and a soft light that follows the cursor.
   - Plank wipe: photos are revealed by strips that slide off in a running
     bond, like boards being laid.
   - Magnetic gold buttons, and a velocity skew on the sideways gallery. */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const doc = document;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- Hero dust ---- */
  const hero = doc.querySelector(".hero3");
  const media = hero && hero.querySelector(".hero3__media");
  if (hero && media) {
    const light = doc.createElement("div");
    light.className = "hero3__light";
    const sheen = doc.createElement("div");
    sheen.className = "hero3__sheen";
    const canvas = doc.createElement("canvas");
    canvas.className = "hero3__dust";
    media.append(sheen, canvas, light);

    const ctx = canvas.getContext("2d");
    let w = 0,
      h = 0,
      dpr = 1,
      motes = [],
      running = false,
      raf = 0;
    const rand = (a, b) => a + Math.random() * (b - a);
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, (w * h) / 14000));
      motes = Array.from({ length: count }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(0.4, 1.9),
        vx: rand(-0.06, 0.12),
        vy: rand(-0.22, -0.05),
        ph: rand(0, Math.PI * 2),
        tw: rand(0.004, 0.018),
        gold: Math.random() < 0.55,
      }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.ph += m.tw;
        m.x += m.vx + Math.sin(m.ph) * 0.12;
        m.y += m.vy;
        if (m.y < -4) {
          m.y = h + 4;
          m.x = rand(0, w);
        }
        if (m.x > w + 4) m.x = -4;
        if (m.x < -4) m.x = w + 4;
        // brighter inside the window light (upper left toward centre)
        const beam = Math.max(
          0,
          1 - Math.hypot(m.x / w - 0.32, m.y / h - 0.35) * 1.6,
        );
        const a = (0.18 + 0.55 * beam) * (0.55 + 0.45 * Math.sin(m.ph * 2));
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = m.gold
          ? `rgba(242, 201, 110, ${a})`
          : `rgba(255, 246, 228, ${a * 0.8})`;
        ctx.fill();
      }
      raf = running ? requestAnimationFrame(frame) : 0;
    };
    size();
    window.addEventListener("resize", size);
    new IntersectionObserver((es) => {
      running = es[0].isIntersecting && !doc.hidden;
      if (running && !raf) raf = requestAnimationFrame(frame);
    }).observe(hero);

    if (fine) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        light.style.setProperty(
          "--lx",
          ((e.clientX - r.left) / r.width) * 100 + "%",
        );
        light.style.setProperty(
          "--ly",
          ((e.clientY - r.top) / r.height) * 100 + "%",
        );
        light.classList.add("is-on");
      });
      hero.addEventListener("pointerleave", () =>
        light.classList.remove("is-on"),
      );
    }
  }

  /* ---- Plank wipe on photos ---- */
  const wipeTargets = doc.querySelectorAll(
    ".work3__rail figure, .decks3__grid figure, .compare, .craft__video, .craft__inset",
  );
  const STRIPS = 6;
  const wipeIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-laid");
        wipeIO.unobserve(en.target);
      });
    },
    { threshold: 0.18 },
  );
  wipeTargets.forEach((el) => {
    const planks = doc.createElement("span");
    planks.className = "planks";
    planks.setAttribute("aria-hidden", "true");
    for (let i = 0; i < STRIPS; i++) {
      const s = doc.createElement("i");
      s.style.setProperty("--i", i);
      planks.appendChild(s);
    }
    el.appendChild(planks);
    wipeIO.observe(el);
  });
  // strips are removed once they have finished sliding away
  doc.addEventListener("transitionend", (e) => {
    const p = e.target.parentElement;
    if (p && p.classList.contains("planks") && e.target === p.lastElementChild)
      p.remove();
  });

  /* ---- Magnetic gold buttons ---- */
  if (fine) {
    doc.querySelectorAll(".pill--gold, .quote-submit").forEach((btn) => {
      btn.classList.add("is-magnetic");
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
        btn.style.setProperty(
          "--gx",
          ((e.clientX - r.left) / r.width) * 100 + "%",
        );
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---- Gallery leans with scroll speed ---- */
  const work = doc.getElementById("work");
  const rail = doc.querySelector("[data-work-rail]");
  if (work && rail) {
    let lastY = window.scrollY,
      skew = 0,
      raf = 0;
    const settle = () => {
      skew *= 0.88;
      rail.style.setProperty("--skew", skew.toFixed(2) + "deg");
      raf = Math.abs(skew) > 0.02 ? requestAnimationFrame(settle) : 0;
    };
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        const v = y - lastY;
        lastY = y;
        if (!work.classList.contains("is-pinned")) return;
        skew = Math.max(-5, Math.min(5, skew + v * -0.04));
        if (!raf) raf = requestAnimationFrame(settle);
      },
      { passive: true },
    );
  }
})();
