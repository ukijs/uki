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
    MixedClass.prototype._ukiMixinInheritance = (SuperClass.prototype._ukiMixinInheritance || []).concat([MixedClass.name]);
    return MixedClass;
  };
  // Default class definition inherits directly from DefaultSuperClass
  const DefaultClass = Mixin(DefaultSuperClass);
  // Make the Mixin function behave like a class for instanceof Mixin checks;
  // the tested object should start with the same class inheritance order
  Object.defineProperty(Mixin, Symbol.hasInstance, {
    value: i => DefaultClass.prototype._ukiMixinInheritance.every((className, index) => {
      return className === i?._ukiMixinInheritance?.[index];
    })
  });
  if (mixedInstanceOfDefault) {
    // Make instanceof DefaultClass true for anything that technically only
    // shares the same inheritance pattern (i.e. this is softer than strict
    // javascript inheritance, and allows for something that's only descended
    // from Mixin to still pass the instanceof DefaultClass check)
    Object.defineProperty(DefaultClass, Symbol.hasInstance, {
      value: i => DefaultClass.prototype._ukiMixinInheritance.every((className, index) => {
        return className === i?._ukiMixinInheritance?.[index];
      })
    });
  }
  // Return both the default class and the mixin function
  const wrapper = {};
  wrapper[DefaultClass.name] = DefaultClass;
  wrapper[DefaultClass.name + 'Mixin'] = Mixin;
  return wrapper;
};

export default createMixinAndDefault;
