// Quote form submission.
//   - If a real Formspree endpoint is wired into the form's action=, POST the
//     lead there.
//   - Otherwise, open the visitor's email app with everything prefilled to the
//     owner address in data-owner-email. No backend required.
// Either way, always show the thank-you card so the visitor is never trapped.
(function () {
  const form = document.getElementById("quoteForm");
  const card = document.getElementById("quoteCard");
  if (!form || !card) return;

  // AGENT_TARGET: lead-endpoint — accept any HTTPS POST endpoint, not just Formspree
  const action = form.getAttribute("action") || "";
  let configured = false;
  try {
    const u = new URL(action);
    configured = u.protocol === "https:";
  } catch (_) {
    configured = false;
  }
  const projectSelect = form.elements.project_type;
  const status = form.querySelector(".quote-status");
  const success = card.querySelector(".quote-success");
  const submitButton = form.querySelector(".quote-submit");
  const defaultButtonText = submitButton?.textContent.trim() || "Get my competitive quote";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ownerEmail =
    form.getAttribute("data-owner-email") || "nickbilodeau1150@gmail.com";
  const requestQuoteConversion = "AW-18284708507/oWhECILIh8kcEJuF6o5E";

  // AGENT_TARGET: paid-click-attribution — capture UTM + gclid from URL params
  const params = new URLSearchParams(window.location.search);
  const sourceField = form.elements.source_url;
  const utmSourceField = form.elements.utm_source;
  const utmCampaignField = form.elements.utm_campaign;
  const utmMediumField = form.elements.utm_medium;
  const utmTermField = form.elements.utm_term;
  const utmContentField = form.elements.utm_content;
  const gclidField = form.elements.gclid;
  if (sourceField) sourceField.value = window.location.href;
  if (utmSourceField) utmSourceField.value = params.get("utm_source") || "";
  if (utmCampaignField) {
    utmCampaignField.value = params.get("utm_campaign") || "";
  }
  if (utmMediumField) utmMediumField.value = params.get("utm_medium") || "";
  if (utmTermField) utmTermField.value = params.get("utm_term") || "";
  if (utmContentField) utmContentField.value = params.get("utm_content") || "";
  if (gclidField) gclidField.value = params.get("gclid") || "";

  function alignDirectQuoteLink() {
    if (window.location.hash !== "#quote") return;
    document
      .getElementById("quote")
      ?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  if (window.location.hash === "#quote") {
    let quoteAlignmentCancelled = false;
    const cancelEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    const cancelQuoteAlignment = () => {
      quoteAlignmentCancelled = true;
      cancelEvents.forEach((name) =>
        window.removeEventListener(name, cancelQuoteAlignment),
      );
    };
    const alignIfUninterrupted = () => {
      if (quoteAlignmentCancelled || window.location.hash !== "#quote") return;
      alignDirectQuoteLink();
    };
    const scheduleQuoteAlignment = () => {
      window.requestAnimationFrame(alignIfUninterrupted);
      window.setTimeout(alignIfUninterrupted, 450);
      window.setTimeout(() => {
        alignIfUninterrupted();
        cancelQuoteAlignment();
      }, 1200);
    };

    cancelEvents.forEach((name) =>
      window.addEventListener(name, cancelQuoteAlignment, { passive: true }),
    );
    if (document.readyState === "complete") {
      scheduleQuoteAlignment();
    } else {
      window.addEventListener("load", scheduleQuoteAlignment, { once: true });
    }
  }

  function val(name) {
    const el = form.elements[name];
    return el && el.value ? el.value.trim() : "";
  }

  function emailLead() {
    const name = val("name");
    const subject = "Free estimate request" + (name ? " — " + name : "");
    const lines = [
      "New estimate request from cookflooring.com",
      "",
      "Name:    " + name,
      "Phone:   " + val("phone"),
      "Email:   " + val("email"),
      "Project: " + val("project_type"),
      "Town:    " + val("town"),
      "",
      "Details:",
      val("details"),
    ];
    const href =
      "mailto:" +
      ownerEmail +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(lines.join("\n"));
    window.location.href = href;
  }

  function sendTrackingEvent(name, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  }

  function trackQuoteConversion(label, callback) {
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
      send_to: requestQuoteConversion,
      value: 1.0,
      currency: "USD",
      event_label: label || "Quote form",
      event_callback: done,
      event_timeout: 800,
    });
    sendTrackingEvent("generate_lead", {
      event_category: "lead",
      event_label: label || "Quote form",
    });

    window.setTimeout(done, 900);
  }

  document.querySelectorAll('a[href="#quote"]').forEach((link) => {
    link.addEventListener("click", () => {
      sendTrackingEvent("quote_cta_click", {
        event_category: "lead",
        event_label: link.textContent.trim() || "Quote CTA",
      });
    });
  });

  document.querySelectorAll("[data-project-choice]").forEach((link) => {
    link.addEventListener("click", () => {
      const choice = link.getAttribute("data-project-choice") || "";
      if (projectSelect && choice) projectSelect.value = choice;
      sendTrackingEvent("project_choice", {
        event_category: "lead",
        event_label: choice,
      });
    });
  });

  document.querySelectorAll(".proof-reel video").forEach((video) => {
    video.addEventListener(
      "play",
      () => {
        sendTrackingEvent("proof_reel_play", {
          event_category: "engagement",
          event_label: "Cook Flooring ad reel",
        });
      },
      { once: true },
    );
  });

  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      sendTrackingEvent("phone_click", {
        event_category: "lead",
        event_label: href,
      });
      if (!href) return;
      e.preventDefault();
      trackQuoteConversion("Phone call click", () => {
        window.location.href = href;
      });
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = submitButton;
    if (!btn) return;
    if (status) {
      status.textContent = "";
      status.classList.remove("is-error");
    }
    form.setAttribute("aria-busy", "true");
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      if (configured) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        let res;
        try {
          res = await fetch(action, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeout);
        }
        if (!res.ok) throw new Error("send failed");
        trackQuoteConversion("Quote form");
      } else {
        trackQuoteConversion("Quote form");
        emailLead();
        form.setAttribute("aria-busy", "false");
        btn.disabled = false;
        btn.textContent = defaultButtonText;
        if (status) {
          status.textContent =
            "Your email draft is open. Send it to complete your request.";
        }
        return;
      }
    } catch (err) {
      console.warn("Quote submit:", err.message);
      sendTrackingEvent("quote_submit_error", {
        event_category: "lead",
        event_label: err.message,
      });
      form.setAttribute("aria-busy", "false");
      btn.disabled = false;
      btn.textContent = "Try sending again";
      if (status) {
        status.classList.add("is-error");
        status.textContent =
          "That did not send. Try again or call (401) 602-0958.";
      }
      return;
    }

    form.setAttribute("aria-busy", "false");
    btn.textContent = "Sent";
    card.classList.add("is-sent");
    card.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    success?.focus({ preventScroll: true });
  });
})();
