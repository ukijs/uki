/* globals d3, less */

class Model {
  constructor (options = {}) {
    this._eventHandlers = {};
    this._stickyTriggers = {};
    this.ready = new Promise(async (resolve, reject) => {
      await this._loadResources(options.resources || []);
      this.trigger('load');
      resolve();
    });
  }
  _loadJS (url, raw, extraAttrs = {}) {
    if (Model.JS_PROMISES[url]) {
      // We've already loaded the script
      return Model.JS_PROMISES[url];
      // TODO: probably not worth the extra check for
      // document.querySelector(`script[src="${url}"]`)
      // because we have no way of knowing if its onload() has already been
      // been fired. Better to rely on clients to check on their own if a
      // library already exists (i.e. was loaded outside uki) before trying to
      // have uki load it
    }
    const script = document.createElement('script');
    script.type = 'application/javascript';
    for (const [key, value] of Object.entries(extraAttrs)) {
      script.setAttribute(key, value);
    }
    Model.JS_PROMISES[url] = new Promise((resolve, reject) => {
      script.addEventListener('load', () => { resolve(script); });
    });
    if (url) {
      script.src = url;
    } else if (raw) {
      script.innerText = raw;
    } else {
      throw new Error('Either a url or raw argument is required for JS resources');
    }
    document.getElementsByTagName('head')[0].appendChild(script);
    return Model.JS_PROMISES[url];
  }
  _loadCSS (url, raw, extraAttrs = {}) {
    if (url) {
      if (document.querySelector(`link[href="${url}"]`)) {
        // We've already added this stylesheet
        return Promise.resolve(document.querySelector(`link[href="${url}"]`));
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.media = 'screen';
      for (const [key, value] of Object.keys(extraAttrs)) {
        link.setAttribute(key, value);
      }
      const loadPromise = new Promise((resolve, reject) => {
        link.onload = () => { resolve(link); };
      });
      link.href = url;
      document.getElementsByTagName('head')[0].appendChild(link);
      return loadPromise;
    } else if (raw) {
      const style = document.createElement('style');
      style.type = 'text/css';
      for (const [key, value] of Object.keys(extraAttrs)) {
        style.setAttribute(key, value);
      }
      style.innerText = raw;
      document.getElementsByTagName('head')[0].appendChild(style);
      return Promise.resolve(style);
    } else {
      throw new Error('Either a url or raw argument is required for CSS resources');
    }
  }
  async _loadLESS (url, raw, extraAttrs = {}) {
    // If we've already added this stylesheet, or are in the process of adding
    // it, just point to the existing one
    if (Model.LESS_PROMISES[url]) {
      return Model.LESS_PROMISES[url];
    } else if (document.querySelector(`link[href="${url}"]`)) {
      return Promise.resolve(document.querySelector(`link[href="${url}"]`));
    }
    let cssPromise;
    if (url) {
      cssPromise = less.render(`@import '${url}';`);
    } else if (raw) {
      cssPromise = less.render(raw);
    } else {
      throw new Error('Either a url or raw argument is required for LESS resources');
    }
    Model.LESS_PROMISES[url] = cssPromise.then(result => {
      // TODO: maybe do magic here to make LESS variables accessible under
      // this.resources?
      return this._loadCSS(undefined, result.css, extraAttrs);
    });
    return Model.LESS_PROMISES[url];
  }
  async _getCoreResourcePromise (spec) {
    let p;
    if (spec instanceof Promise) {
      // An arbitrary promise
      return spec;
    } else if (spec.type === 'css') {
      // Load pure css directly
      p = this._loadCSS(spec.url, spec.raw, spec.extraAttributes || {});
    } else if (spec.type === 'less') {
      // Convert LESS to CSS
      p = this._loadLESS(spec.url, spec.raw, spec.extraAttributes || {});
    } else if (spec.type === 'fetch') {
      // Raw fetch request
      p = window.fetch(spec.url, spec.init || {});
    } else if (spec.type === 'js') {
      // Load a legacy JS script (i.e. something that can't be ES6-imported)
      p = this._loadJS(spec.url, spec.raw, spec.extraAttributes || {});
    } else if (d3[spec.type]) {
      // One of D3's native types
      const args = [];
      if (spec.init) {
        args.push(spec.init);
      }
      if (spec.row) {
        args.push(spec.row);
      }
      if (spec.type === 'dsv') {
        p = d3[spec.type](spec.delimiter, spec.url, ...args);
      } else {
        p = d3[spec.type](spec.url, ...args);
      }
    } else {
      throw new Error(`Can't load resource ${spec.url} of type ${spec.type}`);
    }
    if (spec.then) {
      if (spec.storeOriginalResult) {
        p.then(spec.then);
      } else {
        p = p.then(spec.then);
      }
    }
    return p;
  }
  async _loadResources (specs = []) {
    // uki itself needs d3.js; make sure it exists
    if (!window.d3) {
      await this._loadJS('https://d3js.org/d3.v5.min.js');
    }

    // Don't need to do anything else; this makes some code cleaner below
    if (specs.length === 0) {
      return;
    }

    // First, construct a lookup of named dependencies
    this._resourceLookup = {};
    specs.forEach((spec, i) => {
      if (spec.name) {
        this._resourceLookup[spec.name] = i;
      }
    });
    // Next, collect dependencies, with a deep copy for Kahn's algorithm to delete
    let hasLESSresources = false;
    const tempDependencies = [];
    const dependencies = specs.map((spec, i) => {
      const result = [];
      if (spec.type === 'less') {
        hasLESSresources = true;
      }
      for (const name of spec.loadAfter || []) {
        if (!this._resourceLookup[name]) {
          throw new Error(`Can't loadAfter unknown resource: ${name}`);
        }
        result.push(this._resourceLookup[name]);
      }
      tempDependencies.push(Array.from(result));
      return result;
    });
    // Add and await LESS script if needed
    if (hasLESSresources && !window.less) {
      if (!window.less) {
        await this._loadJS('https://cdnjs.cloudflare.com/ajax/libs/less.js/3.11.1/less.min.js');
      }
    }
    // Now do Kahn's algorithm to topologically sort the graph, starting from
    // the resources with no dependencies
    let roots = Object.keys(specs)
      .filter(index => dependencies[index].length === 0);
    // Ensure that there's at least one root with no dependencies
    if (roots.length === 0) {
      throw new Error(`No resource without loadAfter dependencies`);
    }
    const topoSortOrder = [];
    while (roots.length > 0) {
      const index = parseInt(roots.shift());
      topoSortOrder.push(index);
      // Remove references to index from the graph
      for (const [childIndex, refList] of Object.entries(tempDependencies)) {
        const refIndex = refList.indexOf(index);
        if (refIndex > -1) {
          refList.splice(refIndex, 1);
          // If we removed this child's last dependency, it can go into the roots
          if (refList.length === 0) {
            roots.push(childIndex);
          }
        }
      }
    }
    if (topoSortOrder.length !== specs.length) {
      throw new Error(`Cyclic loadAfter resource dependency`);
    }
    // Load dependencies in topological order
    const resourcePromises = [];
    for (const index of topoSortOrder) {
      const parentPromises = dependencies[index]
        .map(parentIndex => resourcePromises[parentIndex]);
      resourcePromises[index] = Promise.all(parentPromises)
        .then(() => this._getCoreResourcePromise(specs[index]));
    }

    this.resources = await Promise.all(resourcePromises);
  }
  getNamedResource (name) {
    return this._resourceLookup[name] === undefined ? null
      : this.resources[this._resourceLookup[name]];
  }
  on (eventName, callback) {
    let [event, namespace] = eventName.split('.');
    this._eventHandlers[event] = this._eventHandlers[event] ||
      { '': [] };
    if (!namespace) {
      this._eventHandlers[event][''].push(callback);
    } else {
      this._eventHandlers[event][namespace] = callback;
    }
  }
  off (eventName, callback) {
    let [event, namespace] = eventName.split('.');
    if (this._eventHandlers[event]) {
      if (!namespace) {
        if (!callback) {
          this._eventHandlers[event][''] = [];
        } else {
          let index = this._eventHandlers[event][''].indexOf(callback);
          if (index >= 0) {
            this._eventHandlers[event][''].splice(index, 1);
          }
        }
      } else {
        delete this._eventHandlers[event][namespace];
      }
    }
  }
  trigger (event, ...args) {
    // TODO: maybe promise-ify this, so that anyone triggering an event has a
    // way of knowing that everyone has finished responding to it?
    const handleCallback = callback => {
      window.setTimeout(() => { // Timeout to prevent blocking
        callback.apply(this, args);
      }, 0);
    };
    if (this._eventHandlers[event]) {
      for (const namespace of Object.keys(this._eventHandlers[event])) {
        if (namespace === '') {
          this._eventHandlers[event][''].forEach(handleCallback);
        } else {
          handleCallback(this._eventHandlers[event][namespace]);
        }
      }
    }
  }
  stickyTrigger (eventName, argObj, delay = 10) {
    this._stickyTriggers[eventName] = this._stickyTriggers[eventName] || { argObj: {} };
    Object.assign(this._stickyTriggers[eventName].argObj, argObj);
    clearTimeout(this._stickyTriggers.timeout);
    this._stickyTriggers.timeout = setTimeout(() => {
      let argObj = this._stickyTriggers[eventName].argObj;
      delete this._stickyTriggers[eventName];
      this.trigger(eventName, argObj);
    }, delay);
  }
}
Model.LESS_PROMISES = {};
Model.JS_PROMISES = {};

/**
 * View classes
 */
class View extends Model {
  constructor (options = {}) {
    super(options);
    this.d3el = this.checkForEmptySelection(options.d3el || null);
    this.dirty = true;
    this._drawTimeout = null;
    this._renderResolves = [];
    this.debounceWait = options.debounceWait || 100;
    if (!options.suppressInitialRender) {
      this.render();
    }
  }
  checkForEmptySelection (d3el) {
    if (d3el && d3el.node() === null) {
      // Only trigger a warning if an empty selection gets passed in; undefined
      // is still just fine because render() doesn't always require an argument
      console.warn('Empty d3 selection passed to uki.js View');
      return null;
    } else {
      return d3el;
    }
  }
  async render (d3el = this.d3el) {
    d3el = this.checkForEmptySelection(d3el);
    if (!this.d3el || (d3el && d3el.node() !== this.d3el.node())) {
      this.d3el = d3el;
      this.dirty = true;
    }
    if (!this.d3el) {
      // Don't execute any render calls until all resources are loaded,
      // and we've actually been given a d3 element to work with
      return new Promise((resolve, reject) => {
        this._renderResolves.push(resolve);
      });
    }
    await this.ready;
    if (this.dirty && this._setupPromise === undefined) {
      // Need a fresh render; call setup immediately
      this.d3el = d3el;
      this.updateContainerCharacteristics(this.d3el);
      this._setupPromise = this.setup(this.d3el);
      this.dirty = false;
      await this._setupPromise;
      delete this._setupPromise;
      this.trigger('setupFinished');
    }
    // Debounce the actual draw call, and return a promise that will resolve
    // when draw() actually finishes
    return new Promise((resolve, reject) => {
      this._renderResolves.push(resolve);
      clearTimeout(this._drawTimeout);
      this._drawTimeout = setTimeout(async () => {
        this._drawTimeout = null;
        if (this._setupPromise) {
          await this._setupPromise;
        }
        await this.draw(this.d3el);
        for (const r of this._renderResolves) {
          r();
        }
        this._renderResolves = [];
      }, this.debounceWait);
    });
  }

