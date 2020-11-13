/* globals d3, less */
import * as utils from './utils/utils.js';

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
            this.trigger('load');
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
          for (const rule of parent.cssRules) {
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
        const cssPromise = url ? less.render(`@import '${url}';`) : less.render(raw, lessArgs);
        Model.LESS_PROMISES[url || raw] = cssPromise.then(result => {
          // TODO: there isn't a way to get variable declarations out of
          // less.render... but ideally we'd want to add a
          // prelimResults = { lessVariables: {} }
          // argument here
          return this._loadCSS(undefined, result.css, extraAttrs, unshift);
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
        if (!globalThis.less || !globalThis.less.render) {
          if (!globalThis.less) {
            // Initial settings
            globalThis.less = { logLevel: 0 };
            globalThis._ukiLessPromise = this._loadJS(globalThis.uki.dynamicDependencies.less);
          }
          await globalThis._ukiLessPromise;
        }
      }

      async loadLateResource (spec, override = false) {
        await this.ready;
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
        if (spec.name) {
          this._resourceLookup[spec.name] = this.resources.length;
        }
        this.resources.push(await this._getCoreResourcePromise(spec));
        this._resourcesLoaded = true;
        this.trigger('load');
      }

      async updateResource (spec, allowLate = false) {
        await this.ready;
        this._resourcesLoaded = false;
        const index = this._resourceLookup[spec.name];
        if (index === undefined) {
          if (allowLate) {
            return this.loadLateResource(spec);
          } else {
            throw new Error(`Can't update unknown resource: ${spec.name}, use allowLate = true to create anyway`);
          }
        }
        if (spec.type === 'less') {
          await this.ensureLessIsLoaded();
        }
        this.resources[index] = await this._getCoreResourcePromise(spec);
        this._resourcesLoaded = true;
        this.trigger('load');
      }

      async _loadResources (specs = []) {
        // uki itself needs d3.js; make sure it exists
        if (!globalThis.d3) {
          await this._loadJS(globalThis.uki.dynamicDependencies.d3);
        }

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
              for (const [index, eventParams] of Object.entries(this._pendingEvents[event])) {
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
            for (const [index, eventParams] of Object.entries(this._pendingEvents[event])) {
              if (eventParams.namespace === namespace) {
                delete this._pendingEvents[event][index];
              }
            }
          }
        }
      }

      async trigger (event, ...args) {
        const handleCallback = (callback, namespace = '') => {
          const index = this._pendingEvents[event].length;
          this._pendingEvents[event].push({ thisObj: this, callback, args, namespace });
          // Make a local pointer, because this could get swapped out by takeOverEvents()
          const pendingEventList = this._pendingEvents[event];
          return new Promise((resolve, reject) => {
            globalThis.setTimeout(() => { // Timeout to prevent blocking
              if (!pendingEventList[index]) {
                reject(new Error(`Listener for event ${event} was removed before pending callback could be executed`));
              } else {
                const eventParams = pendingEventList[index];
                delete pendingEventList[index];
                resolve(callback.apply(eventParams.thisObj, eventParams.callback, eventParams.args));
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
        return Promise.all(promises);
      }

      async stickyTrigger (eventName, argObj, delay = 10) {
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
              resolve(stickyParams.thisObj.trigger(eventName, stickyParams.argObj));
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
            eventParams.thisObj = this;
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
