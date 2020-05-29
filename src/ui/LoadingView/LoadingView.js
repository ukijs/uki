/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';

const { LoadingView, LoadingViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class LoadingView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'LoadingSpinner', cnNotOnD3el: true
    }) {
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
        super.setup(...arguments);
        // Place a layer on top of this.d3el
        const parent = d3.select(this.d3el.node().parentNode);
        this.spinner = parent.append('div')
          .classed('LoadingSpinner', true)
          .style('display', 'none');
      }
      draw () {
        super.draw(...arguments);
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
  }
});
export { LoadingView, LoadingViewMixin };
