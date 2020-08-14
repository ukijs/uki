const createMixinAndDefault = function ({
  DefaultSuperClass = Object,
  classDefFunc,
  requireDefault = true,
  allowRemixinHandler = () => false,
  mixedInstanceOfDefault = true
}) {
  // Mixin function
  const Mixin = function (SuperClass) {
    if (SuperClass instanceof Mixin && !allowRemixinHandler(SuperClass)) {
      // If the same mixin is used more than once, generally we don't want to
      // remix; allowRemixinHandler can return true if we really allow for this,
      // and/or do special things in the event of a remix
      return SuperClass;
    }
    // Mixed class definition can inherit any arbitrary SuperClass...
    const MixedClass = classDefFunc(SuperClass);
    if (requireDefault &&
        SuperClass !== DefaultSuperClass &&
        !(MixedClass.prototype instanceof DefaultSuperClass)) {
      // ... but in most cases, we require that it EVENTUALLY inherits from
      // DefaultSuperClass. Can be overridden with requireDefault = false
      throw new Error(`${MixedClass.name} must inherit from ${DefaultSuperClass.name}`);
    }
    // Add a hidden property to the mixed class so we can handle instanceof
    // checks properly
    MixedClass.prototype[`_instanceOf${MixedClass.name}`] = true;
    return MixedClass;
  };
  // Default class definition inherits directly from DefaultSuperClass
  const DefaultClass = Mixin(DefaultSuperClass);
  // Make the Mixin function behave like a class for instanceof Mixin checks
  Object.defineProperty(Mixin, Symbol.hasInstance, {
    value: i => !!i?.[`_instanceOf${DefaultClass.name}`]
  });
  if (mixedInstanceOfDefault) {
    // Make instanceof DefaultClass true for anything that technically is only
    // an instanceof Mixin
    Object.defineProperty(DefaultClass, Symbol.hasInstance, {
      value: i => !!i?.[`_instanceOf${DefaultClass.name}`]
    });
  }
  // Return both the default class and the mixin function
  const wrapper = {};
  wrapper[DefaultClass.name] = DefaultClass;
  wrapper[DefaultClass.name + 'Mixin'] = Mixin;
  return wrapper;
};

export default createMixinAndDefault;
