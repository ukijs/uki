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
  async _loadResources (specs = []) {
    // Get d3.js if needed
    if (!window.d3) {
      await this._loadJS('https://d3js.org/d3.v5.min.js');
    }

    // Add and await LESS script if relevant
    const hasLESSresources = specs.find(spec => spec.type === 'less') ||
      document.querySelector(`link[rel="stylesheet/less"]`);
    if (hasLESSresources && !window.less) {
      if (!window.less) {
        await this._loadJS('https://cdnjs.cloudflare.com/ajax/libs/less.js/3.11.1/less.min.js');
      }
    }

    this._resourceLookup = {};
    const resourcePromises = specs.map((spec, i) => {
      if (spec.name) {
        this._resourceLookup[spec.name] = i;
      }
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
    });

    this.resources = await Promise.all(resourcePromises);

    if (hasLESSresources) {
      // Some views / other libraries (e.g. goldenLayout) require LESS styles
      // to already be loaded before they attempt to render; this ensures that
      // LESS styles NOT requested by uki are still loaded
      await less.pageLoadFinished;
    }
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

export default Model;