  setup (d3el) {}
  draw (d3el) {}
  updateContainerCharacteristics (d3el) {
    this.emSize = parseFloat(d3el.style('font-size'));
    this.scrollBarSize = this.computeScrollBarSize(d3el);
  }
  getBounds (d3el = this.d3el) {
    if (d3el) {
      return d3el.node().getBoundingClientRect();
    } else {
      return { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 };
    }
  }
  computeScrollBarSize (d3el) {
    // blatantly adapted from SO thread:
    // http://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
    var outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.width = '100px';
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

    d3el.node().appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = 'scroll';

    // add innerdiv
    var inner = document.createElement('div');
    inner.style.width = '100%';
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
  }
}

var defaultTheme = "/* This file isn't actually used; it's just here for reference, as it's what goldenlayout-custom-theme.less is based on */\n\n// Color variables (appears count calculates by raw css)\n@color0: #e1e1e1; // Appears 3 times\n@color1: #000000; // Appears 4 times\n@color2: #cccccc; // Appears 3 times\n@color3: #777777; // Appears 2 times\n\n@color4: #ffffff; // Appears 1 time\n@color5: #555555; // Appears 1 time\n@color6: #452500; // Appears 1 time\n@color7: #fafafa; // Appears 1 time\n@color8: #999999; // Appears 1 time\n@color9: #bbbbbb; // Appears 1 time\n@color10: #888888; // Appears 1 time\n@color11: #f4f4f4; // Appears 1 time\n\n// Images\n@lmCloseBlack: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAKUlEQVR4nGNgYGD4z4Af/Mdg4FKASwCnDf8JKSBoAtEmEXQTQd8RDCcA6+4Q8OvIgasAAAAASUVORK5CYII=\");\n@lmPopoutBlack: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAANUlEQVR4nI2QMQoAMAwCz5L/f9mOzZIaN0E9UDyZhaaQz6atgBHgambEJ5wBKoS0WaIvfT+6K2MIECN19MAAAAAASUVORK5CYII=\");\n@lmMaximiseBlack: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAIklEQVR4nGNkYGD4z0AAMBFSAAOETPpPlEmDUREjAxHhBABPvAQLFv3qngAAAABJRU5ErkJggg==\");\n@lmDockedBlack: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAC6SURBVHjavNRRFYIwFAbgLwJRaCBRaCIRbGAEaSARaKANpMF8GedM3BSV4wMvY/u4+++GEIItns8m0/wMoUHA8WsIFS7oMOawtVCPPkGfsFeLa+ywx4RqUeEDVgIuMY8R11zIcZthfpfLYsKQVpCZc1p+oFTRhLbQuVvMrHqbUQmLVXQftT/JoE3GhtKhLCFtRLq5sphNQL0KSpB2sc0zrquuyBLJZFa/hUpI2vZVtx+HErL5b+Qv0H0Axmb86JFNd6MAAAAASUVORK5CYII=\");\n@lmMinimizeBlack: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAJklEQVR4nGP8//8/AyHARFDFUFbEwsDAwMDIyIgzHP7//89IlEkApSkHEScJTKoAAAAASUVORK5CYII=\");\n@lmPopinBlack: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAJCAYAAADpeqZqAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AIMBA8Y4uozqQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAQ0lEQVQY072OMQ6AMAzEzhH//7I7oKKKoSULXjI5Z5KokgXAbEANoMq8WwGs3FOcvq/Ul5w311zqSNVdefJ+kUjSzhteChsRI/jXegAAAABJRU5ErkJggg==\");\n\n// \".lm_dragging\" is applied to BODY tag during Drag and is also directly applied to the root of the object being dragged\n\n// Entire GoldenLayout Container, if a background is set, it is visible as color of \"pane header\" and \"splitters\" (if these latest has opacity very low)\n.lm_goldenlayout {\n  background:@color11;\n}\n\n// Single Pane content (area in which final dragged content is contained)\n.lm_content {\n  background: @color0;\n  border: 1px solid @color2;\n}\n\n// Single Pane content during Drag (style of moving window following mouse)\n.lm_dragProxy {\n  .lm_content {\n    box-shadow: 2px 2px 4px fade(@color1,20%);\n  }\n}\n\n// Placeholder Container of target position\n.lm_dropTargetIndicator {\n  box-shadow: inset 0 0 30px fade(@color1,40%);\n  outline: 1px dashed @color2;\n\n  // Inner Placeholder\n  .lm_inner {\n    background: @color1;\n    opacity: 0.1;\n  }\n}\n\n// Separator line (handle to change pane size)\n.lm_splitter {\n  background: @color8;\n  opacity: 0.001;\n  transition: opacity 200ms ease;\n\n  &:hover, // When hovered by mouse...\n  &.lm_dragging {\n    background: @color9;\n    opacity: 1;\n  }\n}\n\n// Pane Header (container of Tabs for each pane)\n.lm_header {\n  height: 20px;\n\n  // Single Tab container. A single Tab is set for each pane, a group of Tabs are contained in \".lm_header\"\n  .lm_tab {\n    font-family: Arial, sans-serif;\n    font-size: 12px;\n    color: @color10;\n    background: @color7;\n    margin-right: 2px;\n    padding-bottom: 4px;\n    border: 1px solid @color2;\n    border-bottom: none;\n\n    .lm_title {\n      padding-top: 1px;\n    }\n\n    // Close Tab Icon\n    .lm_close_tab {\n      width: 11px;\n      height: 11px;\n      background-image: @lmCloseBlack;\n      background-position: center center;\n      background-repeat: no-repeat;\n      top: 4px;\n      right: 6px;\n      opacity: 0.4;\n\n      &:hover {\n        opacity: 1;\n      }\n    }\n\n    // If Tab is active, so if it's in foreground\n    &.lm_active {\n      border-bottom: none;\n      box-shadow: 2px -2px 2px -2px fade(@color1,20%);\n      padding-bottom: 5px;\n\n      .lm_close_tab {\n        opacity: 1;\n      }\n    }\n  }\n}\n\n.lm_dragProxy,\n.lm_stack {\n  &.lm_right {\n    .lm_header .lm_tab {\n      &.lm_active {\n        box-shadow: 2px -2px 2px -2px fade(@color1,20%);\n      }\n    }\n  }\n\n  &.lm_bottom {\n    .lm_header .lm_tab {\n      &.lm_active {\n        box-shadow: 2px 2px 2px -2px fade(@color1,20%);\n      }\n    }\n  }\n}\n\n// If Pane Header (container of Tabs for each pane) is selected (used only if addition of new Contents is made \"by selection\" and not \"by drag\")\n.lm_selected {\n  .lm_header {\n    background-color: @color6;\n  }\n}\n\n.lm_tab {\n  &:hover, // If Tab is hovered\n  &.lm_active // If Tab is active, so if it's in foreground\n  {\n    background: @color0;\n    color: @color3;\n  }\n}\n\n// Dropdown arrow for additional tabs when too many to be displayed\n.lm_header .lm_controls .lm_tabdropdown:before {\n  color: @color1;\n}\n\n// Pane controls (popout, maximize, minimize, close)\n.lm_controls {\n  // All Pane controls shares these\n  > li {\n    position: relative;\n    background-position: center center;\n    background-repeat: no-repeat;\n    opacity: 0.4;\n    transition: opacity 300ms ease;\n\n    &:hover {\n      opacity: 1;\n    }\n  }\n\n  // Icon to PopOut Pane, so move it to a different Browser Window\n  .lm_popout {\n    background-image: @lmPopoutBlack;\n  }\n\n  // Icon to Maximize Pane, so it will fill the entire GoldenLayout Container\n  .lm_maximise {\n    background-image: @lmMaximiseBlack;\n  }\n\n  // Icon to Close Pane and so remove it from GoldenLayout Container\n  .lm_close {\n    background-image: @lmCloseBlack;\n  }\n\n  // Icon to toggle Pane Docking at mouse hover\n  .lm_dock {\n    background-image: @lmDockedBlack;\n    transform:rotate(-45deg);\n    transition:transform 300ms;\n  }\n}\n\n.lm_stack.lm_docked {\n  .lm_controls .lm_dock {\n    transform:rotate(0deg);\n  }\n\n  > .lm_items {\n    border-color: @color9;\n    border-image: linear-gradient(to right, @color9 1%, @color4 100%);\n    box-shadow: 2px 2px 2px -2px fade(@color1,20%);\n  }\n}\n\n// If a specific Pane is maximized\n.lm_maximised {\n  // Pane Header (container of Tabs for each pane) can have different style when is Maximized\n  .lm_header {\n    background-color: @color4;\n  }\n\n  // Pane controls are different in Maximized Mode, especially the old Icon \"Maximise\" that now has a different meaning, so \"Minimize\" (even if CSS Class did not change)\n  .lm_controls {\n    .lm_maximise {\n      background-image: @lmMinimizeBlack;\n    }\n  }\n}\n\n.lm_transition_indicator {\n  background-color: @color1;\n  border: 1px dashed @color5;\n}\n\n// If a specific Pane is Popped Out, so move it to a different Browser Window, Icon to restore original position is:\n.lm_popin {\n  cursor: pointer;\n\n  // Background of Icon\n  .lm_bg {\n    background: @color1;\n    opacity: 0.7;\n  }\n\n  // Icon to Restore original position in Golden Layout Container\n  .lm_icon {\n    background-image: @lmPopinBlack;\n    background-position: center center;\n    background-repeat: no-repeat;\n    opacity: 0.7;\n  }\n\n  &:hover {\n    .lm_icon {\n      opacity: 1;\n    }\n  }\n}\n";

/* globals GoldenLayout */

class GLRootView extends View {
  constructor (options) {
    options.resources = options.resources || [];
    // Core CSS Styles
    options.resources.push({
      'type': 'css',
      'url': 'https://golden-layout.com/files/latest/css/goldenlayout-base.css'
    });
    // Theme
    if (options.glThemeResource) {
      options.resources.push(options.glThemeResource);
    } else {
      options.resources.push({
        type: 'less',
        raw: defaultTheme
      });
    }

    // JS Dependencies if they aren't already loaded
    if (!window.jQuery) {
      options.resources.push({
        type: 'js',
        url: 'https://code.jquery.com/jquery-3.4.1.min.js',
        extraAttributes: {
          integrity: 'sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=',
          crossorigin: 'anonymous'
        },
        name: 'jQuery'
      });
    }
    if (!window.GoldenLayout) {
      options.resources.push({
        type: 'js',
        url: 'https://golden-layout.com/files/latest/js/goldenlayout.min.js',
        loadAfter: ['jQuery']
      });
    }
    options.suppressInitialRender = true;
    super(options);

    this.glSettings = options.glSettings;
    this.viewClassLookup = options.viewClassLookup;
    this.ready.then(() => {
      this.setupLayout();
      this.render();
    });
  }
  setupLayout () {
    this.goldenLayout = new GoldenLayout(this.glSettings, this.d3el.node());
    this.views = {};
    for (const [className, ViewClass] of Object.entries(this.viewClassLookup)) {
      const self = this;
      this.goldenLayout.registerComponent(className, function (container, state) {
        const view = new ViewClass({
          glContainer: container,
          glState: state
        });
        self.views[className] = view;
      });
    }
    window.addEventListener('resize', () => {
      this.goldenLayout.updateSize();
      this.render();
    });
  }
  setup () {
    // Don't do init() until setup() because GoldenLayout sometimes misbehaves
    // if LESS hasn't finished loading
    this.goldenLayout.init();
    this.renderAllViews();
  }
  draw () {
    this.renderAllViews();
  }
  renderAllViews () {
    for (const view of Object.values(this.views)) {
      view.render();
    }
  }
}

const IntrospectableMixin = function (superclass) {
  const Introspectable = class extends superclass {
    get type () {
      return this.constructor.type;
    }
    get lowerCamelCaseType () {
      return this.constructor.lowerCamelCaseType;
    }
    get humanReadableType () {
      return this.constructor.humanReadableType;
    }
  };
  Object.defineProperty(Introspectable, 'type', {
    // This can / should be overridden by subclasses that follow a common string
    // pattern, such as RootToken, KeysToken, ParentToken, etc.
    configurable: true,
    get () { return this.name; }
  });
  Object.defineProperty(Introspectable, 'lowerCamelCaseType', {
    get () {
      const temp = this.type;
      return temp.replace(/./, temp[0].toLocaleLowerCase());
    }
  });
  Object.defineProperty(Introspectable, 'humanReadableType', {
    get () {
      // CamelCase to Sentence Case
      return this.type.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  });
  Introspectable.prototype._instanceOfIntrospectableMixin = true;
  return Introspectable;
};
Object.defineProperty(IntrospectableMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfIntrospectableMixin
});

/* globals d3 */

var recolorImageFilter = () => {
  // Extract all filters that look like url(#recolorImageToFFFFFF) from the
  // stylesheets that have been loaded in the document
  const colorScheme = {};
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(styleSheet.cssRules || styleSheet.rules)) {
        if (rule.style && rule.style.filter) {
          let hexCode = /#recolorImageTo(......)/.exec(rule.style.filter);
          if (hexCode && hexCode[1]) {
            colorScheme[hexCode[1]] = true;
          }
        }
      }
    } catch (err) {
      if (!(err instanceof window.DOMException)) {
        throw err;
      }
    }
  }

  for (const color of window.recolorImageFilterList || []) {
    colorScheme[color] = true;
  }

  if (d3.select('#recolorImageFilters').size() === 0) {
    let svg = d3.select('body').append('svg')
      .attr('id', 'recolorImageFilters')
      .attr('width', 0)
      .attr('height', 0);
    svg.append('defs');
  }

  // Generate SVG filters that can recolor images to whatever
  // color we need. Styles simply do something like
  // filter: url(#recolorImageToFFFFFF)
  let recolorFilters = d3.select('#recolorImageFilters')
    .selectAll('filter.recolor')
    .data(Object.keys(colorScheme), d => d);
  let recolorFiltersEnter = recolorFilters.enter().append('filter')
    .attr('class', 'recolor')
    .attr('id', d => 'recolorImageTo' + d);
  let cmpTransferEnter = recolorFiltersEnter.append('feComponentTransfer')
    .attr('in', 'SourceAlpha')
    .attr('result', 'color');
  cmpTransferEnter.append('feFuncR')
    .attr('type', 'linear')
    .attr('slope', 0)
    .attr('intercept', d => {
      let hexvalue = d.slice(0, 2);
      return Math.pow(parseInt(hexvalue, 16) / 255, 2);
    });
  cmpTransferEnter.append('feFuncG')
    .attr('type', 'linear')
    .attr('slope', 0)
    .attr('intercept', d => {
      let hexvalue = d.slice(2, 4);
      return Math.pow(parseInt(hexvalue, 16) / 255, 2);
    });
  cmpTransferEnter.append('feFuncB')
    .attr('type', 'linear')
    .attr('slope', 0)
    .attr('intercept', d => {
      let hexvalue = d.slice(4, 6);
      return Math.pow(parseInt(hexvalue, 16) / 255, 2);
    });
};



