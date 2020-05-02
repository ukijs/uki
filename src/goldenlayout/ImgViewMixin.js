const ImgViewMixin = function (superclass) {
  const ImgView = class extends superclass {
    constructor (argObj) {
      super(argObj);
      this.src = argObj.src;
      this._previousBounds = { width: 0, height: 0 };
    }
    setupContentElement () {
      return this.d3el.append('img')
        .classed('ImgView', true)
        .attr('src', this.src)
        .on('load', () => { this.trigger('viewLoaded'); });
    }
    getAvailableSpace () {
      // Don't rely on non-dynamic img width / height for available space; use
      // this.d3el instead
      return super.getAvailableSpace(this.d3el);
    }
    draw () {
      super.draw();

      const bounds = this.getAvailableSpace();
      if (this._previousBounds.width !== bounds.width ||
          this._previousBounds.height !== bounds.height) {
        this.trigger('viewResized');
      }
      this._previousBounds = bounds;
      this.content
        .attr('width', bounds.width)
        .attr('height', bounds.height);
    }
  };
  ImgView.prototype._instanceOfImgViewMixin = true;
  return ImgView;
};
Object.defineProperty(ImgViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfImgViewMixin
});
export default ImgViewMixin;
