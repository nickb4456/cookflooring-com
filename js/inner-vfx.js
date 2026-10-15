/* Inner-page effects in the homepage's language (css/inner-v3.css).
   Purely decorative: content is visible without this file, every moving
   effect is skipped under prefers-reduced-motion, loops pause off screen,
   and nothing here blocks input.
   - Header: shrinks after the top, a gold line fills as you read.
   - Hero: headline words rise; dust drifts in the window light; a light
     sweep crosses the finish; a soft light follows the cursor.
   - Photos are uncovered by planks sliding away in a running bond.
   - Sections, cards, list items, and table rows rise in as they arrive.
   - Gold buttons lean toward the pointer; dark rooms carry a gold glow.
   - The footer ends with the lit "Cook." wordmark.
   - Guides: the contents box marks the section you are reading. */
(function () {
  "use strict";
  const doc = document;
  const body = doc.body;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasIO = "IntersectionObserver" in window;

  /* ---- Header: shrink + reading line ---- */
  const hdr = doc.querySelector(".sitehdr");
  if (hdr) {
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY;
      hdr.classList.toggle("is-scrolled", y > 40);
      const max = doc.documentElement.scrollHeight - window.innerHeight;
      hdr.style.setProperty("--read", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onScroll);
        }
      },
      { passive: true },
    );
    onScroll();
  }

  /* ---- Footer wordmark (decorative) ---- */
  const footWrap = doc.querySelector(".service-footer .wrap, body.city-page footer .wrap");
  let word = null;
  if (footWrap && !footWrap.querySelector(".v3i-word")) {
    word = doc.createElement("div");
    word.className = "v3i-word";
    word.setAttribute("aria-hidden", "true");
    word.innerHTML = "Cook<b>.</b>";
    footWrap.appendChild(word);
  }

  /* ---- Guides: contents marks the section in view ---- */
  const toc = doc.querySelector(".guide-toc");
  if (toc && hasIO) {
    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    const map = new Map();
    links.forEach((a) => {
      const t = doc.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
      if (t) map.set(t, a);
    });
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((l) => l.classList.remove("is-current"));
          const a = map.get(en.target);
          if (a) a.classList.add("is-current");
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    map.forEach((_, t) => spy.observe(t));
  }

  /* ---- The homepage's town ticker along the foot of the hero ---- */
  const tickHost = doc.querySelector(".service-hero, .city-hero");
  if (tickHost && !tickHost.querySelector(".v3i-ticker")) {
    const towns = ["Providence", "Cranston", "Warwick", "East Greenwich", "North Kingstown", "Johnston", "Coventry", "West Warwick"];
    const tick = doc.createElement("div");
    tick.className = "v3i-ticker";
    tick.setAttribute("aria-hidden", "true");
    const track = doc.createElement("div");
    track.className = "v3i-ticker__track";
    towns.concat(towns).forEach((t) => {
      const s = doc.createElement("span");
      s.textContent = t;
      track.appendChild(s);
    });
    tick.appendChild(track);
    tickHost.appendChild(tick);
  }

  if (reduce) return;

  /* ---- Headline words rise out of a mask ---- */
  const h1 = doc.querySelector(
    ".service-hero h1, .city-hero h1, .guide-article > h1, .guide-hub > h1, .calc-hero h1",
  );
  if (h1 && !h1.querySelector(".vw")) {
    let n = 0;
    const wrapText = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const parts = c.textContent.split(/(\s+)/);
          const frag = doc.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              frag.appendChild(doc.createTextNode(p));
              return;
            }
            const w = doc.createElement("span");
            w.className = "vw";
            const i = doc.createElement("i");
            i.style.setProperty("--wi", n++);
            i.textContent = p;
            w.appendChild(i);
            frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== "BR") {
          wrapText(c);
        }
      });
    };
    wrapText(h1);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add("is-ready")));

  /* ---- Dust in the window light (canvas) ---- */
  const dust = (canvas, host, beamX, beamY) => {
    const ctx = canvas.getContext("2d");
    let w = 0,
      h = 0,
      motes = [],
      running = false,
      raf = 0;
    const rand = (a, b) => a + Math.random() * (b - a);
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        const beam = Math.max(0, 1 - Math.hypot(m.x / w - beamX, m.y / h - beamY) * 1.6);
        const a = (0.18 + 0.55 * beam) * (0.55 + 0.45 * Math.sin(m.ph * 2));
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = m.gold ? `rgba(242, 201, 110, ${a})` : `rgba(255, 246, 228, ${a * 0.8})`;
        ctx.fill();
      }
      raf = running ? requestAnimationFrame(frame) : 0;
    };
    size();
    window.addEventListener("resize", size);
    if (hasIO) {
      new IntersectionObserver((es) => {
        running = es[0].isIntersecting && !doc.hidden;
        if (running && !raf) raf = requestAnimationFrame(frame);
      }).observe(host);
    }
    return size;
  };

  /* ---- Hero room: photo heroes ---- */
  const hero = doc.querySelector(".service-hero, .city-hero");
  const photo = hero && hero.querySelector(".service-photo, .city-hero__photo");
  if (hero && photo) {
    const sheen = doc.createElement("div");
    sheen.className = "v3i-sheen";
    const canvas = doc.createElement("canvas");
    canvas.className = "v3i-dust";
    const light = doc.createElement("div");
    light.className = "v3i-light";
    [sheen, canvas, light].forEach((el) => el.setAttribute("aria-hidden", "true"));
    photo.append(sheen, canvas, light);
    dust(canvas, hero, 0.32, 0.35);
    if (fine) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        light.style.setProperty("--lx", ((e.clientX - r.left) / r.width) * 100 + "%");
        light.style.setProperty("--ly", ((e.clientY - r.top) / r.height) * 100 + "%");
        light.classList.add("is-on");
      });
      hero.addEventListener("pointerleave", () => light.classList.remove("is-on"));
    }
  }

  /* ---- Dark band on guide pages: dust and a gold glow ---- */
  const bandEnd = doc.querySelector(".guide-article > .block__lead, .guide-hub > .block__lead");
  const main = doc.querySelector(".service-main");
  if (bandEnd && main) {
    const band = doc.createElement("div");
    band.className = "v3i-band";
    band.setAttribute("aria-hidden", "true");
    const canvas = doc.createElement("canvas");
    band.appendChild(canvas);
    main.prepend(band);
    let resizeDust = null;
    const fit = () => {
      const mr = main.getBoundingClientRect();
      const br = bandEnd.getBoundingClientRect();
      band.style.height = Math.max(0, br.bottom - mr.top) + "px";
      if (resizeDust) resizeDust();
    };
    fit();
    resizeDust = dust(canvas, band, 0.7, 0.3);
    window.addEventListener("resize", fit);
    window.addEventListener("load", fit, { once: true });
    if (fine) {
      main.addEventListener("pointermove", (e) => {
        const r = band.getBoundingClientRect();
        band.style.setProperty("--gx", e.clientX - r.left + "px");
        band.style.setProperty("--gy", e.clientY - r.top + "px");
      });
    }
  }

  /* ---- Gold glow follows the pointer in dark rooms ---- */
  if (fine) {
    doc
      .querySelectorAll(".service-proof, .calc-hero, .guide-page .estimate-guide__contact")
      .forEach((sec) => {
        sec.addEventListener("pointermove", (e) => {
          const r = sec.getBoundingClientRect();
          sec.style.setProperty("--gx", e.clientX - r.left + "px");
          sec.style.setProperty("--gy", e.clientY - r.top + "px");
        });
      });
  }

  /* ---- Footer wordmark spotlight drifts, or follows the pointer ---- */
  if (word && hasIO) {
    const foot = word.closest("footer");
    let hover = false,
      visible = false,
      raf = 0,
      t = 0;
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
    if (fine && foot) {
      foot.addEventListener("pointermove", (e) => {
        const r = word.getBoundingClientRect();
        hover = true;
        word.style.setProperty("--fx", e.clientX - r.left + "px");
        word.style.setProperty("--fy", e.clientY - r.top + "px");
      });
      foot.addEventListener("pointerleave", () => (hover = false));
    }
  }

  /* ---- Magnetic gold buttons ---- */
  if (fine) {
    doc.querySelectorAll(".btn-action:not(.btn-action--dark), .quote-submit").forEach((btn) => {
      btn.classList.add("is-magnetic");
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
        btn.style.setProperty("--gx", ((e.clientX - r.left) / r.width) * 100 + "%");
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  if (!hasIO) return;

  /* ---- Plank wipe on photos ---- */
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
  doc
    .querySelectorAll(".service-proof__item, .guide-photo, .guide-card > a, .calc-fig, .city-work figure")
    .forEach((el) => {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.style.overflow = "hidden";
      const planks = doc.createElement("span");
      planks.className = "v3i-planks";
      planks.setAttribute("aria-hidden", "true");
      for (let i = 0; i < STRIPS; i++) {
        const s = doc.createElement("i");
        s.style.setProperty("--i", i);
        planks.appendChild(s);
      }
      el.appendChild(planks);
      wipeIO.observe(el);
    });
  doc.addEventListener("transitionend", (e) => {
    const p = e.target.parentElement;
    if (p && p.classList.contains("v3i-planks") && e.target === p.lastElementChild) p.remove();
  });

  /* ---- Scroll reveals ---- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        revealIO.unobserve(en.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  const hero0 = doc.querySelector(".service-hero, .city-hero, .calc-hero");
  doc
    .querySelectorAll(
      [
        "main section .eyebrow2",
        "main section h2",
        ".block__lead",
        ".service-faq__intro",
        ".service-list li",
        ".service-card",
        ".service-faq__item",
        ".service-proof__head > *",
        ".service-proof__item",
        ".service-related__links a",
        ".guide-service-reading li",
        ".guide-table-wrap",
        ".guide-table tbody tr",
        ".guide-toc",
        ".guide-list li",
        ".guide-card",
        ".guide-related",
        ".estimate-guide__contact",
        ".city-section .wrap > *",
        ".city-service",
        ".towns a",
      ].join(","),
    )
    .forEach((el) => {
      if (hero0 && hero0.contains(el)) return;
      if (el.closest(".guide-article > .block__lead, .guide-hub > .block__lead")) return;
      if (el.matches(".guide-article > .block__lead, .guide-hub > .block__lead")) return;
      el.classList.add("rv");
      const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 6) * 70 + "ms";
      revealIO.observe(el);
    });
  /* anything still hidden after a while is shown, so nothing waits on motion */
  window.setTimeout(() => {
    doc.querySelectorAll(".rv:not(.in)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
    });
  }, 2500);
})();