var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  IntrospectableMixin: IntrospectableMixin,
  recolorImageFilter: recolorImageFilter
});

var lessStyle = "@contentPadding: 0.25em;\n\n.GLView {\n  .scrollArea {\n    position: absolute;\n    top: @contentPadding;\n    left: @contentPadding;\n    right: @contentPadding;\n    bottom: @contentPadding;\n    overflow: auto;\n  }\n}\n";

/* globals d3 */

class GLView extends IntrospectableMixin(View) {
  constructor (options) {
    options.resources = options.resources || [];
    options.resources.push({
      type: 'less', raw: lessStyle
    });
    super(options);
    this.glContainer = options.glContainer;
    this.state = options.glState;
    this.isHidden = false;
    this.glContainer.on('tab', tab => {
      this.glTabEl = d3.select(tab.element[0]);
      this.setupTab();

      // GoldenLayout creates a separate DragProxy element that needs our
      // custom tab modifications while dragging
      tab._dragListener.on('dragStart', () => {
        const draggedTabElement = d3.select('.lm_dragProxy .lm_tab');
        this.setupTab(draggedTabElement);
        this.drawTab(draggedTabElement);
      });
    });
    this.glContainer.on('open', () => {
      this.glEl = d3.select(this.glContainer.getElement()[0]);
      this.glEl
        .classed('GLView', true)
        .classed(this.type, true);
      const d3el = this.setupD3El();
      this.render(d3el);
    });
    this.glContainer.on('hide', () => {
      this.isHidden = true;
    });
    this.glContainer.on('show', () => {
      this.isHidden = false;
      this.render();
    });
    this.glContainer.on('resize', () => this.render());
  }
  get title () {
    return this.humanReadableType;
  }
  setupTab () {
    this.glTabEl.classed(this.type, true);
  }
  drawTab () {
    this.glTabEl.select(':scope > .lm_title')
      .text(this.title);
  }
  setupD3El () {
    // Default setup is a scrollable div; subclasses might override this
    return this.glEl.append('div')
      .classed('scrollArea', true);
  }
  getAvailableSpace (content = this.d3el) {
    return content.node().getBoundingClientRect();
  }
  draw () {
    super.draw();
    if (this.glTabEl) {
      this.drawTab();
    }
  }
}

