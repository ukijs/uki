/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { RestylableMixin } from '../Restylable/Restylable.js';
import defaultStyle from './style.less';

const { LoadingView, LoadingMixin } = createMixinAndDefault('LoadingMixin', View, superclass => {
  class LoadingView extends RestylableMixin(superclass, defaultStyle, 'LoadingSpinner', true) {
    constructor (options) {
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
        .classed('LoadingSpinner', true)
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
  }
  return LoadingView;
}, true);
export { LoadingView, LoadingMixin };
