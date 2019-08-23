/* globals d3, less */

class Model {
  constructor (resources) {
    this._eventHandlers = {};
    this._stickyTriggers = {};
    this._hasLESSresources = false;
    this.ready = new Promise(async (resolve, reject) => {
      if (resources) {
        await this._loadResources(resources);
      }
      if (this._hasLESSresources) {
        await less.pageLoadFinished;
      }
      this.trigger('load');
      resolve();
    });
  }
  _loadCSS (url) {
    if (Model.LOADED_STYLES[url]) {
      // Don't bother loading redundant style files
      return;
    }
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.media = 'screen';
    style.href = url;
    document.getElementsByTagName('head')[0].appendChild(style);
    Model.LOADED_STYLES[url] = true;
    return style;
  }
  async _loadLESS (url) {
    if (Model.LOADED_STYLES[url]) {
      // Don't bother loading redundant style files
      return;
    }
    if (!less) {
      // We assume that less is globally available (like d3)
      console.warn(`LESS is not in the global scope; omitting ${url}`);
      return;
    }
    this._hasLESSresources = true;
    // TODO: maybe do magic to make LESS variables accessible under this.resources?
    const result = await less.render(`@import '${url}';`);
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = result.css;
    document.getElementsByTagName('head')[0].appendChild(style);
    Model.LOADED_STYLES[url] = true;
    return style;
  }
  async _loadResources (paths = []) {
    const resourcePromises = [];
    for (const spec of paths) {
      if (spec.type === 'css') {
        // Load pure css directly
        resourcePromises.push(this._loadCSS(spec.url));
      } else if (spec.type === 'less') {
        // We assume less is available globally
        resourcePromises.push(await this._loadLESS(spec.url));
      } else if (d3[spec.type]) {
        resourcePromises.push(d3[spec.type](spec.url));
      } else {
        throw new Error(`Can't load resource ${spec.url} of type ${spec.type}`);
      }
    }
    this.resources = await Promise.all(resourcePromises);
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
Model.LOADED_STYLES = {};

export default Model;