const FixedGLViewMixin = function (superclass) {
  const FixedGLView = class extends superclass {
    constructor (options) {
      super(options);
      this.fixedTagType = options.fixedTagType;
      this._previousBounds = { width: 0, height: 0 };
    }
    setupD3El () {
      return this.glEl.append(this.fixedTagType)
        .classed('FixedGLView', true)
        .attr('src', this.src)
        .on('load', () => { this.trigger('viewLoaded'); });
    }
    getBounds (el = this.glEl) {
      // Don't rely on non-dynamic width / height for available space; use
      // this.glEl instead of this.d3el
      return super.getBounds(el);
    }
    draw () {
      super.draw();

      const bounds = this.getBounds();
      if (this._previousBounds.width !== bounds.width ||
          this._previousBounds.height !== bounds.height) {
        this.trigger('viewResized');
      }
      this._previousBounds = bounds;
      this.d3el
        .attr('width', bounds.width)
        .attr('height', bounds.height);
    }
  };
  FixedGLView.prototype._instanceOfFixedGLViewMixin = true;
  return FixedGLView;
};
Object.defineProperty(FixedGLViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfFixedGLViewMixin
});

var lessStyle$1 = ".lm_header .lm_tab.svgTab {\n  padding-right: 36px;\n  .downloadIcon {\n    position: absolute;\n    width: 11px;\n    height: 11px;\n    background-image: url(\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6IzAwMDAwMDt9Cjwvc3R5bGU+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTYsMzU4LjVjNy43LTIxLjIsMTQuNC0yNS44LDM3LjQtMjUuOGM0MS40LDAsODIuOC0wLjEsMTI0LjIsMC4yYzQuMSwwLDksMi4yLDEyLDVjMTEuMywxMC42LDIyLDIxLjksMzMsMzIuOQoJCWMyNi4zLDI2LjEsNjAuMywyNi4yLDg2LjcsMC4xYzExLjItMTEuMSwyMi4xLTIyLjUsMzMuNy0zMy4zYzIuOC0yLjcsNy41LTQuNywxMS40LTQuN2M0MS40LTAuMyw4Mi44LTAuMiwxMjQuMi0wLjIKCQljMjMuMSwwLDI5LjcsNC42LDM3LjQsMjUuOGMwLDM0LjIsMCw2OC4zLDAsMTAyLjVjLTcuNywyMC44LTE0LjIsMjUuMS0zNywyNS4xYy0xNDIsMC0yODQsMC00MjYsMGMtMjIuOCwwLTI5LjMtNC40LTM3LTI1LjEKCQlDNiw0MjYuOCw2LDM5Mi43LDYsMzU4LjV6IE0zOTAsNDI4LjZjLTAuMS0xMC4xLTguNi0xOC43LTE4LjYtMTguOWMtMTAuMi0wLjItMTkuMyw4LjktMTkuMiwxOS4xYzAuMSwxMC40LDkuMSwxOSwxOS41LDE4LjcKCQlDMzgxLjgsNDQ3LjMsMzkwLjEsNDM4LjcsMzkwLDQyOC42eiBNNDQ3LjksNDQ3LjdjOS45LDAsMTguOC04LjcsMTkuMS0xOC42YzAuMy0xMC05LTE5LjQtMTkuMS0xOS40Yy0xMC4xLDAtMTkuMyw5LjQtMTkuMSwxOS40CgkJQzQyOS4xLDQzOSw0MzgsNDQ3LjcsNDQ3LjksNDQ3Ljd6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzEzLjUsMTc5LjNjMTkuOSwwLDM4LjgsMCw1Ny42LDBjNS40LDAsMTAuOSwwLjEsMTYuMywwYzkuNC0wLjMsMTYuNywyLjgsMjAuNiwxMS45CgkJYzMuOSw5LjMsMC40LDE2LjMtNi4zLDIyLjljLTQxLjEsNDAuOS04Miw4MS45LTEyMywxMjIuOWMtMjAuMywyMC4zLTI1LjIsMjAuMy00NS40LDAuMWMtNDAuOC00MC44LTgxLjYtODEuNi0xMjIuNS0xMjIuMwoJCWMtNi43LTYuNy0xMS0xMy42LTctMjMuNGMzLjctOC44LDEwLjUtMTIuMSwxOS43LTEyLjFjMjIsMC4xLDQ0LDAsNjYsMGMyLjgsMCw1LjUsMCw4LjksMGMwLTMuOSwwLTYuNywwLTkuNQoJCWMwLTQwLjEsMC04MC4yLDAtMTIwLjNjMC0xNi40LDcuMi0yMy41LDIzLjctMjMuNmMyMi44LTAuMSw0NS41LTAuMSw2OC4zLDBjMTUuOSwwLjEsMjMsNy40LDIzLjEsMjMuNGMwLDQwLjEsMCw4MC4yLDAsMTIwLjMKCQlDMzEzLjUsMTcyLjUsMzEzLjUsMTc1LjMsMzEzLjUsMTc5LjN6Ii8+CjwvZz4KPC9zdmc+Cg==\");\n    background-position: center center;\n    background-repeat: no-repeat;\n    background-size: 11px 11px;\n    top: 4px;\n    right: 6px;\n    margin-right: 13px;\n    opacity: 0.4;\n\n    &:hover {\n      opacity: 1;\n    }\n  }\n}\n";

