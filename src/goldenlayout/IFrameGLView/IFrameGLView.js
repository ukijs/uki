/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { IFrameMixin } from '../../ui/IFrameView/IFrameView.js';
import { GLView } from '../GLView/GLView.js';
import { RestylableMixin } from '../../ui/Restylable/Restylable.js';
import defaultStyle from './style.less';

const { IFrameGLView, IFrameGLMixin } = createMixinAndDefault('IFrameGLMixin', GLView, superclass => {
  class IFrameGLView extends IFrameMixin(RestylableMixin(superclass, defaultStyle, 'IFrameGLView')) {
    setupD3El () {
      return this.glEl.append('iframe');
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
        .classed('IFrameTab', true)
        .append('div')
        .classed('linkIcon', true)
        .attr('title', 'Open in new tab')
        .on('mousedown', () => {
          d3.event.stopPropagation();
        })
        .on('mouseup', () => {
          this.openAsTab();
        });
    }
  }
  return IFrameGLView;
}, true);
export { IFrameGLView, IFrameGLMixin };
