import FixedGLViewMixin from './FixedGLViewMixin.js';
import lessStyle from './IFrameViewMixin.less';

const IFrameViewMixin = function (superclass) {
  const IFrameView = class extends FixedGLViewMixin(superclass) {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle
      });
      options.fixedTagType = 'iframe';
      super(options);
      this._src = options.src;
      this.frameLoaded = !this._src; // We are loaded if no src is initially provided
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
    get isLoading () {
      return super.isLoading || !this.frameLoaded;
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
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
