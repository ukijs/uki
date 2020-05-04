const FixedGLViewMixin = function (superclass) {
  const FixedGLView = class extends superclass {
    constructor (options) {
      super(options);
      this.fixedTagType = options.fixedTagType;
      this._previousBounds = { width: 0, height: 0 };
    }
    setupD3El () {
      return this.glEl.append(this.fixedTagType)
        .classed('FixedGLView', true)
        .attr('src', this.src)
        .on('load', () => { this.trigger('viewLoaded'); });
    }
    getBounds (el = this.glEl) {
      // Don't rely on non-dynamic width / height for available space; use
      // this.glEl instead of this.d3el
      return super.getBounds(el);
    }
    draw () {
      super.draw();

      const bounds = this.getBounds();
      if (this._previousBounds.width !== bounds.width ||
          this._previousBounds.height !== bounds.height) {
        this.trigger('viewResized');
      }
      this._previousBounds = bounds;
      this.d3el
        .attr('width', bounds.width)
        .attr('height', bounds.height);
    }
  };
  FixedGLView.prototype._instanceOfFixedGLViewMixin = true;
  return FixedGLView;
};
Object.defineProperty(FixedGLViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfFixedGLViewMixin
});
export default FixedGLViewMixin;