/* globals d3 */

const SvgViewMixin = function (superclass) {
  const SvgView = class extends FixedGLViewMixin(superclass) {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle$1
      });
      options.fixedTagType = 'svg';
      super(options);
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
        .classed('svgTab', true)
        .append('div')
        .classed('downloadIcon', true)
        .attr('title', 'Download')
        .on('click', () => {
          this.downloadSvg();
        });
    }
    downloadSvg () {
      // Adapted from https://stackoverflow.com/a/37387449/1058935
      const containerElements = ['svg', 'g'];
      const relevantStyles = {
        'svg': ['width', 'height'],
        'rect': ['fill', 'stroke', 'stroke-width', 'opacity'],
        'p': ['font', 'opacity'],
        '.node': ['cursor', 'opacity'],
        'path': ['fill', 'stroke', 'stroke-width', 'opacity'],
        'circle': ['fill', 'stroke', 'stroke-width', 'opacity'],
        'line': ['stroke', 'stroke-width', 'opacity'],
        'text': ['fill', 'font-size', 'text-anchor', 'opacity'],
        'polygon': ['stroke', 'fill', 'opacity']
      };
      const copyStyles = (original, copy) => {
        const tagName = original.tagName;
        const allStyles = window.getComputedStyle(original);
        for (const style of relevantStyles[tagName] || []) {
          d3.select(copy).style(style, allStyles[style]);
        }
        if (containerElements.indexOf(tagName) !== -1) {
          for (let i = 0; i < original.children.length; i++) {
            copyStyles(original.children[i], copy.children[i]);
          }
        }
      };

      const original = this.d3el.node();
      const copy = original.cloneNode(true);
      copyStyles(original, copy);

      const data = new window.XMLSerializer().serializeToString(copy);
      const svg = new window.Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svg);

      const link = d3.select('body')
        .append('a')
        .attr('download', `${this.title}.svg`)
        .attr('href', url);
      link.node().click();
      link.remove();
    }
  };
  SvgView.prototype._instanceOfSvgViewMixin = true;
  return SvgView;
};
Object.defineProperty(SvgViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfSvgViewMixin
});

