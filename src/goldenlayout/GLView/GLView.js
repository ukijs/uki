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
        this.icons = options.icons || [];
        this.initIcons();
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
      initIcons () {
        for (const icon of this.icons) {
          if (icon.svg) {
            // Convert raw SVG to an Image
            icon.src = window.URL.createObjectURL(
              new window.Blob([icon.svg],
                { type: 'image/svg+xml;charset=utf-8' }));
          }
        }
      }
      setupTab () {
        this.glTabEl.classed(this.type + 'Tab', true)
          .insert('div', '.lm_title + *').classed('icons', true);
      }
      drawTab () {
        this.glTabEl.select(':scope > .lm_title')
          .text(this.title);

        let icons = this.glTabEl.select('.icons')
          .selectAll('.icon').data(this.icons);
        icons.exit().remove();
        const iconsEnter = icons.enter()
          .append('div').classed('icon', true);
        icons = icons.merge(iconsEnter);

        iconsEnter.append('img');
        icons.select('img').attr('src', d => d.src);

        icons.on('mousedown', () => {
          d3.event.stopPropagation();
        }).on('mouseup', d => { d.onclick(); });

        this.trigger('tabDrawn');
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
