/* globals d3, less */

class Model {
  constructor (options = {}) {
    this._eventHandlers = {};
    this._stickyTriggers = {};
    this._resourceSpecs = options.resources || [];
    this.ready = new Promise(async (resolve, reject) => {
      await this._loadResources(this._resourceSpecs);
      this.trigger('load');
      resolve();
    });
  }
  _loadJS (url, raw, extraAttrs = {}) {
    if (Model.JS_PROMISES[url || raw]) {
      // We've already loaded the script
      return Model.JS_PROMISES[url || raw];
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
    if (url !== undefined) {
      script.src = url;
    } else if (raw !== undefined) {
      script.innerText = raw;
    } else {
      throw new Error('Either a url or raw argument is required for JS resources');
    }
    Model.JS_PROMISES[url || raw] = new Promise((resolve, reject) => {
      script.addEventListener('load', () => { resolve(script); });
    });
    document.getElementsByTagName('head')[0].appendChild(script);
    return Model.JS_PROMISES[url];
  }
  _loadCSS (url, raw, extraAttrs = {}) {
    if (url !== undefined) {
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
    } else if (raw !== undefined) {
      if (Model.RAW_CSS[raw]) {
        return;
      }
      const style = document.createElement('style');
      style.type = 'text/css';
      for (const [key, value] of Object.keys(extraAttrs)) {
        style.setAttribute(key, value);
      }
      if (style.styleSheet) {
        style.styleSheet.cssText = raw;
      } else {
        style.innerHTML = raw;
      }
      Model.RAW_CSS[raw] = true;
      document.getElementsByTagName('head')[0].appendChild(style);
      return Promise.resolve(style);
    } else {
      throw new Error('Either a url or raw argument is required for CSS resources');
    }
  }
  async _loadLESS (url, raw, extraAttrs = {}, lessArgs = {}) {
    if (url !== undefined) {
      if (Model.LESS_PROMISES[url]) {
        return Model.LESS_PROMISES[url];
      } else if (document.querySelector(`link[href="${url}"]`)) {
        return Promise.resolve(document.querySelector(`link[href="${url}"]`));
      }
    } else if (raw !== undefined) {
      if (Model.LESS_PROMISES[raw]) {
        return Model.LESS_PROMISES[raw];
      }
    } else {
      throw new Error('Either a url or raw argument is required for LESS resources');
    }
    const cssPromise = url ? less.render(`@import '${url}';`) : less.render(raw, lessArgs);
    Model.LESS_PROMISES[url || raw] = cssPromise.then(result => {
      // TODO: maybe do magic here to make LESS variables accessible under
      // this.resources?
      return this._loadCSS(undefined, result.css, extraAttrs);
    });
    return Model.LESS_PROMISES[url || raw];
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
      p = this._loadLESS(spec.url, spec.raw, spec.extraAttributes || {}, spec.lessArgs || {});
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
  async ensureLessIsLoaded () {
    if (!window.less || !window.less.render) {
      if (!window.less) {
        // Initial settings
        window.less = { logLevel: 0 };
        window._ukiLessPromise = this._loadJS('https://cdnjs.cloudflare.com/ajax/libs/less.js/3.11.1/less.min.js');
      }
      await window._ukiLessPromise;
    }
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
        if (this._resourceLookup[name] === undefined) {
          throw new Error(`Can't loadAfter unknown resource: ${name}`);
        }
        result.push(this._resourceLookup[name]);
      }
      tempDependencies.push(Array.from(result));
      return result;
    });
    // Add and await LESS script if needed
    if (hasLESSresources) {
      await this.ensureLessIsLoaded();
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
Model.RAW_CSS = {};

export default Model;
