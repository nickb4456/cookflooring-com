(function () {
  const business = Object.freeze({
    name: "Cook Flooring & Tile",
    phoneDisplay: "(401) 602-0958",
    phoneHref: "tel:+14016020958",
    email: "nickbilodeau1150@gmail.com",
    location: "Cranston, RI 02920",
    hours: "Monday-Saturday, 7:00 AM-6:00 PM",
    installationArea: "Rhode Island and select nearby MA/CT projects",
    localOnlyArea: "Rhode Island",
  });

  window.COOK_FLOORING = business;

  document.querySelectorAll("[data-business-phone]").forEach((element) => {
    element.textContent = business.phoneDisplay;
    if (element.matches("a")) element.href = business.phoneHref;
  });
  document.querySelectorAll("[data-business-call]").forEach((element) => {
    element.textContent = "Call " + business.phoneDisplay;
    if (element.matches("a")) element.href = business.phoneHref;
  });
  document.querySelectorAll("[data-business-name]").forEach((element) => {
    element.textContent = business.name;
  });
  document.querySelectorAll("[data-business-location]").forEach((element) => {
    element.textContent = business.location;
  });
})();
