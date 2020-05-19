const RestylableMixin = function (superclass, defaultStyle, namespace, omitNamespace = false) {
  if (superclass instanceof RestylableMixin) {
    superclass.prototype._restylableSheets[namespace] = {
      sheet: defaultStyle,
      omitNamespace
    };
    return superclass;
  }
  class Restylable extends superclass {
    constructor (options = {}) {
      if (options.stylesheets !== null) {
        options.resources = options.resources || [];
        for (const { sheet } of Object.values(Restylable.prototype._restylableSheets)) {
          options.resources.push({ type: 'css', raw: sheet });
        }
      }
      super(options);
    }
    setup () {
      super.setup();
      for (const [namespace, { omitNamespace }] of Object.entries(Restylable.prototype._restylableSheets)) {
        if (omitNamespace === false) {
          this.d3el.classed(namespace, true);
        }
      }
    }
  }
  Restylable.prototype._instanceOfRestylableMixin = true;
  Restylable.prototype._restylableSheets = {};
  Restylable.prototype._restylableSheets[namespace] = {
    sheet: defaultStyle,
    omitNamespace
  };
  return Restylable;
};
Object.defineProperty(RestylableMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfRestylableMixin
});

export { RestylableMixin };
