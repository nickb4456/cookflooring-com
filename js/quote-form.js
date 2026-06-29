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
  const ownerEmail =
    form.getAttribute("data-owner-email") || "nickbilodeau1150@gmail.com";

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
      "Size:    " + val("size"),
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector(".quote-submit");
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
      } else {
        emailLead();
      }
    } catch (err) {
      // Even if the endpoint is not wired yet, don't trap the visitor.
      console.warn("Quote submit:", err.message);
    } finally {
      btn.textContent = "Sent";
      card.classList.add("is-sent");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
