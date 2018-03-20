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
  constructor(finishedLoading = Promise.resolve()) {
    super();
    this.d3el = null;
    this.dirty = false;
    this.drawTimeout = null;
    this.debounceWait = 100;
    this.requireProperties(['setup', 'draw']);
    (async () => {
      await finishedLoading;
      this.render();
    })();
  }
  hasRenderedTo(d3el) {
    // Determine whether this is the first time we've rendered
    // inside this DOM element; return false if this is the first time
    // Also store the element as the last one that we rendered to

    let needsFreshRender = this.dirty;
    if (d3el) {
      if (this.d3el) {
        // only need to do a full render if the last element wasn't the same as this one
        needsFreshRender = this.dirty || d3el.node() !== this.d3el.node();
      } else {
        // we didn't have an element before
        needsFreshRender = true;
      }
      this.d3el = d3el;
    } else {
      if (!this.d3el) {
        // we weren't given a new element to render to, so use the last one
        throw new Error('Called render() without an element to render to (and no prior element has been specified)');
      } else {
        d3el = this.d3el;
      }
    }
    this.dirty = false;
    return !needsFreshRender;
  }
  render(d3el = this.d3el || d3.select('body')) {
    if (!this.hasRenderedTo(d3el)) {
      // Call setup immediately
      this.updateContainerCharacteristics(d3el);
      this.setup(d3el);
      this.d3el = d3el;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWtpLnVtZC5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMiLCIuLi9zcmMvTW9kZWwvaW5kZXguanMiLCIuLi9zcmMvVmlldy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBBYnN0cmFjdENsYXNzIHtcbiAgcmVxdWlyZVByb3BlcnRpZXMgKHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2gobSA9PiB7XG4gICAgICBpZiAodGhpc1ttXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IobSArICcgaXMgdW5kZWZpbmVkIGZvciBjbGFzcyAnICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuZXhwb3J0IGRlZmF1bHQgQWJzdHJhY3RDbGFzcztcbiIsImltcG9ydCBBYnN0cmFjdENsYXNzIGZyb20gJy4uL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMnO1xuXG5jbGFzcyBNb2RlbCBleHRlbmRzIEFic3RyYWN0Q2xhc3Mge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgfVxuICBvbiAoZXZlbnROYW1lLCBjYWxsYmFjaywgYWxsb3dEdXBsaWNhdGVMaXN0ZW5lcnMpIHtcbiAgICBpZiAoIXRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdO1xuICAgIH1cbiAgICBpZiAoIWFsbG93RHVwbGljYXRlTGlzdGVuZXJzKSB7XG4gICAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0uaW5kZXhPZihjYWxsYmFjaykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cbiAgb2ZmIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdHJpZ2dlciAoKSB7XG4gICAgbGV0IGV2ZW50TmFtZSA9IGFyZ3VtZW50c1swXTtcbiAgICBsZXQgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5mb3JFYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4geyAvLyBBZGQgdGltZW91dCB0byBwcmV2ZW50IGJsb2NraW5nXG4gICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vZGVsO1xuIiwiLyogZ2xvYmFscyBkMyAqL1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL01vZGVsL2luZGV4LmpzJztcblxuY2xhc3MgVmlldyBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3IgKGZpbmlzaGVkTG9hZGluZyA9IFByb21pc2UucmVzb2x2ZSgpKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmQzZWwgPSBudWxsO1xuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICB0aGlzLmRyYXdUaW1lb3V0ID0gbnVsbDtcbiAgICB0aGlzLmRlYm91bmNlV2FpdCA9IDEwMDtcbiAgICB0aGlzLnJlcXVpcmVQcm9wZXJ0aWVzKFsnc2V0dXAnLCAnZHJhdyddKTtcbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgZmluaXNoZWRMb2FkaW5nO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KSgpO1xuICB9XG4gIGhhc1JlbmRlcmVkVG8gKGQzZWwpIHtcbiAgICAvLyBEZXRlcm1pbmUgd2hldGhlciB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlJ3ZlIHJlbmRlcmVkXG4gICAgLy8gaW5zaWRlIHRoaXMgRE9NIGVsZW1lbnQ7IHJldHVybiBmYWxzZSBpZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lXG4gICAgLy8gQWxzbyBzdG9yZSB0aGUgZWxlbWVudCBhcyB0aGUgbGFzdCBvbmUgdGhhdCB3ZSByZW5kZXJlZCB0b1xuXG4gICAgbGV0IG5lZWRzRnJlc2hSZW5kZXIgPSB0aGlzLmRpcnR5O1xuICAgIGlmIChkM2VsKSB7XG4gICAgICBpZiAodGhpcy5kM2VsKSB7XG4gICAgICAgIC8vIG9ubHkgbmVlZCB0byBkbyBhIGZ1bGwgcmVuZGVyIGlmIHRoZSBsYXN0IGVsZW1lbnQgd2Fzbid0IHRoZSBzYW1lIGFzIHRoaXMgb25lXG4gICAgICAgIG5lZWRzRnJlc2hSZW5kZXIgPSB0aGlzLmRpcnR5IHx8IGQzZWwubm9kZSgpICE9PSB0aGlzLmQzZWwubm9kZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gd2UgZGlkbid0IGhhdmUgYW4gZWxlbWVudCBiZWZvcmVcbiAgICAgICAgbmVlZHNGcmVzaFJlbmRlciA9IHRydWU7XG4gICAgICB9XG4gICAgICB0aGlzLmQzZWwgPSBkM2VsO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXRoaXMuZDNlbCkge1xuICAgICAgICAvLyB3ZSB3ZXJlbid0IGdpdmVuIGEgbmV3IGVsZW1lbnQgdG8gcmVuZGVyIHRvLCBzbyB1c2UgdGhlIGxhc3Qgb25lXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FsbGVkIHJlbmRlcigpIHdpdGhvdXQgYW4gZWxlbWVudCB0byByZW5kZXIgdG8gKGFuZCBubyBwcmlvciBlbGVtZW50IGhhcyBiZWVuIHNwZWNpZmllZCknKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGQzZWwgPSB0aGlzLmQzZWw7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICByZXR1cm4gIW5lZWRzRnJlc2hSZW5kZXI7XG4gIH1cbiAgcmVuZGVyIChkM2VsID0gdGhpcy5kM2VsIHx8IGQzLnNlbGVjdCgnYm9keScpKSB7XG4gICAgaWYgKCF0aGlzLmhhc1JlbmRlcmVkVG8oZDNlbCkpIHtcbiAgICAgIC8vIENhbGwgc2V0dXAgaW1tZWRpYXRlbHlcbiAgICAgIHRoaXMudXBkYXRlQ29udGFpbmVyQ2hhcmFjdGVyaXN0aWNzKGQzZWwpO1xuICAgICAgdGhpcy5zZXR1cChkM2VsKTtcbiAgICAgIHRoaXMuZDNlbCA9IGQzZWw7XG4gICAgfVxuICAgIC8vIERlYm91bmNlIHRoZSBhY3R1YWwgZHJhdyBjYWxsXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZHJhd1RpbWVvdXQpO1xuICAgIHRoaXMuZHJhd1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZHJhd1RpbWVvdXQgPSBudWxsO1xuICAgICAgdGhpcy5kcmF3KGQzZWwpO1xuICAgIH0sIHRoaXMuZGVib3VuY2VXYWl0KTtcbiAgfVxuICB1cGRhdGVDb250YWluZXJDaGFyYWN0ZXJpc3RpY3MgKGQzZWwpIHtcbiAgICBpZiAoZDNlbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5ib3VuZHMgPSBkM2VsLm5vZGUoKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHRoaXMuZW1TaXplID0gcGFyc2VGbG9hdChkM2VsLnN0eWxlKCdmb250LXNpemUnKSk7XG4gICAgICB0aGlzLnNjcm9sbEJhclNpemUgPSB0aGlzLmNvbXB1dGVTY3JvbGxCYXJTaXplKGQzZWwpO1xuICAgIH1cbiAgfVxuICBjb21wdXRlU2Nyb2xsQmFyU2l6ZSAoZDNlbCkge1xuICAgIC8vIGJsYXRhbnRseSBhZGFwdGVkIGZyb20gU08gdGhyZWFkOlxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTMzODI1MTYvZ2V0dGluZy1zY3JvbGwtYmFyLXdpZHRoLXVzaW5nLWphdmFzY3JpcHRcbiAgICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBvdXRlci5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgb3V0ZXIuc3R5bGUud2lkdGggPSAnMTAwcHgnO1xuICAgIG91dGVyLnN0eWxlLm1zT3ZlcmZsb3dTdHlsZSA9ICdzY3JvbGxiYXInOyAvLyBuZWVkZWQgZm9yIFdpbkpTIGFwcHNcblxuICAgIGQzZWwubm9kZSgpLmFwcGVuZENoaWxkKG91dGVyKTtcblxuICAgIHZhciB3aWR0aE5vU2Nyb2xsID0gb3V0ZXIub2Zmc2V0V2lkdGg7XG4gICAgLy8gZm9yY2Ugc2Nyb2xsYmFyc1xuICAgIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG5cbiAgICAvLyBhZGQgaW5uZXJkaXZcbiAgICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBpbm5lci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICB2YXIgd2lkdGhXaXRoU2Nyb2xsID0gaW5uZXIub2Zmc2V0V2lkdGg7XG5cbiAgICAvLyByZW1vdmUgZGl2c1xuICAgIG91dGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQob3V0ZXIpO1xuXG4gICAgcmV0dXJuIHdpZHRoTm9TY3JvbGwgLSB3aWR0aFdpdGhTY3JvbGw7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVmlldztcbiJdLCJuYW1lcyI6WyJBYnN0cmFjdENsYXNzIiwicHJvcGVydGllcyIsImZvckVhY2giLCJtIiwidW5kZWZpbmVkIiwiVHlwZUVycm9yIiwiY29uc3RydWN0b3IiLCJuYW1lIiwiTW9kZWwiLCJldmVudEhhbmRsZXJzIiwiZXZlbnROYW1lIiwiY2FsbGJhY2siLCJhbGxvd0R1cGxpY2F0ZUxpc3RlbmVycyIsImluZGV4T2YiLCJwdXNoIiwiaW5kZXgiLCJzcGxpY2UiLCJhcmd1bWVudHMiLCJhcmdzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJzZXRUaW1lb3V0IiwiYXBwbHkiLCJWaWV3IiwiZmluaXNoZWRMb2FkaW5nIiwiUHJvbWlzZSIsInJlc29sdmUiLCJkM2VsIiwiZGlydHkiLCJkcmF3VGltZW91dCIsImRlYm91bmNlV2FpdCIsInJlcXVpcmVQcm9wZXJ0aWVzIiwicmVuZGVyIiwibmVlZHNGcmVzaFJlbmRlciIsIm5vZGUiLCJFcnJvciIsImQzIiwic2VsZWN0IiwiaGFzUmVuZGVyZWRUbyIsInVwZGF0ZUNvbnRhaW5lckNoYXJhY3RlcmlzdGljcyIsInNldHVwIiwiZHJhdyIsImJvdW5kcyIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImVtU2l6ZSIsInBhcnNlRmxvYXQiLCJzdHlsZSIsInNjcm9sbEJhclNpemUiLCJjb21wdXRlU2Nyb2xsQmFyU2l6ZSIsIm91dGVyIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwidmlzaWJpbGl0eSIsIndpZHRoIiwibXNPdmVyZmxvd1N0eWxlIiwiYXBwZW5kQ2hpbGQiLCJ3aWR0aE5vU2Nyb2xsIiwib2Zmc2V0V2lkdGgiLCJvdmVyZmxvdyIsImlubmVyIiwid2lkdGhXaXRoU2Nyb2xsIiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxNQUFNQSxhQUFOLENBQW9CO29CQUNDQyxVQUFuQixFQUErQjtlQUNsQkMsT0FBWCxDQUFtQkMsS0FBSztVQUNsQixLQUFLQSxDQUFMLE1BQVlDLFNBQWhCLEVBQTJCO2NBQ25CLElBQUlDLFNBQUosQ0FBY0YsSUFBSSwwQkFBSixHQUFpQyxLQUFLRyxXQUFMLENBQWlCQyxJQUFoRSxDQUFOOztLQUZKOzs7O0FDQUosTUFBTUMsS0FBTixTQUFvQlIsYUFBcEIsQ0FBa0M7Z0JBQ2pCOztTQUVSUyxhQUFMLEdBQXFCLEVBQXJCOztLQUVFQyxTQUFKLEVBQWVDLFFBQWYsRUFBeUJDLHVCQUF6QixFQUFrRDtRQUM1QyxDQUFDLEtBQUtILGFBQUwsQ0FBbUJDLFNBQW5CLENBQUwsRUFBb0M7V0FDN0JELGFBQUwsQ0FBbUJDLFNBQW5CLElBQWdDLEVBQWhDOztRQUVFLENBQUNFLHVCQUFMLEVBQThCO1VBQ3hCLEtBQUtILGFBQUwsQ0FBbUJDLFNBQW5CLEVBQThCRyxPQUE5QixDQUFzQ0YsUUFBdEMsTUFBb0QsQ0FBQyxDQUF6RCxFQUE0RDs7OztTQUl6REYsYUFBTCxDQUFtQkMsU0FBbkIsRUFBOEJJLElBQTlCLENBQW1DSCxRQUFuQzs7TUFFR0QsU0FBTCxFQUFnQkMsUUFBaEIsRUFBMEI7UUFDcEIsS0FBS0YsYUFBTCxDQUFtQkMsU0FBbkIsQ0FBSixFQUFtQztVQUM3QixDQUFDQyxRQUFMLEVBQWU7ZUFDTixLQUFLRixhQUFMLENBQW1CQyxTQUFuQixDQUFQO09BREYsTUFFTztZQUNESyxRQUFRLEtBQUtOLGFBQUwsQ0FBbUJDLFNBQW5CLEVBQThCRyxPQUE5QixDQUFzQ0YsUUFBdEMsQ0FBWjtZQUNJSSxTQUFTLENBQWIsRUFBZ0I7ZUFDVE4sYUFBTCxDQUFtQkMsU0FBbkIsRUFBOEJNLE1BQTlCLENBQXFDRCxLQUFyQyxFQUE0QyxDQUE1Qzs7Ozs7WUFLRztRQUNMTCxZQUFZTyxVQUFVLENBQVYsQ0FBaEI7UUFDSUMsT0FBT0MsTUFBTUMsU0FBTixDQUFnQkMsS0FBaEIsQ0FBc0JDLElBQXRCLENBQTJCTCxTQUEzQixFQUFzQyxDQUF0QyxDQUFYO1FBQ0ksS0FBS1IsYUFBTCxDQUFtQkMsU0FBbkIsQ0FBSixFQUFtQztXQUM1QkQsYUFBTCxDQUFtQkMsU0FBbkIsRUFBOEJSLE9BQTlCLENBQXNDUyxZQUFZO2VBQ3pDWSxVQUFQLENBQWtCLE1BQU07O21CQUNiQyxLQUFULENBQWUsSUFBZixFQUFxQk4sSUFBckI7U0FERixFQUVHLENBRkg7T0FERjs7Ozs7QUNsQ047QUFDQSxBQUVBLE1BQU1PLElBQU4sU0FBbUJqQixLQUFuQixDQUF5QjtjQUNWa0Isa0JBQWtCQyxRQUFRQyxPQUFSLEVBQS9CLEVBQWtEOztTQUUzQ0MsSUFBTCxHQUFZLElBQVo7U0FDS0MsS0FBTCxHQUFhLEtBQWI7U0FDS0MsV0FBTCxHQUFtQixJQUFuQjtTQUNLQyxZQUFMLEdBQW9CLEdBQXBCO1NBQ0tDLGlCQUFMLENBQXVCLENBQUMsT0FBRCxFQUFVLE1BQVYsQ0FBdkI7S0FDQyxZQUFZO1lBQ0xQLGVBQU47V0FDS1EsTUFBTDtLQUZGOztnQkFLYUwsSUFBZixFQUFxQjs7Ozs7UUFLZk0sbUJBQW1CLEtBQUtMLEtBQTVCO1FBQ0lELElBQUosRUFBVTtVQUNKLEtBQUtBLElBQVQsRUFBZTs7MkJBRU0sS0FBS0MsS0FBTCxJQUFjRCxLQUFLTyxJQUFMLE9BQWdCLEtBQUtQLElBQUwsQ0FBVU8sSUFBVixFQUFqRDtPQUZGLE1BR087OzJCQUVjLElBQW5COztXQUVHUCxJQUFMLEdBQVlBLElBQVo7S0FSRixNQVNPO1VBQ0QsQ0FBQyxLQUFLQSxJQUFWLEVBQWdCOztjQUVSLElBQUlRLEtBQUosQ0FBVSwyRkFBVixDQUFOO09BRkYsTUFHTztlQUNFLEtBQUtSLElBQVo7OztTQUdDQyxLQUFMLEdBQWEsS0FBYjtXQUNPLENBQUNLLGdCQUFSOztTQUVNTixPQUFPLEtBQUtBLElBQUwsSUFBYVMsR0FBR0MsTUFBSCxDQUFVLE1BQVYsQ0FBNUIsRUFBK0M7UUFDekMsQ0FBQyxLQUFLQyxhQUFMLENBQW1CWCxJQUFuQixDQUFMLEVBQStCOztXQUV4QlksOEJBQUwsQ0FBb0NaLElBQXBDO1dBQ0thLEtBQUwsQ0FBV2IsSUFBWDtXQUNLQSxJQUFMLEdBQVlBLElBQVo7OztpQkFHVyxLQUFLRSxXQUFsQjtTQUNLQSxXQUFMLEdBQW1CUixXQUFXLE1BQU07V0FDN0JRLFdBQUwsR0FBbUIsSUFBbkI7V0FDS1ksSUFBTCxDQUFVZCxJQUFWO0tBRmlCLEVBR2hCLEtBQUtHLFlBSFcsQ0FBbkI7O2lDQUs4QkgsSUFBaEMsRUFBc0M7UUFDaENBLFNBQVMsSUFBYixFQUFtQjtXQUNaZSxNQUFMLEdBQWNmLEtBQUtPLElBQUwsR0FBWVMscUJBQVosRUFBZDtXQUNLQyxNQUFMLEdBQWNDLFdBQVdsQixLQUFLbUIsS0FBTCxDQUFXLFdBQVgsQ0FBWCxDQUFkO1dBQ0tDLGFBQUwsR0FBcUIsS0FBS0Msb0JBQUwsQ0FBMEJyQixJQUExQixDQUFyQjs7O3VCQUdrQkEsSUFBdEIsRUFBNEI7OztRQUd0QnNCLFFBQVFDLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWjtVQUNNTCxLQUFOLENBQVlNLFVBQVosR0FBeUIsUUFBekI7VUFDTU4sS0FBTixDQUFZTyxLQUFaLEdBQW9CLE9BQXBCO1VBQ01QLEtBQU4sQ0FBWVEsZUFBWixHQUE4QixXQUE5QixDQU4wQjs7U0FRckJwQixJQUFMLEdBQVlxQixXQUFaLENBQXdCTixLQUF4Qjs7UUFFSU8sZ0JBQWdCUCxNQUFNUSxXQUExQjs7VUFFTVgsS0FBTixDQUFZWSxRQUFaLEdBQXVCLFFBQXZCOzs7UUFHSUMsUUFBUVQsU0FBU0MsYUFBVCxDQUF1QixLQUF2QixDQUFaO1VBQ01MLEtBQU4sQ0FBWU8sS0FBWixHQUFvQixNQUFwQjtVQUNNRSxXQUFOLENBQWtCSSxLQUFsQjs7UUFFSUMsa0JBQWtCRCxNQUFNRixXQUE1Qjs7O1VBR01JLFVBQU4sQ0FBaUJDLFdBQWpCLENBQTZCYixLQUE3Qjs7V0FFT08sZ0JBQWdCSSxlQUF2Qjs7Ozs7Ozs7Ozs7Ozs7OzsifQ==
