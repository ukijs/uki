/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { SvgMixin } from '../../ui/SvgView/SvgView.js';
import { GLView } from '../GLView/GLView.js';
import { RestylableMixin } from '../../ui/Restylable/Restylable.js';
import defaultStyle from './style.less';

const { SvgGLView, SvgGLMixin } = createMixinAndDefault('SvgGLMixin', GLView, superclass => {
  class SvgGLView extends SvgMixin(RestylableMixin(superclass, defaultStyle, 'SvgGLView', true)) {
    setupD3El () {
      return this.glEl.append('svg')
        .attr('src', this.src)
        .on('load', () => { this.trigger('viewLoaded'); });
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
        .classed('SvgTab', true)
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
}, true);
export { SvgGLView, SvgGLMixin };
