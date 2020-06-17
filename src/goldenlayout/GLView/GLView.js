/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { IntrospectableMixin } from '../../utils/Introspectable.js';
import { ThemeableMixin } from '../../style/ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';

const { GLView, GLViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class GLView extends IntrospectableMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'GLView'
    })) {
      constructor (options) {
        super(options);
        this.glContainer = options.glContainer;
        this.state = options.glState;
        this.isHidden = false;
        this.glContainer.on('tab', tab => {
          this.glTabEl = d3.select(tab.element[0]);
          this.setupTab();

          // GoldenLayout creates a separate DragProxy element that needs our
          // custom tab modifications while dragging
          tab._dragListener.on('dragStart', () => {
            const draggedTabElement = d3.select('.lm_dragProxy .lm_tab');
            this.setupTab(draggedTabElement);
            this.drawTab(draggedTabElement);
          });
        });
        this.glContainer.on('open', () => {
          this.glEl = d3.select(this.glContainer.getElement()[0]);
          const d3el = this.setupD3El();
          this.render(d3el);
        });
        this.glContainer.on('hide', () => {
          this.isHidden = true;
        });
        this.glContainer.on('show', () => {
          this.isHidden = false;
          this.render();
        });
        this.glContainer.on('resize', () => this.render());
      }
      get title () {
        return this.humanReadableType;
      }
      setupTab () {
        this.glTabEl.classed(this.type, true);
      }
      drawTab () {
        this.glTabEl.select(':scope > .lm_title')
          .text(this.title);
      }
      setupD3El () {
        // Default setup is a scrollable div; subclasses might override this
        return this.glEl.append('div')
          .classed('scrollArea', true);
      }
      getAvailableSpace (content = this.d3el) {
        return content.node().getBoundingClientRect();
      }
      draw () {
        super.draw(...arguments);
        if (this.glTabEl) {
          this.drawTab();
        }
      }
    }
    return GLView;
  }
});

export { GLView, GLViewMixin };
