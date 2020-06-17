const ThemeableMixin = function ({
  SuperClass,
  defaultStyle, // Raw text of default stylesheet
  className, // AKA "module" in SMACSS style; themed views should namespace all their default styles with this string
  defaultSheetType = 'css',
  cnNotOnD3el = false // By default, Themed views will have the className set as a class name on the view's d3el; this prevents that
}) {
  if (SuperClass instanceof ThemeableMixin) {
    SuperClass.prototype._defaultThemeSheets[className] = {
      sheet: defaultStyle,
      type: defaultSheetType,
      cnNotOnD3el
    };
    return SuperClass;
  }
  class Themeable extends SuperClass {
    constructor (options = {}) {
      const applyLessOverrides = resource => {
        if (options.lessOverrides && resource.type === 'less') {
          const lessArgs = resource.lessArgs || {};
          lessArgs.modifyVars = lessArgs.modifyVars || {};
          Object.assign(lessArgs.modifyVars, options.lessOverrides);
          resource.lessArgs = lessArgs;
        }
      };

      // options.theme can be null to prevent the default stylesheets from
      // loading (for things that want to start from scratch with external
      // stylesheets, unpolluted with our defaults)
      if (options.theme !== null) {
        options.resources = options.resources || [];
        // options.theme can be a resource object to override the default
        // stylesheets
        if (options.theme !== undefined) {
          applyLessOverrides(options.theme);
          options.resources.push(options.theme);
        } else {
          // Leaving options.theme as undefined applies the default stylesheets
          for (const { sheet, type } of Object.values(Themeable.prototype._defaultThemeSheets)) {
            const resource = { type, raw: sheet };
            applyLessOverrides(resource);
            options.resources.push(resource);
          }
        }
      }
      super(options);
      this._cssOverrides = options.cssOverrides || {};
    }
    setup () {
      super.setup(...arguments);
      for (const [className, { cnNotOnD3el }] of Object.entries(Themeable.prototype._defaultThemeSheets)) {
        if (cnNotOnD3el === false) {
          // The className applies to the view's d3el
          this.d3el.classed(className, true);
        }
      }
      const element = this.d3el.node();
      for (const [cssVar, override] of Object.entries(this._cssOverrides)) {
        element.style.setProperty(cssVar, override);
      }
    }
  }
  Themeable.prototype._instanceOfThemeableMixin = true;
  Themeable.prototype._defaultThemeSheets = {};
  Themeable.prototype._defaultThemeSheets[className] = {
    sheet: defaultStyle,
    type: defaultSheetType,
    cnNotOnD3el
  };
  return Themeable;
};
Object.defineProperty(ThemeableMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfThemeableMixin
});

export { ThemeableMixin };
