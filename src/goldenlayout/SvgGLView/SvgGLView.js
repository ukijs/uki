import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { SvgViewMixin } from '../../ui/SvgView/SvgView.js';
import { GLView } from '../GLView/GLView.js';
import download from './download.svg';

const { SvgGLView, SvgGLViewMixin } = createMixinAndDefault({
  DefaultSuperClass: GLView,
  classDefFunc: SuperClass => {
    class SvgGLView extends SvgViewMixin(SuperClass) {
      constructor (options) {
        options.icons = [{
          svg: download,
          onclick: () => {
            this.download();
          }
        }];
        super(options);
      }
      setupD3El () {
        return this.glEl.append('svg')
          .attr('src', this.src)
          .on('load', () => { this.trigger('viewLoaded'); });
      }
    }
    return SvgGLView;
  }
});
export { SvgGLView, SvgGLViewMixin };
