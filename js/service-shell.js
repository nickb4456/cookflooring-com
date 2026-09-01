(function () {
  const business = window.COOK_FLOORING;
  if (!business) throw new Error("Cook Flooring business config must load first");

  class ServiceHeader extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <header class="sitehdr is-stuck">
          <a class="brand" href="/" aria-label="${business.name} home">
            <img class="brand__logo" src="/assets/logo.svg" width="170" height="40" alt="" />
          </a>
          <nav class="sitenav" aria-label="Primary">
            <a class="nav-hide-sm" href="/#work">Work</a>
            <a class="nav-hide-sm" href="/#services">Services</a>
            <a class="sitehdr__phone nav-hide-sm" href="${business.phoneHref}">${business.phoneDisplay}</a>
            <a class="btn-action" href="/#quote">Free estimate</a>
          </nav>
        </header>`;
    }
  }

  class ServiceFooter extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <footer class="service-footer">
          <div class="wrap">
            <strong>${business.name}</strong> · ${business.location} ·
            ${business.installationArea} ·
            <a href="${business.phoneHref}">${business.phoneDisplay}</a>
          </div>
        </footer>
        <div class="callbar" aria-label="Quick contact">
          <a class="callbar__call" href="${business.phoneHref}">Call ${business.phoneDisplay}</a>
          <a class="callbar__quote" href="/#quote">Free estimate</a>
        </div>`;
    }
  }

  customElements.define("service-header", ServiceHeader);
  customElements.define("service-footer", ServiceFooter);
})();
