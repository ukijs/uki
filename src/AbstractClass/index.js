class AbstractClass {
  requireProperties (properties) {
    properties.forEach(m => {
      if (this[m] === undefined) {
        throw new TypeError(m + ' is undefined for class ' + this.constructor.name);
      }
    });
  }
}
export default AbstractClass;
