import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { IFrameViewMixin } from '../../ui/IFrameView/IFrameView.js';
import { GLView } from '../GLView/GLView.js';
import linkIcon from './link.svg';

const { IFrameGLView, IFrameGLViewMixin } = createMixinAndDefault({
  DefaultSuperClass: GLView,
  classDefFunc: SuperClass => {
    class IFrameGLView extends IFrameViewMixin(SuperClass) {
      constructor (options) {
        options.icons = [{
          svg: linkIcon,
          onclick: () => {
            this.openAsTab();
          }
        }];
        super(options);
      }
      setupD3El () {
        return this.glEl.append('iframe');
      }
    }
    return IFrameGLView;
  }
});
export { IFrameGLView, IFrameGLViewMixin };
