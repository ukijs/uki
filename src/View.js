import Model from './Model.js';

/**
 * View classes
 */
class View extends Model {
  constructor (d3el = null, resources) {
    super(resources);
    this.d3el = d3el;
    this.dirty = true;
    this._drawTimeout = null;
    this._renderResolves = [];
    this.debounceWait = 100;
    this.render();
  }
  async render (d3el = this.d3el) {
    this.d3el = d3el;
    if (!this.d3el) {
      // Don't execute any render calls until all resources are loaded,
      // and we've actually been given a d3 element to work with
      return new Promise((resolve, reject) => {
        this._renderResolves.push(resolve);
      });
    }
    await this.ready;
    if (this.dirty || d3el.node() !== this.d3el.node()) {
      // Need a fresh render; call setup immediately
      this.updateContainerCharacteristics(d3el);
      await this.setup(d3el);
      this.trigger('setupFinished');
      this.dirty = false;
    }
    // Debounce the actual draw call, and return promises that will resolve when
    // draw() actually finishes
    return new Promise((resolve, reject) => {
      this._renderResolves.push(resolve);
      clearTimeout(this._drawTimeout);
      this._drawTimeout = setTimeout(async () => {
        this._drawTimeout = null;
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
    if (d3el !== null) {
      this.bounds = d3el.node().getBoundingClientRect();
      this.emSize = parseFloat(d3el.style('font-size'));
      this.scrollBarSize = this.computeScrollBarSize(d3el);
    }
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
