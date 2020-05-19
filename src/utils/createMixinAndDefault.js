const createMixinAndDefault = function (mixinName, DefaultBaseClass, coreClassDefFunc, requireDefault = false) {
  const Mixin = function (superclass) {
    if (superclass instanceof Mixin) {
      return superclass;
    }
    if (requireDefault &&
        superclass !== DefaultBaseClass &&
        !(superclass.prototype instanceof DefaultBaseClass)) {
      throw new Error(`${mixinName} must inherit from ${DefaultBaseClass.name}`);
    }
    const CoreClass = coreClassDefFunc(superclass);
    CoreClass.prototype[`_instanceOf${mixinName}`] = true;
    return CoreClass;
  };
  Object.defineProperty(Mixin, Symbol.hasInstance, {
    value: i => !!i[`_instanceOf${mixinName}`]
  });
  const DefaultClass = Mixin(DefaultBaseClass);
  const wrapper = {};
  wrapper[DefaultClass.name] = DefaultClass;
  wrapper[mixinName] = Mixin;
  return wrapper;
};

export default createMixinAndDefault;
