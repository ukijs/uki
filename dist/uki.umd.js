(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.mure = {})));
}(this, (function (exports) { 'use strict';

  class AbstractClass {
    requireProperties(properties) {
      properties.forEach(m => {
        if (this[m] === undefined) {
          throw new TypeError(m + ' is undefined for class ' + this.constructor.name);
        }
      });
    }
  }

  class Model extends AbstractClass {
    constructor() {
      super();
      this.eventHandlers = {};
      this.stickyTriggers = {};
    }
    on(eventName, callback, allowDuplicateListeners) {
      if (!this.eventHandlers[eventName]) {
        this.eventHandlers[eventName] = [];
      }
      if (!allowDuplicateListeners) {
        if (this.eventHandlers[eventName].indexOf(callback) !== -1) {
          return;
        }
      }
      this.eventHandlers[eventName].push(callback);
    }
    off(eventName, callback) {
      if (this.eventHandlers[eventName]) {
        if (!callback) {
          delete this.eventHandlers[eventName];
        } else {
          let index = this.eventHandlers[eventName].indexOf(callback);
          if (index >= 0) {
            this.eventHandlers[eventName].splice(index, 1);
          }
        }
      }
    }
    trigger(eventName, ...args) {
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName].forEach(callback => {
          window.setTimeout(() => {
            // Add timeout to prevent blocking
            callback.apply(this, args);
          }, 0);
        });
      }
    }
    stickyTrigger(eventName, argObj, delay = 10) {
      this.stickyTriggers[eventName] = this.stickyTriggers[eventName] || { argObj: {} };
      this.stickyTriggers[eventName].argObj = Object.assign(this.stickyTriggers.argObj, argObj);
      window.clearTimeout(this.stickyTriggers.timeout);
      this.stickyTriggers.timeout = window.setTimeout(() => {
        let argObj = this.stickyTriggers[eventName].argObj;
        delete this.stickyTriggers[eventName];
        this.trigger(eventName, argObj);
      }, delay);
    }
  }

  /* globals d3 */

  class View extends Model {
    constructor(d3el, resources = {}) {
      super();
      this.requireProperties(['setup', 'draw']);
      this.d3el = d3el;
      this.dirty = true;
      this.drawTimeout = null;
      this.debounceWait = 100;
      this.readyToRender = false;
      this.loadResources(resources);
    }
    loadStylesheet(path) {
      let style = document.createElement('link');
      style.rel = 'stylesheet';
      style.type = 'text/css';
      style.media = 'screen';
      style.href = path;
      document.getElementsByTagName('head')[0].appendChild(style);
      return style;
    }
    async loadResources(paths) {
      this.resources = {};
      if (paths.style) {
        // Load stylesheets immediately
        this.resources.style = this.loadStylesheet(paths.style);
        delete paths.style;
      }
      // load all d3-fetchable resources in parallel
      try {
        await Promise.all(Object.keys(paths).reduce((agg, key) => {
          if (d3[key]) {
            agg.push((async () => {
              this.resources[key] = await d3[key](paths[key]);
            })());
          } else {
            throw new Error('d3 has no function for fetching resource of type ' + key);
          }
          return agg;
        }, []));
        this.readyToRender = true;
        this.render();
      } catch (err) {
        throw err;
      }
    }
    render(d3el = this.d3el) {
      let needsFreshRender = this.dirty || d3el.node() !== this.d3el.node();
      this.d3el = d3el;
      if (!this.readyToRender) {
        // Don't execute any render calls until the promise in the constructor
        // has been resolved
        return;
      }
      if (needsFreshRender) {
        // Call setup immediately
        this.updateContainerCharacteristics(d3el);
        this.setup(d3el);
        this.dirty = false;
      }
      // Debounce the actual draw call
      clearTimeout(this.drawTimeout);
      this.drawTimeout = setTimeout(() => {
        this.drawTimeout = null;
        this.draw(d3el);
      }, this.debounceWait);
    }
    updateContainerCharacteristics(d3el) {
      if (d3el !== null) {
        this.bounds = d3el.node().getBoundingClientRect();
        this.emSize = parseFloat(d3el.style('font-size'));
        this.scrollBarSize = this.computeScrollBarSize(d3el);
      }
    }
    computeScrollBarSize(d3el) {
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

  exports.AbstractClass = AbstractClass;
  exports.Model = Model;
  exports.View = View;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWtpLnVtZC5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMiLCIuLi9zcmMvTW9kZWwvaW5kZXguanMiLCIuLi9zcmMvVmlldy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBBYnN0cmFjdENsYXNzIHtcbiAgcmVxdWlyZVByb3BlcnRpZXMgKHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2gobSA9PiB7XG4gICAgICBpZiAodGhpc1ttXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IobSArICcgaXMgdW5kZWZpbmVkIGZvciBjbGFzcyAnICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuZXhwb3J0IGRlZmF1bHQgQWJzdHJhY3RDbGFzcztcbiIsImltcG9ydCBBYnN0cmFjdENsYXNzIGZyb20gJy4uL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMnO1xuXG5jbGFzcyBNb2RlbCBleHRlbmRzIEFic3RyYWN0Q2xhc3Mge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLnN0aWNreVRyaWdnZXJzID0ge307XG4gIH1cbiAgb24gKGV2ZW50TmFtZSwgY2FsbGJhY2ssIGFsbG93RHVwbGljYXRlTGlzdGVuZXJzKSB7XG4gICAgaWYgKCF0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICB9XG4gICAgaWYgKCFhbGxvd0R1cGxpY2F0ZUxpc3RlbmVycykge1xuICAgICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLmluZGV4T2YoY2FsbGJhY2spICE9PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG4gIG9mZiAoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICBkZWxldGUgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRyaWdnZXIgKGV2ZW50TmFtZSwgLi4uYXJncykge1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0uZm9yRWFjaChjYWxsYmFjayA9PiB7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHsgLy8gQWRkIHRpbWVvdXQgdG8gcHJldmVudCBibG9ja2luZ1xuICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBzdGlja3lUcmlnZ2VyIChldmVudE5hbWUsIGFyZ09iaiwgZGVsYXkgPSAxMCkge1xuICAgIHRoaXMuc3RpY2t5VHJpZ2dlcnNbZXZlbnROYW1lXSA9IHRoaXMuc3RpY2t5VHJpZ2dlcnNbZXZlbnROYW1lXSB8fCB7IGFyZ09iajoge30gfTtcbiAgICB0aGlzLnN0aWNreVRyaWdnZXJzW2V2ZW50TmFtZV0uYXJnT2JqID0gT2JqZWN0LmFzc2lnbih0aGlzLnN0aWNreVRyaWdnZXJzLmFyZ09iaiwgYXJnT2JqKTtcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuc3RpY2t5VHJpZ2dlcnMudGltZW91dCk7XG4gICAgdGhpcy5zdGlja3lUcmlnZ2Vycy50aW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgbGV0IGFyZ09iaiA9IHRoaXMuc3RpY2t5VHJpZ2dlcnNbZXZlbnROYW1lXS5hcmdPYmo7XG4gICAgICBkZWxldGUgdGhpcy5zdGlja3lUcmlnZ2Vyc1tldmVudE5hbWVdO1xuICAgICAgdGhpcy50cmlnZ2VyKGV2ZW50TmFtZSwgYXJnT2JqKTtcbiAgICB9LCBkZWxheSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW9kZWw7XG4iLCIvKiBnbG9iYWxzIGQzICovXG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vTW9kZWwvaW5kZXguanMnO1xuXG5jbGFzcyBWaWV3IGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvciAoZDNlbCwgcmVzb3VyY2VzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucmVxdWlyZVByb3BlcnRpZXMoWydzZXR1cCcsICdkcmF3J10pO1xuICAgIHRoaXMuZDNlbCA9IGQzZWw7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5kcmF3VGltZW91dCA9IG51bGw7XG4gICAgdGhpcy5kZWJvdW5jZVdhaXQgPSAxMDA7XG4gICAgdGhpcy5yZWFkeVRvUmVuZGVyID0gZmFsc2U7XG4gICAgdGhpcy5sb2FkUmVzb3VyY2VzKHJlc291cmNlcyk7XG4gIH1cbiAgbG9hZFN0eWxlc2hlZXQgKHBhdGgpIHtcbiAgICBsZXQgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgc3R5bGUucmVsID0gJ3N0eWxlc2hlZXQnO1xuICAgIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgIHN0eWxlLm1lZGlhID0gJ3NjcmVlbic7XG4gICAgc3R5bGUuaHJlZiA9IHBhdGg7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgcmV0dXJuIHN0eWxlO1xuICB9XG4gIGFzeW5jIGxvYWRSZXNvdXJjZXMgKHBhdGhzKSB7XG4gICAgdGhpcy5yZXNvdXJjZXMgPSB7fTtcbiAgICBpZiAocGF0aHMuc3R5bGUpIHtcbiAgICAgIC8vIExvYWQgc3R5bGVzaGVldHMgaW1tZWRpYXRlbHlcbiAgICAgIHRoaXMucmVzb3VyY2VzLnN0eWxlID0gdGhpcy5sb2FkU3R5bGVzaGVldChwYXRocy5zdHlsZSk7XG4gICAgICBkZWxldGUgcGF0aHMuc3R5bGU7XG4gICAgfVxuICAgIC8vIGxvYWQgYWxsIGQzLWZldGNoYWJsZSByZXNvdXJjZXMgaW4gcGFyYWxsZWxcbiAgICB0cnkge1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMocGF0aHMpLnJlZHVjZSgoYWdnLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKGQzW2tleV0pIHtcbiAgICAgICAgICBhZ2cucHVzaCgoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZXNba2V5XSA9IGF3YWl0IGQzW2tleV0ocGF0aHNba2V5XSk7XG4gICAgICAgICAgfSkoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdkMyBoYXMgbm8gZnVuY3Rpb24gZm9yIGZldGNoaW5nIHJlc291cmNlIG9mIHR5cGUgJyArIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFnZztcbiAgICAgIH0sIFtdKSk7XG4gICAgICB0aGlzLnJlYWR5VG9SZW5kZXIgPSB0cnVlO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9IGNhdGNoIChlcnIpIHsgdGhyb3cgZXJyOyB9XG4gIH1cbiAgcmVuZGVyIChkM2VsID0gdGhpcy5kM2VsKSB7XG4gICAgbGV0IG5lZWRzRnJlc2hSZW5kZXIgPSB0aGlzLmRpcnR5IHx8IGQzZWwubm9kZSgpICE9PSB0aGlzLmQzZWwubm9kZSgpO1xuICAgIHRoaXMuZDNlbCA9IGQzZWw7XG4gICAgaWYgKCF0aGlzLnJlYWR5VG9SZW5kZXIpIHtcbiAgICAgIC8vIERvbid0IGV4ZWN1dGUgYW55IHJlbmRlciBjYWxscyB1bnRpbCB0aGUgcHJvbWlzZSBpbiB0aGUgY29uc3RydWN0b3JcbiAgICAgIC8vIGhhcyBiZWVuIHJlc29sdmVkXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChuZWVkc0ZyZXNoUmVuZGVyKSB7XG4gICAgICAvLyBDYWxsIHNldHVwIGltbWVkaWF0ZWx5XG4gICAgICB0aGlzLnVwZGF0ZUNvbnRhaW5lckNoYXJhY3RlcmlzdGljcyhkM2VsKTtcbiAgICAgIHRoaXMuc2V0dXAoZDNlbCk7XG4gICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgfVxuICAgIC8vIERlYm91bmNlIHRoZSBhY3R1YWwgZHJhdyBjYWxsXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZHJhd1RpbWVvdXQpO1xuICAgIHRoaXMuZHJhd1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZHJhd1RpbWVvdXQgPSBudWxsO1xuICAgICAgdGhpcy5kcmF3KGQzZWwpO1xuICAgIH0sIHRoaXMuZGVib3VuY2VXYWl0KTtcbiAgfVxuICB1cGRhdGVDb250YWluZXJDaGFyYWN0ZXJpc3RpY3MgKGQzZWwpIHtcbiAgICBpZiAoZDNlbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5ib3VuZHMgPSBkM2VsLm5vZGUoKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHRoaXMuZW1TaXplID0gcGFyc2VGbG9hdChkM2VsLnN0eWxlKCdmb250LXNpemUnKSk7XG4gICAgICB0aGlzLnNjcm9sbEJhclNpemUgPSB0aGlzLmNvbXB1dGVTY3JvbGxCYXJTaXplKGQzZWwpO1xuICAgIH1cbiAgfVxuICBjb21wdXRlU2Nyb2xsQmFyU2l6ZSAoZDNlbCkge1xuICAgIC8vIGJsYXRhbnRseSBhZGFwdGVkIGZyb20gU08gdGhyZWFkOlxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTMzODI1MTYvZ2V0dGluZy1zY3JvbGwtYmFyLXdpZHRoLXVzaW5nLWphdmFzY3JpcHRcbiAgICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBvdXRlci5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgb3V0ZXIuc3R5bGUud2lkdGggPSAnMTAwcHgnO1xuICAgIG91dGVyLnN0eWxlLm1zT3ZlcmZsb3dTdHlsZSA9ICdzY3JvbGxiYXInOyAvLyBuZWVkZWQgZm9yIFdpbkpTIGFwcHNcblxuICAgIGQzZWwubm9kZSgpLmFwcGVuZENoaWxkKG91dGVyKTtcblxuICAgIHZhciB3aWR0aE5vU2Nyb2xsID0gb3V0ZXIub2Zmc2V0V2lkdGg7XG4gICAgLy8gZm9yY2Ugc2Nyb2xsYmFyc1xuICAgIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG5cbiAgICAvLyBhZGQgaW5uZXJkaXZcbiAgICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBpbm5lci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICB2YXIgd2lkdGhXaXRoU2Nyb2xsID0gaW5uZXIub2Zmc2V0V2lkdGg7XG5cbiAgICAvLyByZW1vdmUgZGl2c1xuICAgIG91dGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQob3V0ZXIpO1xuXG4gICAgcmV0dXJuIHdpZHRoTm9TY3JvbGwgLSB3aWR0aFdpdGhTY3JvbGw7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVmlldztcbiJdLCJuYW1lcyI6WyJBYnN0cmFjdENsYXNzIiwicmVxdWlyZVByb3BlcnRpZXMiLCJwcm9wZXJ0aWVzIiwiZm9yRWFjaCIsIm0iLCJ1bmRlZmluZWQiLCJUeXBlRXJyb3IiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJNb2RlbCIsImV2ZW50SGFuZGxlcnMiLCJzdGlja3lUcmlnZ2VycyIsIm9uIiwiZXZlbnROYW1lIiwiY2FsbGJhY2siLCJhbGxvd0R1cGxpY2F0ZUxpc3RlbmVycyIsImluZGV4T2YiLCJwdXNoIiwib2ZmIiwiaW5kZXgiLCJzcGxpY2UiLCJ0cmlnZ2VyIiwiYXJncyIsIndpbmRvdyIsInNldFRpbWVvdXQiLCJhcHBseSIsInN0aWNreVRyaWdnZXIiLCJhcmdPYmoiLCJkZWxheSIsIk9iamVjdCIsImFzc2lnbiIsImNsZWFyVGltZW91dCIsInRpbWVvdXQiLCJWaWV3IiwiZDNlbCIsInJlc291cmNlcyIsImRpcnR5IiwiZHJhd1RpbWVvdXQiLCJkZWJvdW5jZVdhaXQiLCJyZWFkeVRvUmVuZGVyIiwibG9hZFJlc291cmNlcyIsImxvYWRTdHlsZXNoZWV0IiwicGF0aCIsInN0eWxlIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwicmVsIiwidHlwZSIsIm1lZGlhIiwiaHJlZiIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiYXBwZW5kQ2hpbGQiLCJwYXRocyIsIlByb21pc2UiLCJhbGwiLCJrZXlzIiwicmVkdWNlIiwiYWdnIiwia2V5IiwiZDMiLCJFcnJvciIsInJlbmRlciIsImVyciIsIm5lZWRzRnJlc2hSZW5kZXIiLCJub2RlIiwidXBkYXRlQ29udGFpbmVyQ2hhcmFjdGVyaXN0aWNzIiwic2V0dXAiLCJkcmF3IiwiYm91bmRzIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiZW1TaXplIiwicGFyc2VGbG9hdCIsInNjcm9sbEJhclNpemUiLCJjb21wdXRlU2Nyb2xsQmFyU2l6ZSIsIm91dGVyIiwidmlzaWJpbGl0eSIsIndpZHRoIiwibXNPdmVyZmxvd1N0eWxlIiwid2lkdGhOb1Njcm9sbCIsIm9mZnNldFdpZHRoIiwib3ZlcmZsb3ciLCJpbm5lciIsIndpZHRoV2l0aFNjcm9sbCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0VBQUEsTUFBTUEs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
