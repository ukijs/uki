/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';

const { ParentSizeView, ParentSizeViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class ParentSizeView extends SuperClass {
      getBounds (parent = d3.select(this.d3el.node().parentNode)) {
        // Temporarily set this element's size to 0,0 so that it doesn't influence
        // it's parent's natural size
        const previousBounds = {
          width: this.d3el.attr('width'),
          height: this.d3el.attr('height')
        };
        this.d3el
          .attr('width', 0)
          .attr('height', 0);
        const bounds = parent.node().getBoundingClientRect();
        // Restore the bounds
        this.d3el
          .attr('width', previousBounds.width)
          .attr('height', previousBounds.height);
        return bounds;
      }
      draw () {
        super.draw(...arguments);
        const bounds = this.getBounds();
        this.d3el
          .attr('width', bounds.width)
          .attr('height', bounds.height);
      }
    }
    return ParentSizeView;
  }
});
export { ParentSizeView, ParentSizeViewMixin };
