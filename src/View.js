import Model from './Model.js';

/**
 * View classes
 */
class View extends Model {
  constructor (d3el = null, resources) {
    super(resources);
    this.d3el = this.checkForEmptySelection(d3el);
    this.dirty = true;
    this._drawTimeout = null;
    this._renderResolves = [];
    this.debounceWait = 100;
    this.render();
  }
  checkForEmptySelection (d3el) {
    if (d3el && d3el.node() === null) {
      // Only trigger a warning if an empty selection gets passed in; undefined
      // is still just fine because render() doesn't always require an argument
      console.warn('Empty d3 selection passed to uki.js View');
      return null;
    } else {
      return d3el;
    }
  }
  async render (d3el = this.d3el) {
    d3el = this.checkForEmptySelection(d3el);
    if (!this.d3el || (d3el && d3el.node() !== this.d3el.node())) {
      this.d3el = d3el;
      this.dirty = true;
    }
    if (!this.d3el) {
      // Don't execute any render calls until all resources are loaded,
      // and we've actually been given a d3 element to work with
      return new Promise((resolve, reject) => {
        this._renderResolves.push(resolve);
      });
    }
    await this.ready;
    if (this.dirty && this._setupPromise === undefined) {
      // Need a fresh render; call setup immediately
      this.d3el = d3el;
      this.updateContainerCharacteristics(d3el);
      this._setupPromise = this.setup(d3el);
      this.dirty = false;
      await this._setupPromise;
      delete this._setupPromise;
      this.trigger('setupFinished');
    }
    // Debounce the actual draw call, and return a promise that will resolve
    // when draw() actually finishes
    return new Promise((resolve, reject) => {
      this._renderResolves.push(resolve);
      clearTimeout(this._drawTimeout);
      this._drawTimeout = setTimeout(async () => {
        this._drawTimeout = null;
        if (this._setupPromise) {
          await this._setupPromise;
        }
        await this.draw(d3el);
        for (const r of this._renderResolves) {
          r();
        }
        this._renderResolves = [];
      }, this.debounceWait);
    });
  }

  setup (d3el) {}
  draw (d3el) {}
  updateContainerCharacteristics (d3el) {
    this.bounds = d3el.node().getBoundingClientRect();
    this.emSize = parseFloat(d3el.style('font-size'));
    this.scrollBarSize = this.computeScrollBarSize(d3el);
  }
  computeScrollBarSize (d3el) {
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

export default View;
