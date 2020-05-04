/* globals d3 */
import lessStyle from './EmptyStateViewMixin.less';

const EmptyStateViewMixin = function (superclass) {
  const EmptyStateView = class extends superclass {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle
      });
      super(options);
    }
    getEmptyMessage () {
      // Should be overridden by subclasses; return an html string (or falsey to
      // hide the empty state layer)
      return '';
    }
    setup () {
      super.setup();
      // Insert a layer underneath this.d3el
      const node = this.d3el.node();
      const parentNode = node.parentNode;
      const wrapperNode = document.createElement('div');
      parentNode.insertBefore(wrapperNode, node);
      this.emptyStateWrapper = d3.select(wrapperNode)
        .classed('EmptyStateViewWrapper', true)
        .style('display', 'none');
      this.emptyStateContent = this.emptyStateWrapper.append('div')
        .classed('EmptyStateContent', true);
    }
    draw () {
      super.draw();
      const message = this.getEmptyMessage();
      // Match the position / size of this.d3el
      const bounds = this.getBounds();
      const parentBounds = this.getBounds(d3.select(this.d3el.node().parentNode));
      this.emptyStateContent.html(message);
      this.emptyStateWrapper
        .style('top', bounds.top - parentBounds.top)
        .style('left', bounds.left - parentBounds.left)
        .style('right', bounds.right - parentBounds.right)
        .style('bottom', bounds.bottom - parentBounds.bottom)
        .style('display', message ? null : 'none');
    }
  };
  EmptyStateView.prototype._instanceOfEmptyStateViewMixin = true;
  return EmptyStateView;
};
Object.defineProperty(EmptyStateViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfEmptyStateViewMixin
});
export default EmptyStateViewMixin;
