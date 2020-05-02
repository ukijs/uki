const IFrameViewMixin = function (superclass) {
  const IFrameView = class extends superclass {
    constructor (argObj) {
      argObj.resources = argObj.resources || [];
      argObj.resources.push({
        type: 'less', url: './views/common/IFrameViewMixin.less'
      });
      super(argObj);
      this._src = argObj._src;
      this._previousBounds = { width: 0, height: 0 };
      this.frameLoaded = !this.src; // We are loaded if no src is initially provided
    }
    get src () {
      return this._src;
    }
    set src (src) {
      this.frameLoaded = !src;
      this._src = src;
      this.d3el.select('iframe')
        .attr('src', this._src);
      this.render();
    }
    setupContentElement () {
      return this.d3el.append('iframe')
        .classed('IFrameView', true)
        .attr('src', this.src)
        .on('load', () => {
          this.frameLoaded = true;
          this.render();
        });
    }
    get isLoading () {
      return super.isLoading || !this.frameLoaded;
    }
    getAvailableSpace () {
      // Don't rely on non-dynamic width / height for available space; use
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
    setupTab () {
      super.setupTab();
      this.tabElement
        .classed('IFrameTab', true)
        .append('div')
        .classed('linkIcon', true)
        .attr('title', 'Open in new tab')
        .on('click', () => {
          window.open(this.src, '_blank');
        });
    }
  };
  IFrameView.prototype._instanceOfIFrameViewMixin = true;
  return IFrameView;
};
Object.defineProperty(IFrameViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfIFrameViewMixin
});
export default IFrameViewMixin;
