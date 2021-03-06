import * as utils from './utils/utils.js';

// These are meant to imitate d3-fetch's code, because we want to mimic its API,
// but it swallows + hides server error message details that we want to forward
const D3_PARSERS = {
  text: (text, response, spec) => text,
  json: (text, response, spec) => response.status === 204 || response.status === 205
    ? undefined
    : JSON.parse(text),
  xml: (text, response, spec) => new globalThis.DOMParser().parseFromString(text, 'application/xml'),
  html: (text, response, spec) => new globalThis.DOMParser().parseFromString(text, 'text/html'),
  svg: (text, response, spec) => new globalThis.DOMParser().parseFromString(text, 'image/svg+xml'),
  dsv: (text, response, spec) => globalThis.d3.dsvFormat(spec.delimiter).parse(text, spec.row),
  csv: (text, response, spec) => globalThis.d3.csvParse(text, spec.row),
  tsv: (text, response, spec) => globalThis.d3.tsvParse(text, spec.row)
};

const { Model, ModelMixin } = utils.createMixinAndDefault({
  DefaultSuperClass: Object,
  classDefFunc: SuperClass => {
    class Model extends SuperClass {
      constructor (options = {}) {
        super(...arguments);
        this._eventHandlers = {};
        this._pendingEvents = {};
        this._stickyTriggers = {};
        this._resourceSpecs = options.resources || [];
        this._resourceLookup = {};
        this._resourcesLoaded = false;
        this.ready = this._loadResources(this._resourceSpecs)
          .then(() => {
            this._resourcesLoaded = true;
            this.trigger('resourcesLoaded');
          });
      }

      get isLoading () {
        return !this._resourcesLoaded;
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

      _loadCSS (url, raw, extraAttrs = {}, unshift = false, prelimResults = {}) {
        if (url !== undefined) {
          let linkTag = document.querySelector(`link[href="${url}"]`);
          if (linkTag) {
            // We've already added this stylesheet
            Object.assign(prelimResults, { linkTag, cssVariables: this.extractCSSVariables(linkTag) });
            return Promise.resolve(prelimResults);
          }
          linkTag = document.createElement('link');
          linkTag.rel = 'stylesheet';
          linkTag.type = 'text/css';
          linkTag.media = 'screen';
          for (const [key, value] of Object.keys(extraAttrs)) {
            linkTag.setAttribute(key, value);
          }
          const loadPromise = new Promise((resolve, reject) => {
            linkTag.onload = () => {
              Object.assign(prelimResults, { linkTag, cssVariables: this.extractCSSVariables(linkTag) });
              resolve(prelimResults);
            };
          });
          linkTag.href = url;
          document.getElementsByTagName('head')[0].appendChild(linkTag);
          return loadPromise;
        } else if (raw !== undefined) {
          if (Model.RAW_CSS_PROMISES[raw]) {
            return Model.RAW_CSS_PROMISES[raw];
          }
          const styleTag = document.createElement('style');
          styleTag.type = 'text/css';
          for (const [key, value] of Object.keys(extraAttrs)) {
            styleTag.setAttribute(key, value);
          }
          if (styleTag.styleSheet) {
            styleTag.styleSheet.cssText = raw;
          } else {
            styleTag.innerHTML = raw;
          }
          const head = document.getElementsByTagName('head')[0];
          if (unshift) {
            head.prepend(styleTag);
          } else {
            head.appendChild(styleTag);
          }
          Object.assign(prelimResults, { styleTag, cssVariables: this.extractCSSVariables(styleTag) });
          Model.RAW_CSS_PROMISES[raw] = prelimResults;
          return Model.RAW_CSS_PROMISES[raw];
        } else {
          throw new Error('Either a url or raw argument is required for CSS resources');
        }
      }

      extractCSSVariables (tag) {
        const result = {};

        const computedStyles = globalThis.getComputedStyle(document.documentElement);

        const extractRules = parent => {
          let rules;
          try {
            rules = parent?.cssRules || parent?.rules || [];
          } catch (e) {
            // If loading a stylesheet from a different domain (e.g. uki-ui hits
            // this with goldenlayout stylesheets), CORS will throw an error if
            // we attempt to access parent.cssRules directly
            return;
          }
          for (const rule of rules) {
            if (rule.selectorText === ':root') {
              for (const variableName of rule.style) {
                result[variableName] = computedStyles.getPropertyValue(variableName).trim();
              }
            } else if (rule.cssRules) {
              extractRules(rule);
            }
          }
        };

        extractRules(tag.sheet);
        return result;
      }

      async _loadLESS (url, raw, extraAttrs = {}, lessArgs = {}, unshift = false) {
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
        const cssPromise = url ? globalThis.less.render(`@import '${url}';`) : globalThis.less.render(raw, lessArgs);
        Model.LESS_PROMISES[url || raw] = cssPromise.then(result => {
          // TODO: there isn't a way to get variable declarations out of
          // less.render... but ideally we'd want to add a
          // prelimResults = { lessVariables: {} }
          // argument here
          return this._loadCSS(undefined, result.css, extraAttrs, unshift);
        });
        return Model.LESS_PROMISES[url || raw];
      }

      async _getCoreResourcePromise (spec, dependencyResultList) {
        let p;
        if (typeof spec.skipWhen === 'function' && spec.skipWhen(...dependencyResultList)) {
          // A resource that is only conditionally fetched / calculated; if the
          // resource is skipped, apply defaultValue (null unless specified)
          return Promise.resolve(spec.defaultValue !== undefined ? spec.defaultValue : null);
        }

        if (spec instanceof Promise) {
          // An arbitrary promise
          return spec;
        } else if (spec.type === 'placeholder') {
          // A placeholder resource that reserves the name, and may or may not
          // affect this.ready from resolving (using preventReady). Usually this
          // will be updated later, e.g. if a view needs to know how big its
          // d3el is before requesting a certain resolution of data from an API
          if (spec.preventReady) {
            return new Promise((resolve, reject) => {});
          } else {
            return Promise.resolve(spec.value !== undefined ? spec.value : null);
          }
        } else if (spec.type === 'derivation') {
          // Allow async local computation of resources (e.g. in a web worker)
          // that can still take advantage of loadAfter + then, and will prevent
          // this.ready from resolving before the computation is finished
          p = new Promise((resolve, reject) => {
            try {
              resolve(spec.derive(...dependencyResultList));
            } catch (e) {
              reject(e);
            }
          });
        } else if (spec.type === 'css') {
          // Load pure css directly
          p = this._loadCSS(spec.url, spec.raw, spec.extraAttributes || {}, spec.unshift);
        } else if (spec.type === 'less') {
          // Convert LESS to CSS
          p = this._loadLESS(spec.url, spec.raw, spec.extraAttributes || {}, spec.lessArgs || {}, spec.unshift);
        } else if (spec.type === 'fetch') {
          // Raw fetch request
          p = globalThis.fetch(spec.url, spec.init || {});
        } else if (spec.type === 'js') {
          // Load a legacy JS script (i.e. something that can't be ES6-imported)
          p = this._loadJS(spec.url, spec.raw, spec.extraAttributes || {});
        } else if (D3_PARSERS[spec.type]) {
          // One of D3's native types... but we do the fetch manually because d3
          // doesn't have a way for us to access and forward informative error
          // messages (VERY important for things like uki-ui's InformativeView)
          p = globalThis.fetch(spec.url, spec.init || {})
            // Combine attempts to get response body text with the response
            // itself for unified error capturing
            .then(response => Promise.all([response, response.text()]))
            .then(([response, text]) => {
              if (!response.ok) {
                const httpError = new Error(response.status + ' ' + response.statusText);
                httpError.status = response.status;
                httpError.statusText = response.statusText;
                try {
                  // Attempt to attach any JSON the server sent back...
                  httpError.body = JSON.parse(text);
                } catch (error) {
                  // ... if it's not JSON, still include the plain text if
                  // that's what the server is sending back
                  httpError.body = text;
                }
                throw httpError;
              } else {
                // The response was fine, use d3's strategy / functions to deal
                // with the response body
                return D3_PARSERS[spec.type](text, response, spec);
              }
            });
        } else {
          throw new Error(`Can't load resource ${spec.name || ''} of type ${spec.type}`);
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
        if (!globalThis.less || !globalThis.less.render) {
          if (!globalThis.less) {
            // Initial settings
            globalThis.less = { logLevel: 0 };
            globalThis._ukiLessPromise = this._loadJS(globalThis.uki.dynamicDependencies.less);
          }
          await globalThis._ukiLessPromise;
        }
      }

      async loadLateResource (spec, override = true) {
        this.ready = this.ready.then(async () => {
          this._resourcesLoaded = false;
          if (this._resourceLookup[spec.name] !== undefined) {
            if (override) {
              return this.updateResource(spec);
            } else {
              throw new Error(`Resource ${spec.name} already exists, use override = true to overwrite`);
            }
          }
          if (spec.type === 'less') {
            await this.ensureLessIsLoaded();
          }
          const dependencyResultList = (spec.loadAfter || []).map(otherResourceName => {
            return this.getNamedResource(otherResourceName);
          });
          const resourceIndex = this.resources.length;
          try {
            this.resources[resourceIndex] = await this._getCoreResourcePromise(spec, dependencyResultList);
          } catch (error) {
            this.resources[resourceIndex] = error;
          }

          if (spec.name) {
            this._resourceLookup[spec.name] = resourceIndex;
          }
          this._resourcesLoaded = true;
          this.trigger('resourceLoaded', this.resources[resourceIndex]);
        });
        return this.ready;
      }

      async updateResource (spec, allowLate = true) {
        // TODO: prevent waiting for a series of rapid-fire resource updates; if
        // a queued update has not even started, prevent it and replace it with
        // this attempt. Probably use per-resource clearTimeouts?
        this.ready = this.ready.then(async () => {
          this._resourcesLoaded = false;
          const index = this._resourceLookup[spec.name];
          if (index === undefined) {
            if (allowLate) {
              return this.loadLateResource(spec);
            } else {
              throw new Error(`Can't update unknown resource: ${spec.name}, use allowLate = true to create anyway`);
            }
          }
          this.trigger('resourceUnloaded', this.resources[index]);
          this.resources[index] = null;
          if (spec.type === 'less') {
            await this.ensureLessIsLoaded();
          }
          const dependencyResultList = (spec.loadAfter || []).map(otherResourceName => {
            return this.getNamedResource(otherResourceName);
          });
          try {
            this.resources[index] = await this._getCoreResourcePromise(spec, dependencyResultList);
          } catch (error) {
            this.resources[index] = error;
          }

          this._resourcesLoaded = true;
          this.trigger('resourceLoaded', this.resources[index]);
        });
        return this.ready;
      }

      async _loadResources (specs = []) {
        // Don't need to do anything else; this makes some code cleaner below
        if (specs.length === 0) {
          return;
        }

        // First, construct a lookup of named dependencies
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
        // uki itself needs d3.js; make sure it exists
        if (!globalThis.d3) {
          await this._loadJS(globalThis.uki.dynamicDependencies.d3);
        }
        // Add and await LESS script if needed
        if (hasLESSresources) {
          await this.ensureLessIsLoaded();
        }
        // Now do Kahn's algorithm to topologically sort the graph, starting from
        // the resources with no dependencies
        const roots = Object.keys(specs)
          .filter(index => dependencies[index].length === 0);
        // Ensure that there's at least one root with no dependencies
        if (roots.length === 0) {
          throw new Error('No resource without loadAfter dependencies');
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
          throw new Error('Cyclic loadAfter resource dependency');
        }
        // Load dependencies in topological order
        const resourcePromises = [];
        for (const index of topoSortOrder) {
          const parentPromises = dependencies[index]
            .map(parentIndex => resourcePromises[parentIndex]);
          resourcePromises[index] = Promise.all(parentPromises.map(p => p.catch(error => error)))
            .then(dependencyResultList => this._getCoreResourcePromise(specs[index], dependencyResultList));
        }

        // Wait for everything to load, and collect any errors in the place of
        // the resource contents
        this.resources = await Promise.all(resourcePromises.map(p => p.catch(error => error)));
      }

      getNamedResource (name) {
        return this.resources === undefined || this._resourceLookup[name] === undefined
          ? null
          : this.resources[this._resourceLookup[name]];
      }

      hasNamedResource (name) {
        return this.resources !== undefined && this._resourceLookup[name] !== undefined;
      }

      on (eventName, callback) {
        const [event, namespace] = eventName.split('.');
        this._eventHandlers[event] = this._eventHandlers[event] || { '': [] };
        this._pendingEvents[event] = this._pendingEvents[event] || [];
        if (!namespace) {
          this._eventHandlers[event][''].push(callback);
        } else {
          this._eventHandlers[event][namespace] = callback;
        }
      }

      off (eventName, callback) {
        const [event, namespace] = eventName.split('.');
        if (this._eventHandlers[event]) {
          if (!namespace) {
            if (!callback) {
              // No namespace or specific callback function; remove all handlers
              // and pending events for this event
              this._eventHandlers[event][''] = [];
              delete this._pendingEvents[event];
            } else {
              // Only remove handlers and pending events for a specific callback
              // function
              const index = this._eventHandlers[event][''].indexOf(callback);
              if (index >= 0) {
                this._eventHandlers[event][''].splice(index, 1);
              }
              for (const [index, eventParams] of Object.entries(this._pendingEvents[event] || [])) {
                if (eventParams.callback === callback) {
                  delete this._pendingEvents[event][index];
                }
              }
            }
          } else {
            // Remove all handlers and pending events that use this namespace
            // (when dealing with namespaces, the specific callback function
            // is irrelevant)
            delete this._eventHandlers[event][namespace];
            for (const [index, eventParams] of Object.entries(this._pendingEvents[event] || [])) {
              if (eventParams.namespace === namespace) {
                delete this._pendingEvents[event][index];
              }
            }
          }
        }
      }

      async trigger (event, argList, rejectOnListenerRemoval = false) {
        const handleCallback = (callback, namespace = '') => {
          const eventParams = { thisObj: this, callback, argList, namespace };
          this._pendingEvents[event] = this._pendingEvents[event] || [];

          // Find an open slot in the list; as we rely on index numbers to be
          // consistent, we reuse slots after they clear instead of shortening
          // the array
          let freeIndex = 0;
          while (freeIndex < this._pendingEvents[event].length && this._pendingEvents[event][freeIndex] !== undefined) {
            freeIndex += 1;
          }
          if (freeIndex === this._pendingEvents[event].length) {
            this._pendingEvents[event].push(eventParams);
          } else {
            this._pendingEvents[event][freeIndex] = eventParams;
          }

          // Make a local reference to the list, because "this" could get
          // swapped out by takeOverEvents()
          const pendingEventList = this._pendingEvents[event];
          return new Promise((resolve, reject) => {
            globalThis.setTimeout(() => { // Timeout to prevent blocking
              if (!pendingEventList[freeIndex]) {
                if (rejectOnListenerRemoval) {
                  reject(new Error(`Listener for event ${event} was removed before pending callback could be executed`));
                } else {
                  resolve(null);
                }
              } else {
                const eventParams = pendingEventList[freeIndex];
                delete pendingEventList[freeIndex];
                resolve(eventParams.callback.apply(eventParams.thisObj, eventParams.argList));
              }
            }, 0);
          });
        };
        const promises = [];
        if (this._eventHandlers[event]) {
          for (const namespace of Object.keys(this._eventHandlers[event])) {
            if (namespace === '') {
              promises.push(...this._eventHandlers[event][''].map(handleCallback));
            } else {
              promises.push(handleCallback(this._eventHandlers[event][namespace], namespace));
            }
          }
        }
        return Promise.all(promises.map(p => p.catch(error => error)));
      }

      syncTrigger (event, argList) {
        const handleCallback = (callback, namespace = '') => {
          callback.apply(this, argList);
        };
        if (this._eventHandlers[event]) {
          for (const namespace of Object.keys(this._eventHandlers[event])) {
            if (namespace === '') {
              this._eventHandlers[event][''].forEach(handleCallback);
            } else {
              handleCallback(this._eventHandlers[event][namespace], namespace);
            }
          }
        }
      }

      async stickyTrigger (eventName, argObj, delay = 10, rejectOnListenerRemoval = false) {
        this._stickyTriggers[eventName] = this._stickyTriggers[eventName] || { thisObj: this, argObj: {}, timeout: undefined };
        Object.assign(this._stickyTriggers[eventName].argObj, argObj);
        clearTimeout(this._stickyTriggers[eventName].timeout);
        // Make a local pointer, because this could get swapped out by takeOverEvents()
        const stickyTriggers = this._stickyTriggers;
        return new Promise((resolve, reject) => {
          stickyTriggers[eventName].timeout = setTimeout(() => {
            const stickyParams = stickyTriggers[eventName];
            delete stickyTriggers[eventName];
            try {
              resolve(stickyParams.thisObj.trigger(eventName, [stickyParams.argObj], rejectOnListenerRemoval));
            } catch (error) {
              reject(error);
            }
          }, delay);
        });
      }

      takeOverEvents (otherModel) {
        Object.assign(this._eventHandlers, otherModel._eventHandlers);
        otherModel._eventHandlers = {};

        // For any pending events + sticky events, we ONLY need to take over the
        // thisObj; things will still be appropriately deleted via local pointers

        for (const stickyParams of Object.values(otherModel._stickyTriggers)) {
          stickyParams.thisObj = this;
        }
        otherModel._stickyTriggers = {};

        for (const paramList of Object.values(otherModel._pendingEvents)) {
          for (const eventParams of paramList) {
            if (eventParams !== undefined) {
              eventParams.thisObj = this;
            }
          }
        }
        otherModel._pendingEvents = {};
      }
    }
    Model.LESS_PROMISES = {};
    Model.JS_PROMISES = {};
    Model.RAW_CSS_PROMISES = {};
    return Model;
  }
});

export { Model, ModelMixin };
