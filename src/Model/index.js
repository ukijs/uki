import AbstractClass from '../AbstractClass/index.js';

class Model extends AbstractClass {
  constructor () {
    super();
    this.eventHandlers = {};
  }
  on (eventName, callback, allowDuplicateListeners) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    if (!allowDuplicateListeners) {
      if (this.eventHandlers[eventName].indexOf(callback) !== -1) {
        return;
      }
    }
    this.eventHandlers[eventName].push(callback);
  }
  off (eventName, callback) {
    if (this.eventHandlers[eventName]) {
      if (!callback) {
        delete this.eventHandlers[eventName];
      } else {
        let index = this.eventHandlers[eventName].indexOf(callback);
        if (index >= 0) {
          this.eventHandlers[eventName].splice(index, 1);
        }
      }
    }
  }
  trigger () {
    let eventName = arguments[0];
    let args = Array.prototype.slice.call(arguments, 1);
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].forEach(callback => {
        window.setTimeout(() => { // Add timeout to prevent blocking
          callback.apply(this, args);
        }, 0);
      });
    }
  }
}

export default Model;
