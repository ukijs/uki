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
    if (document.querySelector(`script[src="${url}"]`)) {
      // We've already added this script
      return;
    }
    const script = document.createElement('script');
    script.type = 'application/javascript';
    for (const [key, value] of Object.entries(extraAttrs)) {
      script.setAttribute(key, value);
    }
    const loadPromise = new Promise((resolve, reject) => {
      script.onload = () => { resolve(script); };
    });
    if (url) {
      script.src = url;
    } else if (raw) {
      script.innerText = raw;
    } else {
      throw new Error('Either a url or raw argument is required for JS resources');
    }
    document.getElementsByTagName('head')[0].appendChild(script);
    return loadPromise;
  }
  _loadCSS (url, raw, extraAttrs = {}) {
    if (url) {
      if (document.querySelector(`link[href="${url}"]`)) {
        // We've already added this stylesheet
        return;
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
    if (Model.LOADED_LESS[url] || document.querySelector(`link[href="${url}"]`)) {
      // We've already added this stylesheet
      return;
    }
    // TODO: maybe do magic to make LESS variables accessible under this.resources?
    Model.LOADED_LESS[url] = true;
    let result;
    if (url) {
      result = await less.render(`@import '${url}';`);
    } else if (raw) {
      result = await less.render(raw);
    } else {
      throw new Error('Either a url or raw argument is required for LESS resources');
    }
    return this._loadCSS(undefined, result.css, extraAttrs);
  }
  async _loadResources (specs = []) {
    // Get d3.js if needed
    if (!window.d3) {
      await this._loadJS('https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.1/d3.min.js', {
        'data-log-level': '1'
      });
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
Model.LOADED_LESS = {};

export default Model;
