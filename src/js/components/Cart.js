import {settings, select, classNames, templates} from '../settings.js';
import CartProduct from './CartProduct.js';
import utils from '../utils.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
    thisCart.update();
  }

  getElements(element) {
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = element.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrices = element.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalnumber = element.querySelector(select.cart.totalNumber);
    thisCart.dom.form = element.querySelector(select.cart.form);
    thisCart.dom.phoneNumber  = element.querySelector(select.cart.phone);
    thisCart.dom.address  = element.querySelector(select.cart.address);
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function () {
      (thisCart.dom.wrapper).classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function (){
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function (){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(e){
      e.preventDefault();
      thisCart.sendOrder();
      thisCart.dom.wrapper.classList.remove(classNames.cart.wrapperActive);

    });
  }

  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phoneNumber.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.dom.subtotalPrice.innerHTML,
      totalNumber: thisCart.dom.totalnumber.innerHTML,
      deliveryFee: thisCart.dom.deliveryFee.innerHTML,
      products: [],
    };
    for (let product of thisCart.products){
      payload.products.push(product.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response){
        thisCart.clear();
        return response.json();

      }).then(function(parsedResponse){
        console.log('parsedResponse: ', parsedResponse);
      });

  }

  remove(cartProduct) {
    const thisCart = this;

    cartProduct.dom.wrapper.remove();
    thisCart.products.splice((this.products.indexOf(cartProduct)), 1);
    thisCart.update();
  }

  clear(){
    const thisCart = this;
    for (let product of [...thisCart.products]) {
      product.remove();
    }
    thisCart.products = [];
    thisCart.update();
  }

  add(menuProduct){
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }

  update(){
    const thisCart = this;
    const deliveryFee = settings.cart.defaultDeliveryFee;
    let totalNumber = 0;
    let subtotalPrice = 0;

    for(let product of thisCart.products) {
      totalNumber += product.amount ;
      subtotalPrice += product.price;
    }

    thisCart.totalPrice = 0;
    thisCart.dom.deliveryFee.innerHTML = '0';

    if (thisCart.products.length > 0) {

      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.totalPrice = subtotalPrice + deliveryFee;
    }
    thisCart.dom.totalnumber.innerHTML = totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;

    for (let element of thisCart.dom.totalPrices) {
      element.innerHTML = thisCart.totalPrice;
    }
  }
}

export default Cart;