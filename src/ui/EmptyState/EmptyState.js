/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { RestylableMixin } from '../Restylable/Restylable.js';
import defaultStyle from './style.less';

const { EmptyStateView, EmptyStateMixin } = createMixinAndDefault('EmptyStateMixin', View, superclass => {
  class EmptyStateView extends RestylableMixin(superclass, defaultStyle, 'EmptyStateLayer', true) {
    get emptyMessage () {
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
        .classed('EmptyStateLayer', true)
        .style('display', 'none');
      this.emptyStateContent = this.emptyStateWrapper.append('div')
        .classed('EmptyStateLayerContent', true);
    }
    draw () {
      super.draw();
      const message = this.emptyMessage;
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
  }
  return EmptyStateView;
}, true);
export { EmptyStateView, EmptyStateMixin };
