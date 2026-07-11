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

  const action = form.getAttribute("action") || "";
  const configured = /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(action);
  const projectSelect = form.elements.project_type;
  const status = form.querySelector(".quote-status");
  const ownerEmail =
    form.getAttribute("data-owner-email") || "nickbilodeau1150@gmail.com";
  const requestQuoteConversion = "AW-18284708507/oWhECILIh8kcEJuF6o5E";

  const params = new URLSearchParams(window.location.search);
  const sourceField = form.elements.source_url;
  const utmSourceField = form.elements.utm_source;
  const utmCampaignField = form.elements.utm_campaign;
  if (sourceField) sourceField.value = window.location.href;
  if (utmSourceField) utmSourceField.value = params.get("utm_source") || "";
  if (utmCampaignField) {
    utmCampaignField.value = params.get("utm_campaign") || "";
  }

  function alignDirectQuoteLink() {
    if (window.location.hash !== "#quote") return;
    document.getElementById("quote")?.scrollIntoView({ block: "start" });
  }

  if (window.location.hash === "#quote") {
    window.addEventListener(
      "load",
      () => {
        alignDirectQuoteLink();
        window.setTimeout(alignDirectQuoteLink, 450);
        window.setTimeout(alignDirectQuoteLink, 1400);
      },
      { once: true },
    );
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
    const btn = form.querySelector(".quote-submit");
    if (status) status.textContent = "";
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      if (configured) {
        const res = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("send failed");
        trackQuoteConversion("Quote form");
      } else {
        trackQuoteConversion("Quote form");
        emailLead();
        btn.disabled = false;
        btn.textContent = "Request my free estimate";
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
      btn.disabled = false;
      btn.textContent = "Try sending again";
      if (status) {
        status.textContent =
          "That did not send. Try again or call (401) 602-0958.";
      }
      return;
    }

    btn.textContent = "Sent";
    card.classList.add("is-sent");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
