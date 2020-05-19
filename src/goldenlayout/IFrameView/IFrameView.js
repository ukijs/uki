import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import FixedGLViewMixin from '../FixedGLView/FixedGLViewMixin.js';
import { GLView } from '../GLView/GLView.js';
import { RestylableMixin } from '../../ui/Restylable/Restylable.js';
import defaultStyle from './style.less';

const { IFrameView, IFrameMixin } = createMixinAndDefault('IFrameMixin', GLView, superclass => {
  class IFrameView extends FixedGLViewMixin(RestylableMixin(superclass, defaultStyle, 'IFrameView')) {
    constructor (options) {
      options.fixedTagType = 'iframe';
      super(options);
      this._src = options.src;
      this.frameLoaded = !this._src; // We are loaded if no src is initially provided
    }
    get src () {
      return this._src;
    }
    set src (src) {
      this.frameLoaded = !src;
      this._src = src;
      this.d3el.select('iframe')
        .attr('src', this._src);
      this.render();
    }
    get isLoading () {
      return super.isLoading || !this.frameLoaded;
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
        .classed('IFrameTab', true)
        .append('div')
        .classed('linkIcon', true)
        .attr('title', 'Open in new tab')
        .on('click', () => {
          window.open(this._src, '_blank');
        });
    }
  }
  return IFrameView;
});
export { IFrameView, IFrameMixin };
