import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { ParentSizeMixin } from '../ParentSize/ParentSize.js';
import View from '../../View.js';

const { IFrameView, IFrameMixin } = createMixinAndDefault('IFrameMixin', View, superclass => {
  class IFrameView extends ParentSizeMixin(superclass) {
    constructor (options) {
      super(options);
      this._src = options.src;
      this.frameLoaded = !this._src; // We are loaded if no src is initially provided
    }
    setup () {
      super.setup();
      this.d3el
        .on('load', () => { this.trigger('viewLoaded'); })
        .attr('src', this.src);
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
    openAsTab () {
      window.open(this._src, '_blank');
    }
  }
  return IFrameView;
}, true);
export { IFrameView, IFrameMixin };
