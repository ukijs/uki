/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { IFrameViewMixin } from '../../ui/IFrameView/IFrameView.js';
import { GLView } from '../GLView/GLView.js';
import { ThemeableMixin } from '../../style/ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';

const { IFrameGLView, IFrameGLViewMixin } = createMixinAndDefault({
  DefaultSuperClass: GLView,
  classDefFunc: SuperClass => {
    class IFrameGLView extends IFrameViewMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'IFrameGLView', cnNotOnD3el: true
    })) {
      setupD3El () {
        return this.glEl.append('iframe');
      }
      setupTab () {
        super.setupTab();
        this.glTabEl
          .classed('IFrameGLTab', true)
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
  }
});
export { IFrameGLView, IFrameGLViewMixin };
