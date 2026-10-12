// Hardwood floor cost calculator (/guides/hardwood-floor-cost-calculator/).
// Prices come from the #calcPrices JSON block in the page, so the page's
// tables, FAQ, and this script always quote the same numbers.
// The result is handed to the estimate form on the same page; sending it is
// still js/quote-form.js.
(function () {
  const root = document.getElementById("calculator");
  const priceNode = document.getElementById("calcPrices");
  if (!root || !priceNode) return;

  let P;
  try {
    P = JSON.parse(priceNode.textContent);
  } catch (_) {
    return;
  }

  const MAX_ROOMS = 8;
  const TONES = {
    natural: { name: "natural", base: "#dcbd8f", a: "#d2b07f", b: "#e5caa1", line: "#b4925f" },
    golden: { name: "golden", base: "#c8974f", a: "#bc8941", b: "#d3a662", line: "#93692b" },
    walnut: { name: "walnut", base: "#7b563a", a: "#6e4b31", b: "#886246", line: "#523722" },
    dark: { name: "dark", base: "#3b2c24", a: "#32251e", b: "#46352b", line: "#1d1511" },
  };

  const form = document.getElementById("calcForm");
  const roomsEl = document.getElementById("calcRooms");
  const addBtn = document.getElementById("calcAdd");
  const totalInput = document.getElementById("calcTotal");
  const planEl = document.getElementById("calcPlan");
  const areaEl = document.getElementById("calcArea");
  const stairsInput = document.getElementById("calcStairs");
  const rangeEl = document.getElementById("calcRange");
  const perEl = document.getElementById("calcPer");
  const linesEl = document.getElementById("calcLines");
  const compareEl = document.getElementById("calcCompare");
  const compareNote = document.getElementById("calcCompareNote");
  const statusEl = document.getElementById("calcStatus");
  const liveEl = document.getElementById("calcLive");
  const liveRange = document.getElementById("calcLiveRange");
  const resultEl = document.getElementById("calcResult");

  const state = {
    job: "refinish",
    mode: "rooms",
    rooms: [{ l: 20, w: 15 }],
    total: 300,
    tone: "natural",
    stairs: 0,
    method: "nail",
  };
  let summary = "";
  let lastAuto = "";
  let statusTimer = 0;
  const tracked = {};

  // ---- helpers ----
  function num(value, max) {
    const n = parseFloat(value);
    if (!isFinite(n) || n < 0) return 0;
    return Math.min(n, max);
  }
  // Same rounding as the tables in the page: $10 under $1,000, $50 under $10,000, $100 above.
  function money(x) {
    const step = x < 1000 ? 10 : x < 10000 ? 50 : 100;
    return "$" + (Math.round(x / step) * step).toLocaleString("en-US");
  }
  function rate(x) {
    return "$" + (Math.round(x * 100) % 100 === 0 ? x.toFixed(0) : x.toFixed(2));
  }
  function span(lo, hi) {
    return money(lo) + " to " + money(hi);
  }
  function feet(x) {
    return (Math.round(x * 10) / 10).toString();
  }
  function sqft() {
    if (state.mode === "total") return Math.round(state.total);
    return Math.round(state.rooms.reduce((sum, r) => sum + r.l * r.w, 0));
  }
  function extras() {
    const pane = form.querySelector('[data-for="' + state.job + '"]');
    return Array.from(pane.querySelectorAll('input[name="extra"]:checked')).map((el) => el.value);
  }
  function track(name, label) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, { event_category: "calculator", event_label: label });
  }

  // Running-bond planks as a repeating tile, in the colors of one finish.
  function planks(tone) {
    const t = TONES[tone] || TONES.natural;
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='144' height='36'>" +
      "<rect width='144' height='36' fill='" + t.base + "'/>" +
      "<rect x='0' y='0' width='58' height='9' fill='" + t.a + "'/>" +
      "<rect x='112' y='0' width='32' height='9' fill='" + t.b + "'/>" +
      "<rect x='26' y='9' width='70' height='9' fill='" + t.b + "'/>" +
      "<rect x='0' y='18' width='40' height='9' fill='" + t.a + "'/>" +
      "<rect x='84' y='18' width='60' height='9' fill='" + t.b + "'/>" +
      "<rect x='62' y='27' width='54' height='9' fill='" + t.a + "'/>" +
      "<path d='M0 .5H144M0 9.5H144M0 18.5H144M0 27.5H144M58 0V9M112 0V9M26 9V18M96 9V18M40 18V27M84 18V27M62 27V36M116 27V36' " +
      "stroke='" + t.line + "' stroke-width='1' fill='none' opacity='.55'/>" +
      "</svg>";
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  // ---- rooms ----
  function renderRooms() {
    roomsEl.textContent = "";
    state.rooms.forEach((room, i) => {
      const n = i + 1;
      const row = document.createElement("div");
      row.className = "calc__room";
      row.innerHTML =
        '<span class="calc__roomname">Room ' + n + "</span>" +
        '<div class="calc__dim calc__dim--l"><label for="calcL' + n + '">Length</label>' +
        '<div class="calc__inwrap"><input class="calc__in" id="calcL' + n + '" type="number" inputmode="decimal" min="0" max="200" step="0.5" data-room="' + i + '" data-dim="l" /><span>ft</span></div></div>' +
        '<span class="calc__x" aria-hidden="true">&times;</span>' +
        '<div class="calc__dim calc__dim--w"><label for="calcW' + n + '">Width</label>' +
        '<div class="calc__inwrap"><input class="calc__in" id="calcW' + n + '" type="number" inputmode="decimal" min="0" max="200" step="0.5" data-room="' + i + '" data-dim="w" /><span>ft</span></div></div>' +
        '<output class="calc__roomarea" for="calcL' + n + " calcW" + n + '"></output>' +
        '<button type="button" class="calc__del" data-del="' + i + '" aria-label="Remove room ' + n + '">&times;</button>';
      row.querySelector('[data-dim="l"]').value = room.l || "";
      row.querySelector('[data-dim="w"]').value = room.w || "";
      if (state.rooms.length === 1) row.querySelector(".calc__del").disabled = true;
      roomsEl.appendChild(row);
    });
    addBtn.hidden = state.mode !== "rooms" || state.rooms.length >= MAX_ROOMS;
  }

  function drawPlan() {
    let rooms;
    if (state.mode === "total") {
      const l = Math.sqrt(state.total * 1.4);
      rooms = state.total > 0 ? [{ l: l, w: state.total / l }] : [];
    } else {
      rooms = state.rooms.filter((r) => r.l > 0 && r.w > 0);
    }
    const tone = state.job === "refinish" ? state.tone : "natural";
    const image = planks(tone);
    const style = getComputedStyle(planEl);
    const inner = planEl.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const gap = 10;
    const sumL = rooms.reduce((s, r) => s + r.l, 0);
    const maxW = rooms.reduce((m, r) => Math.max(m, r.w), 0);
    const scale = rooms.length
      ? Math.min((inner - gap * (rooms.length - 1)) / sumL, 150 / maxW, 26)
      : 0;
    while (planEl.children.length > rooms.length) planEl.lastChild.remove();
    rooms.forEach((r, i) => {
      let el = planEl.children[i];
      if (!el) {
        el = document.createElement("div");
        el.className = "calc__planroom";
        el.appendChild(document.createElement("b"));
        planEl.appendChild(el);
      }
      const w = Math.max(8, r.l * scale);
      const h = Math.max(8, r.w * scale);
      el.style.width = w + "px";
      el.style.height = h + "px";
      el.style.backgroundImage = image;
      el.style.backgroundColor = (TONES[tone] || TONES.natural).base;
      const label = el.firstChild;
      label.textContent = Math.round(r.l * r.w).toLocaleString("en-US") + " sq ft";
      label.hidden = w < 78 || h < 30;
    });
  }

  // ---- the numbers ----
  function refinishRange(area, stained, steps) {
    const lo = area * (P.refinish.low + (stained ? P.stain.low : 0)) + steps * P.stair.low;
    const hi = area * (P.refinish.high + (stained ? P.stain.high : 0)) + steps * P.stair.high;
    return [lo, hi];
  }
  function installRange(area, method) {
    const lo = area * (P.install.low + (method === "glue" ? P.glue.low : 0));
    const hi = area * (P.install.high + (method === "nail" ? 0 : P.glue.high));
    return [lo, hi];
  }
  function line(label, value, walk) {
    const li = document.createElement("li");
    if (walk) li.className = "is-walk";
    const a = document.createElement("span");
    a.textContent = label;
    const b = document.createElement("span");
    b.textContent = value;
    li.append(a, b);
    return li;
  }
  function setBar(name, range, max, current) {
    const bar = compareEl.querySelector('[data-bar="' + name + '"]');
    bar.classList.toggle("is-current", current);
    const fill = bar.querySelector("i");
    fill.style.setProperty("--from", ((range[0] / max) * 100).toFixed(2) + "%");
    fill.style.setProperty("--span", (((range[1] - range[0]) / max) * 100).toFixed(2) + "%");
    bar.querySelector(".calc__barval").textContent = span(range[0], range[1]);
  }

  function update() {
    const area = sqft();
    const stained = state.tone !== "natural";
    const picked = extras();
    areaEl.textContent = area.toLocaleString("en-US") + " sq ft";
    form.querySelectorAll("[data-for]").forEach((el) => {
      el.hidden = el.getAttribute("data-for") !== state.job;
    });
    form.querySelectorAll("[data-pane]").forEach((el) => {
      el.hidden = el.getAttribute("data-pane") !== state.mode;
    });
    addBtn.hidden = state.mode !== "rooms" || state.rooms.length >= MAX_ROOMS;
    form.querySelectorAll(".calc__tab").forEach((tab) => {
      const on = tab.getAttribute("data-mode") === state.mode;
      tab.classList.toggle("is-on", on);
      tab.setAttribute("aria-pressed", on ? "true" : "false");
    });
    roomsEl.querySelectorAll(".calc__room").forEach((row, i) => {
      const r = state.rooms[i];
      row.querySelector(".calc__roomarea").textContent =
        r && r.l > 0 && r.w > 0 ? Math.round(r.l * r.w).toLocaleString("en-US") + " sq ft" : "";
    });
    drawPlan();

    linesEl.textContent = "";
    if (area <= 0) {
      rangeEl.classList.add("is-empty");
      rangeEl.textContent = "Enter a floor size to see a range.";
      perEl.textContent = "";
      compareEl.hidden = true;
      liveRange.textContent = "";
      summary = "";
      return;
    }

    let range;
    let perLo;
    let perHi;
    const size = area.toLocaleString("en-US") + " sq ft";
    const notes = [];
    if (state.job === "refinish") {
      range = refinishRange(area, stained, state.stairs);
      perLo = P.refinish.low + (stained ? P.stain.low : 0);
      perHi = P.refinish.high + (stained ? P.stain.high : 0);
      linesEl.append(line("Sand and clear finish, " + size, span(area * P.refinish.low, area * P.refinish.high)));
      if (stained) {
        linesEl.append(line("Stain color (" + state.tone + ")", "+ " + span(area * P.stain.low, area * P.stain.high)));
      }
      if (state.stairs > 0) {
        const steps = state.stairs + (state.stairs === 1 ? " step" : " steps");
        linesEl.append(line(steps, "+ " + span(state.stairs * P.stair.low, state.stairs * P.stair.high)));
        notes.push("Stairs: " + steps + ".");
      }
      notes.unshift("Finish: " + (stained ? state.tone + " stain color" : "natural, clear finish") + ".");
    } else {
      range = installRange(area, state.method);
      perLo = range[0] / area;
      perHi = range[1] / area;
      linesEl.append(line("Hardwood installed, " + size, span(area * P.install.low, area * P.install.high)));
      if (state.method === "glue") {
        linesEl.append(line("Glue-down over concrete", "+ " + span(area * P.glue.low, area * P.glue.high)));
        notes.push("Subfloor: concrete slab, glue-down.");
      } else if (state.method === "unsure") {
        linesEl.append(line("If it is glued down over concrete", "up to + " + money(area * P.glue.high)));
        notes.push("Subfloor: not sure.");
      } else {
        notes.push("Subfloor: wood, nail-down.");
      }
    }
    picked.forEach((name) => linesEl.append(line(name, "At the walkthrough", true)));

    rangeEl.classList.remove("is-empty");
    rangeEl.innerHTML = "<span></span><span><i>to</i></span>";
    rangeEl.firstChild.textContent = money(range[0]);
    rangeEl.lastChild.append(money(range[1]));
    perEl.textContent = size + " · " + rate(perLo) + " to " + rate(perHi) + " per sq ft";
    liveRange.textContent = span(range[0], range[1]);

    // Compare the floor alone, so stairs on one side do not skew it.
    const refi = refinishRange(area, state.job === "refinish" && stained, 0);
    const inst = state.job === "install" ? range : installRange(area, "nail");
    const max = Math.max(refi[1], inst[1]);
    setBar("refinish", refi, max, state.job === "refinish");
    setBar("install", inst, max, state.job === "install");
    compareNote.hidden = !(state.job === "refinish" && state.stairs > 0);
    compareEl.hidden = false;

    const dims =
      state.mode === "rooms"
        ? " (" + state.rooms.filter((r) => r.l > 0 && r.w > 0).map((r) => feet(r.l) + " x " + feet(r.w) + " ft").join(", ") + ")"
        : "";
    summary = [
      "Cost calculator: " + (state.job === "refinish" ? "refinish existing hardwood" : "install new hardwood") + ", about " + size + dims + ".",
      notes.join(" "),
      picked.length ? "Also: " + picked.join("; ").toLowerCase() + "." : "",
      "Ballpark shown: " + span(range[0], range[1]) + ".",
    ]
      .filter(Boolean)
      .join("\n");

    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      statusEl.textContent = "Ballpark " + span(range[0], range[1]) + " for " + area.toLocaleString("en-US") + " square feet.";
    }, 700);
  }

  // Hand the ballpark to the estimate form. Never overwrite what the visitor typed.
  function fillForm() {
    const details = document.getElementById("qDetails");
    const type = document.getElementById("qType");
    if (type && summary) type.value = state.job === "refinish" ? "Refinish existing floors" : "Hardwood install";
    if (details && summary && (details.value.trim() === "" || details.value === lastAuto)) {
      details.value = summary;
      lastAuto = summary;
    }
  }

  // ---- events ----
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("input", (e) => {
    const el = e.target;
    if (el.name === "job") state.job = el.value;
    else if (el.name === "tone") state.tone = el.value;
    else if (el.name === "method") state.method = el.value;
    else if (el === totalInput) state.total = num(el.value, 20000);
    else if (el === stairsInput) state.stairs = Math.round(num(el.value, 60));
    else if (el.hasAttribute("data-room")) {
      state.rooms[+el.getAttribute("data-room")][el.getAttribute("data-dim")] = num(el.value, 200);
    }
    update();
    if (!tracked[state.job]) {
      tracked[state.job] = true;
      track("cost_calculator_use", state.job);
    }
  });
  form.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.hasAttribute("data-mode")) {
      state.mode = el.getAttribute("data-mode");
      if (state.mode === "total" && sqftFromRooms() > 0) {
        state.total = sqftFromRooms();
        totalInput.value = state.total;
      }
    } else if (el === addBtn) {
      if (state.rooms.length < MAX_ROOMS) state.rooms.push({ l: 12, w: 12 });
      renderRooms();
      const added = roomsEl.querySelector("#calcL" + state.rooms.length);
      if (added) added.focus();
    } else if (el.hasAttribute("data-del")) {
      state.rooms.splice(+el.getAttribute("data-del"), 1);
      renderRooms();
    } else if (el.hasAttribute("data-step")) {
      state.stairs = Math.max(0, Math.min(60, state.stairs + +el.getAttribute("data-step")));
      stairsInput.value = state.stairs;
    } else {
      return;
    }
    update();
  });
  function sqftFromRooms() {
    return Math.round(state.rooms.reduce((sum, r) => sum + r.l * r.w, 0));
  }

  document.querySelectorAll("[data-calc-send]").forEach((link) => {
    link.addEventListener("click", () => {
      fillForm();
      track("cost_calculator_cta", state.job);
    });
  });

  // Ad links can open the right tab: ?job=refinish | install | glue-down, ?sqft=450
  const params = new URLSearchParams(window.location.search);
  const job = params.get("job");
  if (job === "install" || job === "glue-down") {
    state.job = "install";
    if (job === "glue-down") state.method = "glue";
  }
  const preset = Math.round(num(params.get("sqft"), 20000));
  if (preset > 0) {
    state.mode = "total";
    state.total = preset;
    totalInput.value = preset;
  }
  form.querySelectorAll('input[name="job"]').forEach((el) => (el.checked = el.value === state.job));
  form.querySelectorAll('input[name="method"]').forEach((el) => (el.checked = el.value === state.method));
  form.querySelectorAll('input[name="tone"]').forEach((el) => (el.checked = el.value === state.tone));
  form.querySelectorAll('input[name="extra"]').forEach((el) => (el.checked = false));
  stairsInput.value = 0;

  root.querySelectorAll(".calc__chip").forEach((chip) => {
    const tone = chip.getAttribute("data-tone");
    chip.style.backgroundImage = planks(tone);
    chip.style.backgroundColor = TONES[tone].base;
  });

  renderRooms();
  update();
  window.addEventListener("resize", drawPlan);

  // Phones: show the running total above the call bar while the inputs are on
  // screen and the answer panel is not.
  if (liveEl && "IntersectionObserver" in window) {
    const seen = { form: false, result: false };
    const callbar = document.querySelector(".callbar");
    const place = () => {
      const shown = callbar && getComputedStyle(callbar).display !== "none";
      liveEl.style.setProperty("--calc-live-bottom", (shown ? callbar.offsetHeight : 0) + "px");
    };
    const sync = () => liveEl.classList.toggle("is-on", seen.form && !seen.result && !!summary);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        seen[entry.target === form ? "form" : "result"] = entry.isIntersecting;
      });
      sync();
    });
    liveEl.hidden = false;
    place();
    window.addEventListener("resize", place);
    io.observe(form);
    io.observe(resultEl);
  }
})();
