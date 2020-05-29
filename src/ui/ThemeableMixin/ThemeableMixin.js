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
  class ThemeableView extends SuperClass {
    constructor (options = {}) {
      // setting theme to null prevents the default stylesheet from loading
      // (for themes that want to build their styles from scratch)
      if (options.theme !== null) {
        options.resources = options.resources || [];
        for (const { sheet, type } of Object.values(ThemeableView.prototype._defaultThemeSheets)) {
          const resource = { type, raw: sheet };
          // leaving theme as undefined applies the default stylesheet, but
          // no overrides (for no theme, or themes that only want to override
          // the defaults after the fact)
          if (options.theme) {
            // Setting theme as an object allows themes to override less or CSS
            // variables from javascript. Note that the appropriate @ or --
            // prefixes are still required
            if (type === 'less') {
              resource.lessArgs = { modifyVars: options.theme };
            } else {
              resource.then = () => {
                const root = document.documentElement;
                for (const [cssVar, override] of Object.entries(options.theme)) {
                  root.style.setProperty(cssVar, override);
                }
              };
            }
          }
          options.resources.push(resource);
        }
      }
      super(options);
    }
    setup () {
      super.setup(...arguments);
      for (const [className, { cnNotOnD3el }] of Object.entries(ThemeableView.prototype._defaultThemeSheets)) {
        if (cnNotOnD3el === false) {
          // The className applies to the view's d3el
          this.d3el.classed(className, true);
        }
      }
    }
  }
  ThemeableView.prototype._instanceOfThemeableMixin = true;
  ThemeableView.prototype._defaultThemeSheets = {};
  ThemeableView.prototype._defaultThemeSheets[className] = {
    sheet: defaultStyle,
    type: defaultSheetType,
    cnNotOnD3el
  };
  return ThemeableView;
};
Object.defineProperty(ThemeableMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfThemeableMixin
});

export { ThemeableMixin };
