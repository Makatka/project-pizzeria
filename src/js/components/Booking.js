import {templates, select, settings, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.tableSelected = '';

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

  }

  getData() {
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ]).then(function (allResponses) {
      const bookingsResponse = allResponses[0];
      const eventsCurrentResponse = allResponses[1];
      const eventRepeatResponse = allResponses[2];
      return Promise.all([
        bookingsResponse.json(),
        eventsCurrentResponse.json(),
        eventRepeatResponse.json(),
      ]);
    }).then(function ([bookings, eventsCurrent, eventsRepeat]) {
      thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
    });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    for (let item of eventsRepeat) {

      if (item.repeat === 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(parseInt(table));
    }
  }

  updateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hoursPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].indexOf(tableId) > -1) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }

      thisBooking.initTable();
    }
  }

  render(element) {

    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = [];
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.tablesWrapper = thisBooking.dom.wrapper.querySelector(select.booking.tablesWrapper);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phoneNumber);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.bookingSubmit = thisBooking.dom.wrapper.querySelector(select.booking.bookingSubmit);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.alertSuccess = thisBooking.dom.wrapper.querySelector(select.booking.alert);
  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hoursPicker = new HourPicker(thisBooking.dom.hourPicker);


    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.tablesWrapper.addEventListener('click', function (e){
      e.preventDefault();
      thisBooking.initTable(e);
    });

    thisBooking.dom.bookingSubmit.addEventListener('click', function (e){
      e.preventDefault();
      thisBooking.sendBooking();
      thisBooking.initAlert();
    });
  }

  initAlert(){
    const thisBooking = this;
    thisBooking.dom.alertSuccess.classList.add('active');
    setTimeout(() => {thisBooking.dom.alertSuccess.classList.remove('active');}, 2000);
  }

  initTable(e) {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.classList.remove(classNames.booking.tableSelected);
    }
    if(e){
      if (!e.target.classList.contains(classNames.booking.tableBooked)) {
        e.target.classList.add(classNames.booking.tableSelected);
        thisBooking.tableSelected = e.target.dataset.table;
      }
    }
  }
  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.bookings;

    const bookload = {
      'date': thisBooking.datePicker.value,
      'hour': thisBooking.hoursPicker.value,
      'table': thisBooking.tableSelected,
      'duration': parseInt(thisBooking.hoursAmount.value),
      'ppl': parseInt(thisBooking.peopleAmount.value),
      'starters': [],
      'phone': thisBooking.dom.phone.value,
      'address': thisBooking.dom.address.value,
    };

    for (let starter of thisBooking.dom.starters){
      if(starter.checked){
        bookload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        console.log('parsedResponse: ', parsedResponse);
        thisBooking.makeBooked(bookload.date, bookload.hour, bookload.duration, bookload.table);
      });

  }
}
export default Booking;