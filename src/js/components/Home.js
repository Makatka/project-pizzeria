import {templates, select} from '../settings.js';

class Home {
  constructor(element) {
    const thisPage = this;

    thisPage.render(element);
    thisPage.initWidgets();
  }

  render(element) {
    const thisPage = this;
    thisPage.dom = [];
    const generatedHTML = templates.homePage();

    thisPage.dom.wrapper = element;
    thisPage.dom.wrapper.innerHTML = generatedHTML;
    thisPage.dom.orderButton = thisPage.dom.wrapper.querySelector(select.homePage.orderButton);
    thisPage.dom.bookingButton = thisPage.dom.wrapper.querySelector(select.homePage.bookingButton);
  }

  initWidgets() {
    const thisPage = this;

    thisPage.dom.orderButton.addEventListener('click', function (e) {
      const clickedElement = this;
      e.preventDefault();
      initPages(clickedElement);
    });
    thisPage.dom.bookingButton.addEventListener('click', function (e) {
      const clickedElement = this;
      e.preventDefault();
      initPages(clickedElement);
    });

    const initPages = function (clickedElement) {
      const id = clickedElement.getAttribute('href').replace('#', '');
      window.app.activatePage(id);
      window.location.hash = '#/' + id;
    };
  }
}

export default Home;