var lessStyle$2 = "iframe.IFrameView {\n  border: none;\n}\n\n.lm_header .lm_tab.IFrameTab {\n  padding-right: 36px;\n  .linkIcon {\n    position: absolute;\n    width: 11px;\n    height: 11px;\n    background-image: url(\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iNTEyIgogICBoZWlnaHQ9IjUxMiIKICAgdmlld0JveD0iMCAwIDUxMiA1MTIiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9InN2ZzgiCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTIuNCAoNWRhNjg5YzMxMywgMjAxOS0wMS0xNCkiCiAgIHNvZGlwb2RpOmRvY25hbWU9Imxpbmsuc3ZnIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzMiIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9ImJhc2UiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6em9vbT0iMC43IgogICAgIGlua3NjYXBlOmN4PSI5NTEuNjcyNDQiCiAgICAgaW5rc2NhcGU6Y3k9Ijg3OS4zMDQ2OSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC11bml0cz0icHgiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ibGF5ZXIxIgogICAgIHNob3dncmlkPSJ0cnVlIgogICAgIHVuaXRzPSJweCIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjMzNjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTc4MCIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iNzAzMCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTEyIgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgaW5rc2NhcGU6cGFnZWNoZWNrZXJib2FyZD0iZmFsc2UiPgogICAgPGlua3NjYXBlOmdyaWQKICAgICAgIHR5cGU9Inh5Z3JpZCIKICAgICAgIGlkPSJncmlkMTM1OCIKICAgICAgIHNwYWNpbmd4PSIyMCIKICAgICAgIHNwYWNpbmd5PSIyMCIgLz4KICA8L3NvZGlwb2RpOm5hbWVkdmlldz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE1Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZT48L2RjOnRpdGxlPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlua3NjYXBlOmxhYmVsPSJMYXllciAxIgogICAgIGlua3NjYXBlOmdyb3VwbW9kZT0ibGF5ZXIiCiAgICAgaWQ9ImxheWVyMSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC01NzkuMjUwMDEpIj4KICAgIDxnCiAgICAgICBpZD0iZzgzNyIKICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDEuOTI0NDY4OSwwLDAsMS45MjQ0Njg5LC0yMDMzLjI4ODQsLTgxNC45NDQ5MikiCiAgICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjAuNTE5NjIzODgiPgogICAgICA8cGF0aAogICAgICAgICBpZD0icGF0aDgzMSIKICAgICAgICAgZD0ibSAxMjc3LjcyOTgsOTg1LjEwMjIxIGMgNS44NzU0LC0yLjI2NzIxIDEwLjA1OTMsLTYuNDczOTEgMTIuMTA5NiwtMTIuMTc1NTkgMS41NzA2LC00LjM2NzcxIDEuNzAzMiwtOS42MjAwNCAxLjQ0NDksLTU3LjI0Mjc5IC0wLjI3NjgsLTUxLjA1MTY1IC0wLjMzOTEsLTUyLjUyNjA4IC0yLjM2NCwtNTUuOTMzODIgLTEuMTQzOCwtMS45MjUgLTMuOTkxMywtNC45NjI1IC02LjMyNzcsLTYuNzUgLTMuNzQ2MiwtMi44NjYgLTQuOTc3NCwtMy4yNDc0MSAtMTAuNDIwMywtMy4yMjgwNCAtOC4zMDE0LDAuMDI5NSAtMTMuNzQ1NSwyLjU4NTc0IC0xNy4zNjE4LDguMTUyMDYgbCAtMi44MTA1LDQuMzI1OTggLTAuMzA5Miw0Mi4yNSAtMC4zMDkzLDQyLjI1IEggMTE3NS40NDA4IDEwOTkuNSB2IC03Ni41IC03Ni41IGwgMzguNzUsLTAuMDA2IGMgMjMuNTY5NywtMC4wMDMgNDAuMjA2OSwtMC40MTAxOSA0Mi40Njg5LC0xLjAzODQzIDE4LjYxMDEsLTUuMTY4NTIgMTguMDg2OSwtMzIuNzE1MjkgLTAuNzE4OSwtMzcuODUyMjEgLTUuOTM3NSwtMS42MjE4NyAtMTAwLjQxMDQsLTEuNTA5NCAtMTA1Ljg4NCwwLjEyNjA2IC02LjM0MDcsMS44OTQ1NSAtMTIuMTczMyw4LjMyMDQ0IC0xMy41NDM2LDE0LjkyMTM0IC0wLjc5NCwzLjgyNDg1IC0xLjA0MDUsMzMuOTMxMTYgLTAuODQ2NCwxMDMuMzcyNjggbCAwLjI3NCw5Ny45NzY1NiAyLjUsNC40MTE0MiBjIDEuMzc1LDIuNDI2MjggMy42NTEsNS4yNjIwNyA1LjA1NzgsNi4zMDE3NyA2LjQ4OTQsNC43OTU5NSA0LjIxNTEsNC42OTYyMyAxMDguMTcyLDQuNzQyOTIgODguNDM5LDAuMDM5NyA5OC4xMzU3LC0wLjExMjc2IDEwMiwtMS42MDM5MSB6IgogICAgICAgICBzdHlsZT0iZmlsbDojMDAwMDAwO3N0cm9rZS13aWR0aDowLjUxOTYyMzg4IgogICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIiAvPgogICAgICA8cGF0aAogICAgICAgICBpZD0icGF0aDgyNyIKICAgICAgICAgZD0ibSAxMTkxLjc5OTcsODgwLjEyOTgxIGMgMy45NjgyLC0yLjAwODkzIDExLjU1NDIsLTkuMjA4NzIgNTMuMjkyNSwtNTAuNTc5MjMgMTguMjAwNywtMTguMDQwMzEgMzMuMzg4MiwtMzIuODAwNTcgMzMuNzUsLTMyLjgwMDU3IDAuMzYxOCwwIDAuNjY3Nyw2LjQxMjUgMC42Nzk4LDE0LjI1IDAuMDI1LDE2LjE3NzcyIDEuMDI4NiwxOS42NzU5IDcuMzc5LDI1LjcxODYyIDMuMzIyMywzLjE2MTIzIDQuMjcwNCwzLjUwMzk0IDEwLjY5OTEsMy44NjcxOSA1LjI0NDMsMC4yOTYzNCA4LjA0ODYsLTAuMDUgMTAuOTMyMSwtMS4zNTAzMiA0LjY2OTcsLTIuMTA1NzggOC45MzU1LC03LjkyOTc3IDEwLjA1NzksLTEzLjczMjExIDEuMzE2NywtNi44MDY0NSAxLjEwNTcsLTc3LjA5MDI5IC0wLjI0NzYsLTgyLjQ2NDQ5IC0xLjUyMTQsLTYuMDQyMDEgLTguMDYzMSwtMTIuODI4MjcgLTEzLjQ2NjYsLTEzLjk2OTk1IC0yLjEzMTcsLTAuNDUwNDIgLTIyLjEwMDksLTAuODE4OTQgLTQ0LjM3NTksLTAuODE4OTQgSCAxMjIwIGwgLTQuNDU1NiwyLjUgYyAtNS42NDksMy4xNjk2NCAtOS44NTUxLDkuMTQzOCAtMTAuNjYyNSwxNS4xNDQ3NCAtMC44OTMzLDYuNjM5NTIgMi44ODE0LDE0LjY3NjkzIDguNzAzNiwxOC41MzIzOCA0LjE0MjIsMi43NDI5MyA0LjcyODgsMi44MzcwNCAyMC43MTQ5LDMuMzIyODggbCAxNi40NTIsMC41IC00MS43Njc3LDQxIGMgLTQzLjgzMDcsNDMuMDI1IC00NS41MTI3LDQ0Ljk5ODE2IC00NS40NjI3LDUzLjMzMjkxIDAuMDI0LDQuMDU1ODggMi44NzAyLDExLjA5MDI3IDUuNjY5OSwxNC4wMTQ1NiA0Ljg5NDMsNS4xMTIwNyAxNi4wNDU3LDYuODU0NDIgMjIuNjA3OCwzLjUzMjMzIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjAuNTE5NjIzODgiCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiIC8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K\");\n    background-position: center center;\n    background-repeat: no-repeat;\n    background-size: 11px 11px;\n    top: 4px;\n    right: 6px;\n    margin-right: 13px;\n    opacity: 0.4;\n\n    &:hover {\n      opacity: 1;\n    }\n  }\n}\n";

