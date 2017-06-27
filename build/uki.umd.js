(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.uki = global.uki || {})));
}(this, (function (exports) { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var AbstractClass = function () {
  function AbstractClass() {
    classCallCheck(this, AbstractClass);
  }

  createClass(AbstractClass, [{
    key: 'requireProperties',
    value: function requireProperties(properties) {
      var _this = this;

      properties.forEach(function (m) {
        if (_this[m] === undefined) {
          throw new TypeError(m + ' is undefined for class ' + _this.constructor.name);
        }
      });
    }
  }]);
  return AbstractClass;
}();

var Model = function (_AbstractClass) {
  inherits(Model, _AbstractClass);

  function Model() {
    classCallCheck(this, Model);

    var _this = possibleConstructorReturn(this, (Model.__proto__ || Object.getPrototypeOf(Model)).call(this));

    _this.eventHandlers = {};
    return _this;
  }

  createClass(Model, [{
    key: 'on',
    value: function on(eventName, callback, allowDuplicateListeners) {
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
  }, {
    key: 'off',
    value: function off(eventName, callback) {
      if (this.eventHandlers[eventName]) {
        if (!callback) {
          delete this.eventHandlers[eventName];
        } else {
          var index = this.eventHandlers[eventName].indexOf(callback);
          if (index >= 0) {
            this.eventHandlers[eventName].splice(index, 1);
          }
        }
      }
    }
  }, {
    key: 'trigger',
    value: function trigger() {
      var _this2 = this;

      var eventName = arguments[0];
      var args = Array.prototype.slice.call(arguments, 1);
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName].forEach(function (callback) {
          window.setTimeout(function () {
            // Add timeout to prevent blocking
            callback.apply(_this2, args);
          }, 0);
        });
      }
    }
  }]);
  return Model;
}(AbstractClass);

var View = function (_Model) {
  inherits(View, _Model);

  function View() {
    classCallCheck(this, View);

    var _this = possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this));

    _this.d3el = null;
    _this.dirty = false;
    _this.drawTimeout = null;
    _this.debounceWait = 100;
    _this.requireProperties(['setup', 'draw']);
    return _this;
  }

  createClass(View, [{
    key: 'hasRenderedTo',
    value: function hasRenderedTo(d3el) {
      // Determine whether this is the first time we've rendered
      // inside this DOM element; return false if this is the first time
      // Also store the element as the last one that we rendered to

      var needsFreshRender = this.dirty;
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
  }, {
    key: 'render',
    value: function render(d3el) {
      var _this2 = this;

      d3el = d3el || this.d3el;
      if (!this.hasRenderedTo(d3el)) {
        // Call setup immediately
        this.updateContainerCharacteristics(d3el);
        this.setup(d3el);
        this.d3el = d3el;
      }
      // Debounce the actual draw call
      clearTimeout(this.drawTimeout);
      this.drawTimeout = setTimeout(function () {
        _this2.drawTimeout = null;
        _this2.draw(d3el);
      }, this.debounceWait);
    }
  }, {
    key: 'updateContainerCharacteristics',
    value: function updateContainerCharacteristics(d3el) {
      if (d3el !== null) {
        this.emSize = parseFloat(d3el.style('font-size'));
        this.scrollBarSize = this.computeScrollBarSize(d3el);
      }
    }
  }, {
    key: 'computeScrollBarSize',
    value: function computeScrollBarSize(d3el) {
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
  }]);
  return View;
}(Model);

exports.AbstractClass = AbstractClass;
exports.Model = Model;
exports.View = View;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWtpLnVtZC5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMiLCIuLi9zcmMvTW9kZWwvaW5kZXguanMiLCIuLi9zcmMvVmlldy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBBYnN0cmFjdENsYXNzIHtcbiAgcmVxdWlyZVByb3BlcnRpZXMgKHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2gobSA9PiB7XG4gICAgICBpZiAodGhpc1ttXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IobSArICcgaXMgdW5kZWZpbmVkIGZvciBjbGFzcyAnICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuZXhwb3J0IGRlZmF1bHQgQWJzdHJhY3RDbGFzcztcbiIsImltcG9ydCBBYnN0cmFjdENsYXNzIGZyb20gJy4uL0Fic3RyYWN0Q2xhc3MvaW5kZXguanMnO1xuXG5jbGFzcyBNb2RlbCBleHRlbmRzIEFic3RyYWN0Q2xhc3Mge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgfVxuICBvbiAoZXZlbnROYW1lLCBjYWxsYmFjaywgYWxsb3dEdXBsaWNhdGVMaXN0ZW5lcnMpIHtcbiAgICBpZiAoIXRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdO1xuICAgIH1cbiAgICBpZiAoIWFsbG93RHVwbGljYXRlTGlzdGVuZXJzKSB7XG4gICAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0uaW5kZXhPZihjYWxsYmFjaykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cbiAgb2ZmIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdHJpZ2dlciAoKSB7XG4gICAgbGV0IGV2ZW50TmFtZSA9IGFyZ3VtZW50c1swXTtcbiAgICBsZXQgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5mb3JFYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4geyAgIC8vIEFkZCB0aW1lb3V0IHRvIHByZXZlbnQgYmxvY2tpbmdcbiAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW9kZWw7XG4iLCJpbXBvcnQgTW9kZWwgZnJvbSAnLi4vTW9kZWwvaW5kZXguanMnO1xuXG5jbGFzcyBWaWV3IGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmQzZWwgPSBudWxsO1xuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICB0aGlzLmRyYXdUaW1lb3V0ID0gbnVsbDtcbiAgICB0aGlzLmRlYm91bmNlV2FpdCA9IDEwMDtcbiAgICB0aGlzLnJlcXVpcmVQcm9wZXJ0aWVzKFsnc2V0dXAnLCAnZHJhdyddKTtcbiAgfVxuICBoYXNSZW5kZXJlZFRvIChkM2VsKSB7XG4gICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB3ZSd2ZSByZW5kZXJlZFxuICAgIC8vIGluc2lkZSB0aGlzIERPTSBlbGVtZW50OyByZXR1cm4gZmFsc2UgaWYgdGhpcyBpcyB0aGUgZmlyc3QgdGltZVxuICAgIC8vIEFsc28gc3RvcmUgdGhlIGVsZW1lbnQgYXMgdGhlIGxhc3Qgb25lIHRoYXQgd2UgcmVuZGVyZWQgdG9cblxuICAgIGxldCBuZWVkc0ZyZXNoUmVuZGVyID0gdGhpcy5kaXJ0eTtcbiAgICBpZiAoZDNlbCkge1xuICAgICAgaWYgKHRoaXMuZDNlbCkge1xuICAgICAgICAvLyBvbmx5IG5lZWQgdG8gZG8gYSBmdWxsIHJlbmRlciBpZiB0aGUgbGFzdCBlbGVtZW50IHdhc24ndCB0aGUgc2FtZSBhcyB0aGlzIG9uZVxuICAgICAgICBuZWVkc0ZyZXNoUmVuZGVyID0gdGhpcy5kaXJ0eSB8fCBkM2VsLm5vZGUoKSAhPT0gdGhpcy5kM2VsLm5vZGUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHdlIGRpZG4ndCBoYXZlIGFuIGVsZW1lbnQgYmVmb3JlXG4gICAgICAgIG5lZWRzRnJlc2hSZW5kZXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5kM2VsID0gZDNlbDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLmQzZWwpIHtcbiAgICAgICAgLy8gd2Ugd2VyZW4ndCBnaXZlbiBhIG5ldyBlbGVtZW50IHRvIHJlbmRlciB0bywgc28gdXNlIHRoZSBsYXN0IG9uZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbGxlZCByZW5kZXIoKSB3aXRob3V0IGFuIGVsZW1lbnQgdG8gcmVuZGVyIHRvIChhbmQgbm8gcHJpb3IgZWxlbWVudCBoYXMgYmVlbiBzcGVjaWZpZWQpJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkM2VsID0gdGhpcy5kM2VsO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgcmV0dXJuICFuZWVkc0ZyZXNoUmVuZGVyO1xuICB9XG4gIHJlbmRlciAoZDNlbCkge1xuICAgIGQzZWwgPSBkM2VsIHx8IHRoaXMuZDNlbDtcbiAgICBpZiAoIXRoaXMuaGFzUmVuZGVyZWRUbyhkM2VsKSkge1xuICAgICAgLy8gQ2FsbCBzZXR1cCBpbW1lZGlhdGVseVxuICAgICAgdGhpcy51cGRhdGVDb250YWluZXJDaGFyYWN0ZXJpc3RpY3MoZDNlbCk7XG4gICAgICB0aGlzLnNldHVwKGQzZWwpO1xuICAgICAgdGhpcy5kM2VsID0gZDNlbDtcbiAgICB9XG4gICAgLy8gRGVib3VuY2UgdGhlIGFjdHVhbCBkcmF3IGNhbGxcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kcmF3VGltZW91dCk7XG4gICAgdGhpcy5kcmF3VGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5kcmF3VGltZW91dCA9IG51bGw7XG4gICAgICB0aGlzLmRyYXcoZDNlbCk7XG4gICAgfSwgdGhpcy5kZWJvdW5jZVdhaXQpO1xuICB9XG4gIHVwZGF0ZUNvbnRhaW5lckNoYXJhY3RlcmlzdGljcyAoZDNlbCkge1xuICAgIGlmIChkM2VsICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmVtU2l6ZSA9IHBhcnNlRmxvYXQoZDNlbC5zdHlsZSgnZm9udC1zaXplJykpO1xuICAgICAgdGhpcy5zY3JvbGxCYXJTaXplID0gdGhpcy5jb21wdXRlU2Nyb2xsQmFyU2l6ZShkM2VsKTtcbiAgICB9XG4gIH1cbiAgY29tcHV0ZVNjcm9sbEJhclNpemUgKGQzZWwpIHtcbiAgICAvLyBibGF0YW50bHkgYWRhcHRlZCBmcm9tIFNPIHRocmVhZDpcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEzMzgyNTE2L2dldHRpbmctc2Nyb2xsLWJhci13aWR0aC11c2luZy1qYXZhc2NyaXB0XG4gICAgdmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgb3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIG91dGVyLnN0eWxlLndpZHRoID0gJzEwMHB4JztcbiAgICBvdXRlci5zdHlsZS5tc092ZXJmbG93U3R5bGUgPSAnc2Nyb2xsYmFyJzsgLy8gbmVlZGVkIGZvciBXaW5KUyBhcHBzXG5cbiAgICBkM2VsLm5vZGUoKS5hcHBlbmRDaGlsZChvdXRlcik7XG5cbiAgICB2YXIgd2lkdGhOb1Njcm9sbCA9IG91dGVyLm9mZnNldFdpZHRoO1xuICAgIC8vIGZvcmNlIHNjcm9sbGJhcnNcbiAgICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuXG4gICAgLy8gYWRkIGlubmVyZGl2XG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaW5uZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgb3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gICAgdmFyIHdpZHRoV2l0aFNjcm9sbCA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG4gICAgLy8gcmVtb3ZlIGRpdnNcbiAgICBvdXRlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG91dGVyKTtcblxuICAgIHJldHVybiB3aWR0aE5vU2Nyb2xsIC0gd2lkdGhXaXRoU2Nyb2xsO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFZpZXc7XG4iXSwibmFtZXMiOlsiQWJzdHJhY3RDbGFzcyIsInByb3BlcnRpZXMiLCJmb3JFYWNoIiwibSIsInVuZGVmaW5lZCIsIlR5cGVFcnJvciIsImNvbnN0cnVjdG9yIiwibmFtZSIsIk1vZGVsIiwiZXZlbnRIYW5kbGVycyIsImV2ZW50TmFtZSIsImNhbGxiYWNrIiwiYWxsb3dEdXBsaWNhdGVMaXN0ZW5lcnMiLCJpbmRleE9mIiwicHVzaCIsImluZGV4Iiwic3BsaWNlIiwiYXJndW1lbnRzIiwiYXJncyIsIkFycmF5IiwicHJvdG90eXBlIiwic2xpY2UiLCJjYWxsIiwic2V0VGltZW91dCIsImFwcGx5IiwiVmlldyIsImQzZWwiLCJkaXJ0eSIsImRyYXdUaW1lb3V0IiwiZGVib3VuY2VXYWl0IiwicmVxdWlyZVByb3BlcnRpZXMiLCJuZWVkc0ZyZXNoUmVuZGVyIiwibm9kZSIsIkVycm9yIiwiaGFzUmVuZGVyZWRUbyIsInVwZGF0ZUNvbnRhaW5lckNoYXJhY3RlcmlzdGljcyIsInNldHVwIiwiZHJhdyIsImVtU2l6ZSIsInBhcnNlRmxvYXQiLCJzdHlsZSIsInNjcm9sbEJhclNpemUiLCJjb21wdXRlU2Nyb2xsQmFyU2l6ZSIsIm91dGVyIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwidmlzaWJpbGl0eSIsIndpZHRoIiwibXNPdmVyZmxvd1N0eWxlIiwiYXBwZW5kQ2hpbGQiLCJ3aWR0aE5vU2Nyb2xsIiwib2Zmc2V0V2lkdGgiLCJvdmVyZmxvdyIsImlubmVyIiwid2lkdGhXaXRoU2Nyb2xsIiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFBTUE7Ozs7Ozs7c0NBQ2VDLFlBQVk7OztpQkFDbEJDLE9BQVgsQ0FBbUIsYUFBSztZQUNsQixNQUFLQyxDQUFMLE1BQVlDLFNBQWhCLEVBQTJCO2dCQUNuQixJQUFJQyxTQUFKLENBQWNGLElBQUksMEJBQUosR0FBaUMsTUFBS0csV0FBTCxDQUFpQkMsSUFBaEUsQ0FBTjs7T0FGSjs7Ozs7O0lDQUVDOzs7bUJBQ1c7Ozs7O1VBRVJDLGFBQUwsR0FBcUIsRUFBckI7Ozs7Ozt1QkFFRUMsV0FBV0MsVUFBVUMseUJBQXlCO1VBQzVDLENBQUMsS0FB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
