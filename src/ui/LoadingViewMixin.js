/* globals d3 */
import lessStyle from './LoadingViewMixin.less';

const LoadingViewMixin = function (superclass) {
  const LoadingView = class extends superclass {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle
      });
      super(options);
      this._loaded = false;
      this.on('load', () => {
        this._loaded = true;
        this.render();
      });
    }
    get isLoading () {
      return !this._loaded;
    }
    setup () {
      super.setup();
      // Place a layer on top of this.d3el
      const parent = d3.select(this.d3el.node().parentNode);
      this.spinner = parent.append('div')
        .classed('LoadingViewMixinSpinner', true)
        .style('display', 'none');
    }
    draw () {
      super.draw();
      // Match the position / size of this.d3el
      const bounds = this.getBounds();
      const parentBounds = this.getBounds(d3.select(this.d3el.node().parentNode));
      this.spinner
        .style('top', bounds.top - parentBounds.top)
        .style('left', bounds.left - parentBounds.left)
        .style('right', bounds.right - parentBounds.right)
        .style('bottom', bounds.bottom - parentBounds.bottom)
        .style('display', this.isLoading ? null : 'none');
    }
  };
  LoadingView.prototype._instanceOfLoadingViewMixin = true;
  return LoadingView;
};
Object.defineProperty(LoadingViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfLoadingViewMixin
});
export default LoadingViewMixin;