const IFrameViewMixin = function (superclass) {
  const IFrameView = class extends FixedGLViewMixin(superclass) {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle$2
      });
      options.fixedTagType = 'iframe';
      super(options);
      this._src = options.src;
      this.frameLoaded = !this._src; // We are loaded if no src is initially provided
    }
    get src () {
      return this._src;
    }
    set src (src) {
      this.frameLoaded = !src;
      this._src = src;
      this.d3el.select('iframe')
        .attr('src', this._src);
      this.render();
    }
    get isLoading () {
      return super.isLoading || !this.frameLoaded;
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
        .classed('IFrameTab', true)
        .append('div')
        .classed('linkIcon', true)
        .attr('title', 'Open in new tab')
        .on('click', () => {
          window.open(this.src, '_blank');
        });
    }
  };
  IFrameView.prototype._instanceOfIFrameViewMixin = true;
  return IFrameView;
};
Object.defineProperty(IFrameViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfIFrameViewMixin
});



var goldenlayout = /*#__PURE__*/Object.freeze({
  __proto__: null,
  GLRootView: GLRootView,
  GLView: GLView,
  FixedGLViewMixin: FixedGLViewMixin,
  SvgViewMixin: SvgViewMixin,
  IFrameViewMixin: IFrameViewMixin
});

/* globals gapi */

class AuthSheetModel extends Model {
  constructor (options = {}) {
    if (!window.gapi) {
      options.resources = options.resources || [];
      options.resources.push({ type: 'js', url: 'https://apis.google.com/js/api.js' });
    }
    super(options);

    this.spreadsheetId = options.spreadsheetId;
    this.mode = options.mode || AuthSheetModel.MODE.AUTH_READ_ONLY;
    if (!AuthSheetModel.MODE[this.mode]) {
      throw new Error(`Mode ${this.mode} not supported yet`);
    }
    this.sheet = options.sheet || 'Sheet1';

    this._cache = null;
    this._status = AuthSheetModel.STATUS.PENDING;
  }
  async _initWorkaroundPromise (apiKey, clientId) {
    // Really annoying google bug: https://github.com/google/google-api-javascript-client/issues/399
    // means that we have to wait 10ms before actually trying to call init() or it fails silently
    // :rage_emoji: ... can I please have the last week of my life back?
    if (!AuthSheetModel._initPromise) {
      AuthSheetModel._initPromise = new Promise((resolve, reject) => {
        window.setTimeout(() => {
          gapi.client.init({
            apiKey: apiKey,
            clientId: clientId,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            scope: this.mode === AuthSheetModel.MODE.AUTH_READ_ONLY
              ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
              : 'https://www.googleapis.com/auth/spreadsheets'
          }).then(resolve, reject);
        }, 10);
      });
    }
    return AuthSheetModel._initPromise;
  }
  async setupAuth (apiKey, clientId) {
    await this.ready;

    if (this.mode === AuthSheetModel.MODE.AUTH_READ_ONLY ||
        this.mode === AuthSheetModel.MODE.AUTH_READ_WRITE) {
      gapi.load('client:auth2', async () => {
        try {
          await this._initWorkaroundPromise(apiKey, clientId);
        } catch (error) {
          this.status = AuthSheetModel.STATUS.ERROR;
          throw error;
        }

        const auth = gapi.auth2.getAuthInstance().isSignedIn;

        // Listen for status changes
        auth.listen(signedIn => {
          this.status = signedIn
            ? AuthSheetModel.STATUS.SIGNED_IN : AuthSheetModel.STATUS.SIGNED_OUT;
        });

        // Figure out our initial status
        this.status = auth.get()
          ? AuthSheetModel.STATUS.SIGNED_IN : AuthSheetModel.STATUS.SIGNED_OUT;
      });
    } else {
      this.status = AuthSheetModel.STATUS.NO_AUTH;
    }
  }
  get status () {
    return this._status;
  }
  set status (status) {
    this._status = status;
    if (this._status === AuthSheetModel.STATUS.SIGNED_IN) {
      this.updateCache();
    } else {
      this._cache = null;
      this.trigger('dataUpdated');
    }
    this.trigger('statusChanged', status);
  }
  getHeaders () {
    const rawTable = this.getRawTable();
    return rawTable.length > 0 ? rawTable[0] : [];
  }
  getValues () {
    if (!this._valueCache) {
      const headers = this.getHeaders();
      this._valueCache = this.getRawTable().slice(1).map(row => {
        const obj = {};
        for (let i = 0; i < headers.length || i < row.length; i++) {
          let header = headers[i] || 'Blank Header';
          if (obj[header] !== undefined) {
            let extraHeader = 1;
            while (obj[header + extraHeader] !== undefined) { extraHeader += 1; }
            header = header + extraHeader;
          }
          obj[header] = row[i] || '';
        }
        return obj;
      });
    }
    return this._valueCache;
  }
  getRawTable () {
    return (this._cache && this._cache.values) || [];
  }
  async addRows (rows) {
    const headers = this.getHeaders();
    const initialHeaderLength = headers.length;
    await this.addRawRows(rows.map(row => {
      const list = [];
      const temp = Object.assign({}, row);
      for (const header of headers) {
        list.push(temp[header]);
        delete temp[header];
      }
      for (const [header, value] of Object.entries(temp)) {
        headers.push(header);
        list.push(value);
      }
      return list;
    }), true);
    if (initialHeaderLength < headers.length) {
      try {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: this.sheet + '!1:1',
          valueInputOption: 'RAW'
        }, {
          majorDimension: 'ROWS',
          values: [ headers ]
        });
      } catch (err) {
        this.status = AuthSheetModel.STATUS.ERROR;
        throw err;
      }
    }
    await this.updateCache();
  }
  async removeRows (startIndex, endIndex) {
    try {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex,
                  endIndex
                }
              }
            }
          ]
        }
      });
    } catch (err) {
      this.status = AuthSheetModel.STATUS.ERROR;
      throw err;
    }
    await this.updateCache();
  }
  async removeColumn (colName) {
    const headers = this.getHeaders();
    const index = headers.indexOf(colName);
    if (index === -1) {
      throw new Error(`Can't remove non-existent column ${colName}`);
    }
    try {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: index,
                endIndex: index + 1
              }
            }
          }]
        }
      });
    } catch (err) {
      this.status = AuthSheetModel.STATUS.ERROR;
      throw err;
    }
    await this.updateCache();
  }
  async addRawRows (rows, skipCacheUpdate = false) {
    try {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.sheet,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS'
      }, {
        majorDimension: 'ROWS',
        values: rows
      });
    } catch (err) {
      this.status = AuthSheetModel.STATUS.ERROR;
      throw err;
    }
    if (!skipCacheUpdate) {
      await this.updateCache();
    }
  }
  async updateCache () {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.sheet
      });
      this._cache = response.result;
      delete this._valueCache;
      this.trigger('dataUpdated');
    } catch (err) {
      this.status = AuthSheetModel.STATUS.ERROR;
      throw err;
    }
  }
  signIn () {
    if (!this.mode.startsWith('AUTH')) {
      throw new Error(`Can't sign in to model with mode ${this.mode}`);
    }
    gapi.auth2.getAuthInstance().signIn();
  }
  signOut () {
    if (!this.mode.startsWith('AUTH')) {
      throw new Error(`Can't sign out of model with mode ${this.mode}`);
    }
    gapi.auth2.getAuthInstance().signOut();
  }
}

