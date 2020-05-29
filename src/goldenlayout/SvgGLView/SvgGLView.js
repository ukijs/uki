/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { SvgViewMixin } from '../../ui/SvgView/SvgView.js';
import { GLView } from '../GLView/GLView.js';
import { ThemeableMixin } from '../../ui/ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';

const { SvgGLView, SvgGLViewMixin } = createMixinAndDefault({
  DefaultSuperClass: GLView,
  classDefFunc: SuperClass => {
    class SvgGLView extends SvgViewMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'SvgGLView', cnNotOnD3el: true
    })) {
      setupD3El () {
        return this.glEl.append('svg')
          .attr('src', this.src)
          .on('load', () => { this.trigger('viewLoaded'); });
      }
      setupTab () {
        super.setupTab();
        this.glTabEl
          .classed('SvgGLTab', true)
          .append('div')
          .classed('downloadIcon', true)
          .attr('title', 'Download')
          .on('mousedown', () => {
            d3.event.stopPropagation();
          })
          .on('mouseup', () => {
            this.download();
          });
      }
    }
    return SvgGLView;
  }
});
export { SvgGLView, SvgGLViewMixin };
