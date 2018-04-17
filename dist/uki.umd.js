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
    trigger() {
      let eventName = arguments[0];
      let args = Array.prototype.slice.call(arguments, 1);
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName].forEach(callback => {
          window.setTimeout(() => {
            // Add timeout to prevent blocking
            callback.apply(this, args);
          }, 0);
        });
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWtpLnVtZC5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMiLCIuLi9zcmMvTW9kZWwvaW5kZXguanMiLCIuLi9zcmMvVmlldy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBBYnN0cmFjdENsYXNzIHtcbiAgcmVxdWlyZVByb3BlcnRpZXMgKHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2gobSA9PiB7XG4gICAgICBpZiAodGhpc1ttXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IobSArICcgaXMgdW5kZWZpbmVkIGZvciBjbGFzcyAnICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuZXhwb3J0IGRlZmF1bHQgQWJzdHJhY3RDbGFzcztcbiIsImltcG9ydCBBYnN0cmFjdENsYXNzIGZyb20gJy4uL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMnO1xuXG5jbGFzcyBNb2RlbCBleHRlbmRzIEFic3RyYWN0Q2xhc3Mge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgfVxuICBvbiAoZXZlbnROYW1lLCBjYWxsYmFjaywgYWxsb3dEdXBsaWNhdGVMaXN0ZW5lcnMpIHtcbiAgICBpZiAoIXRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdO1xuICAgIH1cbiAgICBpZiAoIWFsbG93RHVwbGljYXRlTGlzdGVuZXJzKSB7XG4gICAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0uaW5kZXhPZihjYWxsYmFjaykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cbiAgb2ZmIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdHJpZ2dlciAoKSB7XG4gICAgbGV0IGV2ZW50TmFtZSA9IGFyZ3VtZW50c1swXTtcbiAgICBsZXQgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5mb3JFYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4geyAvLyBBZGQgdGltZW91dCB0byBwcmV2ZW50IGJsb2NraW5nXG4gICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vZGVsO1xuIiwiLyogZ2xvYmFscyBkMyAqL1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL01vZGVsL2luZGV4LmpzJztcblxuY2xhc3MgVmlldyBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3IgKGQzZWwsIHJlc291cmNlcyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJlcXVpcmVQcm9wZXJ0aWVzKFsnc2V0dXAnLCAnZHJhdyddKTtcbiAgICB0aGlzLmQzZWwgPSBkM2VsO1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgIHRoaXMuZHJhd1RpbWVvdXQgPSBudWxsO1xuICAgIHRoaXMuZGVib3VuY2VXYWl0ID0gMTAwO1xuICAgIHRoaXMucmVhZHlUb1JlbmRlciA9IGZhbHNlO1xuICAgIHRoaXMubG9hZFJlc291cmNlcyhyZXNvdXJjZXMpO1xuICB9XG4gIGxvYWRTdHlsZXNoZWV0IChwYXRoKSB7XG4gICAgbGV0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgIHN0eWxlLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICBzdHlsZS5tZWRpYSA9ICdzY3JlZW4nO1xuICAgIHN0eWxlLmhyZWYgPSBwYXRoO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgIHJldHVybiBzdHlsZTtcbiAgfVxuICBhc3luYyBsb2FkUmVzb3VyY2VzIChwYXRocykge1xuICAgIHRoaXMucmVzb3VyY2VzID0ge307XG4gICAgaWYgKHBhdGhzLnN0eWxlKSB7XG4gICAgICAvLyBMb2FkIHN0eWxlc2hlZXRzIGltbWVkaWF0ZWx5XG4gICAgICB0aGlzLnJlc291cmNlcy5zdHlsZSA9IHRoaXMubG9hZFN0eWxlc2hlZXQocGF0aHMuc3R5bGUpO1xuICAgICAgZGVsZXRlIHBhdGhzLnN0eWxlO1xuICAgIH1cbiAgICAvLyBsb2FkIGFsbCBkMy1mZXRjaGFibGUgcmVzb3VyY2VzIGluIHBhcmFsbGVsXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5rZXlzKHBhdGhzKS5yZWR1Y2UoKGFnZywga2V5KSA9PiB7XG4gICAgICAgIGlmIChkM1trZXldKSB7XG4gICAgICAgICAgYWdnLnB1c2goKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVzb3VyY2VzW2tleV0gPSBhd2FpdCBkM1trZXldKHBhdGhzW2tleV0pO1xuICAgICAgICAgIH0pKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZDMgaGFzIG5vIGZ1bmN0aW9uIGZvciBmZXRjaGluZyByZXNvdXJjZSBvZiB0eXBlICcgKyBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhZ2c7XG4gICAgICB9LCBbXSkpO1xuICAgICAgdGhpcy5yZWFkeVRvUmVuZGVyID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7IHRocm93IGVycjsgfVxuICB9XG4gIHJlbmRlciAoZDNlbCA9IHRoaXMuZDNlbCkge1xuICAgIGxldCBuZWVkc0ZyZXNoUmVuZGVyID0gdGhpcy5kaXJ0eSB8fCBkM2VsLm5vZGUoKSAhPT0gdGhpcy5kM2VsLm5vZGUoKTtcbiAgICB0aGlzLmQzZWwgPSBkM2VsO1xuICAgIGlmICghdGhpcy5yZWFkeVRvUmVuZGVyKSB7XG4gICAgICAvLyBEb24ndCBleGVjdXRlIGFueSByZW5kZXIgY2FsbHMgdW50aWwgdGhlIHByb21pc2UgaW4gdGhlIGNvbnN0cnVjdG9yXG4gICAgICAvLyBoYXMgYmVlbiByZXNvbHZlZFxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobmVlZHNGcmVzaFJlbmRlcikge1xuICAgICAgLy8gQ2FsbCBzZXR1cCBpbW1lZGlhdGVseVxuICAgICAgdGhpcy51cGRhdGVDb250YWluZXJDaGFyYWN0ZXJpc3RpY3MoZDNlbCk7XG4gICAgICB0aGlzLnNldHVwKGQzZWwpO1xuICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICAvLyBEZWJvdW5jZSB0aGUgYWN0dWFsIGRyYXcgY2FsbFxuICAgIGNsZWFyVGltZW91dCh0aGlzLmRyYXdUaW1lb3V0KTtcbiAgICB0aGlzLmRyYXdUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmRyYXdUaW1lb3V0ID0gbnVsbDtcbiAgICAgIHRoaXMuZHJhdyhkM2VsKTtcbiAgICB9LCB0aGlzLmRlYm91bmNlV2FpdCk7XG4gIH1cbiAgdXBkYXRlQ29udGFpbmVyQ2hhcmFjdGVyaXN0aWNzIChkM2VsKSB7XG4gICAgaWYgKGQzZWwgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuYm91bmRzID0gZDNlbC5ub2RlKCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB0aGlzLmVtU2l6ZSA9IHBhcnNlRmxvYXQoZDNlbC5zdHlsZSgnZm9udC1zaXplJykpO1xuICAgICAgdGhpcy5zY3JvbGxCYXJTaXplID0gdGhpcy5jb21wdXRlU2Nyb2xsQmFyU2l6ZShkM2VsKTtcbiAgICB9XG4gIH1cbiAgY29tcHV0ZVNjcm9sbEJhclNpemUgKGQzZWwpIHtcbiAgICAvLyBibGF0YW50bHkgYWRhcHRlZCBmcm9tIFNPIHRocmVhZDpcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEzMzgyNTE2L2dldHRpbmctc2Nyb2xsLWJhci13aWR0aC11c2luZy1qYXZhc2NyaXB0XG4gICAgdmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgb3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIG91dGVyLnN0eWxlLndpZHRoID0gJzEwMHB4JztcbiAgICBvdXRlci5zdHlsZS5tc092ZXJmbG93U3R5bGUgPSAnc2Nyb2xsYmFyJzsgLy8gbmVlZGVkIGZvciBXaW5KUyBhcHBzXG5cbiAgICBkM2VsLm5vZGUoKS5hcHBlbmRDaGlsZChvdXRlcik7XG5cbiAgICB2YXIgd2lkdGhOb1Njcm9sbCA9IG91dGVyLm9mZnNldFdpZHRoO1xuICAgIC8vIGZvcmNlIHNjcm9sbGJhcnNcbiAgICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuXG4gICAgLy8gYWRkIGlubmVyZGl2XG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaW5uZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgb3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gICAgdmFyIHdpZHRoV2l0aFNjcm9sbCA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG4gICAgLy8gcmVtb3ZlIGRpdnNcbiAgICBvdXRlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG91dGVyKTtcblxuICAgIHJldHVybiB3aWR0aE5vU2Nyb2xsIC0gd2lkdGhXaXRoU2Nyb2xsO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFZpZXc7XG4iXSwibmFtZXMiOlsiQWJzdHJhY3RDbGFzcyIsInJlcXVpcmVQcm9wZXJ0aWVzIiwicHJvcGVydGllcyIsImZvckVhY2giLCJtIiwidW5kZWZpbmVkIiwiVHlwZUVycm9yIiwiY29uc3RydWN0b3IiLCJuYW1lIiwiTW9kZWwiLCJldmVudEhhbmRsZXJzIiwib24iLCJldmVudE5hbWUiLCJjYWxsYmFjayIsImFsbG93RHVwbGljYXRlTGlzdGVuZXJzIiwiaW5kZXhPZiIsInB1c2giLCJvZmYiLCJpbmRleCIsInNwbGljZSIsInRyaWdnZXIiLCJhcmd1bWVudHMiLCJhcmdzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJ3aW5kb3ciLCJzZXRUaW1lb3V0IiwiYXBwbHkiLCJWaWV3IiwiZDNlbCIsInJlc291cmNlcyIsImRpcnR5IiwiZHJhd1RpbWVvdXQiLCJkZWJvdW5jZVdhaXQiLCJyZWFkeVRvUmVuZGVyIiwibG9hZFJlc291cmNlcyIsImxvYWRTdHlsZXNoZWV0IiwicGF0aCIsInN0eWxlIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwicmVsIiwidHlwZSIsIm1lZGlhIiwiaHJlZiIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiYXBwZW5kQ2hpbGQiLCJwYXRocyIsIlByb21pc2UiLCJhbGwiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwiYWdnIiwia2V5IiwiZDMiLCJFcnJvciIsInJlbmRlciIsImVyciIsIm5lZWRzRnJlc2hSZW5kZXIiLCJub2RlIiwidXBkYXRlQ29udGFpbmVyQ2hhcmFjdGVyaXN0aWNzIiwic2V0dXAiLCJjbGVhclRpbWVvdXQiLCJkcmF3IiwiYm91bmRzIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiZW1TaXplIiwicGFyc2VGbG9hdCIsInNjcm9sbEJhclNpemUiLCJjb21wdXRlU2Nyb2xsQmFyU2l6ZSIsIm91dGVyIiwidmlzaWJpbGl0eSIsIndpZHRoIiwibXNPdmVyZmxvd1N0eWxlIiwid2lkdGhOb1Njcm9sbCIsIm9mZnNldFdpZHRoIiwib3ZlcmZsb3ciLCJpbm5lciIsIndpZHRoV2l0aFNjcm9sbCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0VBQUEsTUFBTUEsYUFBTixDQUFvQjtFQUNsQkMsb0JBQW1CQyxVQUFuQixFQUErQjtFQUM3QkEsZUFBV0MsT0FBWCxDQUFtQkMsS0FBSztFQUN0QixVQUFJLEtBQUtBLENBQUwsTUFBWUMsU0FBaEIsRUFBMkI7RUFDekIsY0FBTSxJQUFJQyxTQUFKLENBQWNGLElBQUksMEJBQUosR0FBaUMsS0FBS0csV0FBTCxDQUFpQkMsSUFBaEUsQ0FBTjtFQUNEO0VBQ0YsS0FKRDtFQUtEO0VBUGlCOztFQ0VwQixNQUFNQyxLQUFOLFNBQW9CVCxhQUFwQixDQUFrQztFQUNoQ08sZ0JBQWU7RUFDYjtFQUNBLFNBQUtHLGFBQUwsR0FBcUIsRUFBckI7RUFDRDtFQUNEQyxLQUFJQyxTQUFKLEVBQWVDLFFBQWYsRUFBeUJDLHVCQUF6QixFQUFrRDtFQUNoRCxRQUFJLENBQUMsS0FBS0osYUFBTCxDQUFtQkUsU0FBbkIsQ0FBTCxFQUFvQztFQUNsQyxXQUFLRixhQUFMLENBQW1CRSxTQUFuQixJQUFnQyxFQUFoQztFQUNEO0VBQ0QsUUFBSSxDQUFDRSx1QkFBTCxFQUE4QjtFQUM1QixVQUFJLEtBQUtKLGFBQUwsQ0FB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
