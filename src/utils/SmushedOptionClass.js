import createMixinAndDefault from './createMixinAndDefault.js';

function smushOptionObj (defaultObj, optionObj, classObj, keySet) {
  const resultObj = {};
  if (!keySet) {
    keySet = new Set([
      ...Object.keys(defaultObj),
      ...Object.keys(optionObj)
    ]);
  }
  for (const key of keySet) {
    let value = classObj && classObj[key] !== undefined
      ? classObj[key]
      : optionObj && optionObj[key] !== undefined
        ? optionObj[key]
        : defaultObj && defaultObj[key] !== undefined
          ? defaultObj[key]
          : undefined;
    // Only smush pure Objects
    if (value.constructor === Object) {
      value = smushOptionObj((defaultObj || {})[key], (optionObj || {})[key], (classObj || {})[key], new Set(Object.keys(value)));
    }
    resultObj[key] = value;
  }
  return resultObj;
}

function smushDefaultOptions (obj) {
  const result = {};
  for (const constructor of getConstructorChain(obj)) {
    Object.assign(result, constructor.defaultOptions || {});
  }
  return result;
}

function getConstructorChain (obj) {
  var constructors = [], prototype = obj;
  do {
    prototype = Object.getPrototypeOf(prototype);
    if (prototype && prototype.constructor) {
      constructors.unshift(prototype.constructor)
    };
  } while (prototype != null);
  return constructors;
}

const { SmushedOptionClass, SmushedOptionClassMixin } = createMixinAndDefault({
  classDefFunc: SuperClass => class SmushedOptionClass extends SuperClass {
    constructor (options = {}, ...args) {
      super(options, ...args);
      // Apply options, with the following order of precedence:
      // - Options in a static defaultOptions (if defined) will be applied if
      //   options are not otherwise specified
      // - Options passed in to the first constructor argument override any
      //   defaultOptions
      // - Options defined on subclasses (either directly, or with getters /
      //   setters) override all of the above
      this._options = smushOptionObj(smushDefaultOptions(this), options, this);

      // Create getters and setters for all options if they don't already
      // exist
      for (const prop of Object.keys(this._options)) {
        const descriptor = Object.getOwnPropertyDescriptor(this, prop);
        if (!descriptor || !descriptor.get || !descriptor.set) {
          Object.defineProperty(this, prop, {
            get: () => this._options[prop],
            // eslint-disable-next-line no-return-assign
            set: value => this._options[prop] = value
          });
        }
      }
    }
  }
});

export { SmushedOptionClass, SmushedOptionClassMixin, smushOptionObj };
