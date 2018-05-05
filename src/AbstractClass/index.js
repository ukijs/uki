import queueAsync from '../queueAsync.js';

class AbstractClass {
  requireProperties (properties) {
    queueAsync(() => {
      properties.forEach(m => {
        if (this[m] === undefined) {
          throw new TypeError(m + ' is undefined for class ' + this.constructor.name);
        }
      });
    });
  }
}
export default AbstractClass;