AuthSheetModel.STATUS = {
  'SIGNED_IN': 'SIGNED_IN',
  'SIGNED_OUT': 'SIGNED_OUT',
  'ERROR': 'ERROR',
  'PENDING': 'PENDING',
  'NO_AUTH': 'NO_AUTH'
};

AuthSheetModel.MODE = {
  // 'FORM_CURATED_WRITE': 'FORM_CURATED_WRITE',
  // 'FORM_DANGEROUS_READ_WRITE': 'FORM_DANGEROUS_READ_WRITE',
  'AUTH_READ_ONLY': 'AUTH_READ_ONLY',
  'AUTH_READ_WRITE': 'AUTH_READ_WRITE'
};



var google = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AuthSheetModel: AuthSheetModel
});

var lessStyle$3 = ".LoadingViewMixinSpinner {\n  position: absolute;\n  background: center / 3em no-repeat url(\"data:image/gif;base64,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\"), rgba(255,255,255,0.75);\n}\n";

/* globals d3 */

const LoadingViewMixin = function (superclass) {
  const LoadingView = class extends superclass {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle$3
      });
      super(options);
      this._loaded = false;
      this.on('load', () => {
        this._loaded = true;
        this.render();
      });
    }
    get isLoading () {
      return !this._loaded;
    }
    setup () {
      super.setup();
      // Place a layer on top of this.d3el
      const parent = d3.select(this.d3el.node().parentNode);
      this.spinner = parent.append('div')
        .classed('LoadingViewMixinSpinner', true)
        .style('display', 'none');
    }
    draw () {
      super.draw();
      // Match the position / size of this.d3el
      const bounds = this.getBounds();
      const parentBounds = this.getBounds(d3.select(this.d3el.node().parentNode));
      this.spinner
        .style('top', bounds.top - parentBounds.top)
        .style('left', bounds.left - parentBounds.left)
        .style('right', bounds.right - parentBounds.right)
        .style('bottom', bounds.bottom - parentBounds.bottom)
        .style('display', this.isLoading ? null : 'none');
    }
  };
  LoadingView.prototype._instanceOfLoadingViewMixin = true;
  return LoadingView;
};
Object.defineProperty(LoadingViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfLoadingViewMixin
});

var lessStyle$4 = "@contentPadding: 0.25em;\n\n.EmptyStateViewWrapper {\n  position: absolute;\n  pointer-events: none;\n  .EmptyStateViewContent {\n    position: absolute;\n    top: 50%;\n    transform: translateY(-50%);\n    left: @contentPadding;\n    right: @contentPadding;\n    text-align: center;\n  }\n}\n";

/* globals d3 */

const EmptyStateViewMixin = function (superclass) {
  const EmptyStateView = class extends superclass {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle$4
      });
      super(options);
    }
    getEmptyMessage () {
      // Should be overridden by subclasses; return an html string (or falsey to
      // hide the empty state layer)
      return '';
    }
    setup () {
      super.setup();
      // Insert a layer underneath this.d3el
      const node = this.d3el.node();
      const parentNode = node.parentNode;
      const wrapperNode = document.createElement('div');
      parentNode.insertBefore(wrapperNode, node);
      this.emptyStateWrapper = d3.select(wrapperNode)
        .classed('EmptyStateViewWrapper', true)
        .style('display', 'none');
      this.emptyStateContent = this.emptyStateWrapper.append('div')
        .classed('EmptyStateContent', true);
    }
    draw () {
      super.draw();
      const message = this.getEmptyMessage();
      // Match the position / size of this.d3el
      const bounds = this.getBounds();
      const parentBounds = this.getBounds(d3.select(this.d3el.node().parentNode));
      this.emptyStateContent.html(message);
      this.emptyStateWrapper
        .style('top', bounds.top - parentBounds.top)
        .style('left', bounds.left - parentBounds.left)
        .style('right', bounds.right - parentBounds.right)
        .style('bottom', bounds.bottom - parentBounds.bottom)
        .style('display', message ? null : 'none');
    }
  };
  EmptyStateView.prototype._instanceOfEmptyStateViewMixin = true;
  return EmptyStateView;
};
Object.defineProperty(EmptyStateViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfEmptyStateViewMixin
});



var ui = /*#__PURE__*/Object.freeze({
  __proto__: null,
  LoadingViewMixin: LoadingViewMixin,
  EmptyStateViewMixin: EmptyStateViewMixin
});

export { Model, View, goldenlayout, google, ui, utils as util };