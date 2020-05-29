import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';
import recolorImageFilter from '../../utils/recolorImageFilter.js';

const { UkiButton, UkiButtonMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class UkiButton extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'UkiButton'
    }) {
      constructor (options) {
        super(options);

        this._size = options.size;
        this._label = options.label;
        this._img = options.img;
        this._disabled = options.disabled || false;
        this._selected = options.selected || false;
        this._badge = options.badge;
      }
      set size (value) {
        this._size = value;
        this.render();
      }
      get size () {
        return this._size;
      }
      set label (value) {
        this._label = value;
        this.render();
      }
      get label () {
        return this._label;
      }
      set img (value) {
        this._img = value;
        this.render();
      }
      get img () {
        return this._img;
      }
      set disabled (value) {
        this._disabled = value;
        this.render();
      }
      get disabled () {
        return this._disabled;
      }
      set selected (value) {
        this._selected = value;
        this.render();
      }
      get selected () {
        return this._selected;
      }
      set badge (value) {
        this._badge = value;
        this.render();
      }
      get badge () {
        return this._badge;
      }
      setup () {
        super.setup(...arguments);
        recolorImageFilter();
        this.d3el.append('a');
        this.d3el.append('img')
          .style('display', 'none');
        this.d3el.append('div')
          .classed('label', true)
          .style('display', 'none');
        this.d3el.append('div')
          .classed('badge', true)
          .style('display', 'none');

        this.d3el.on('click', () => {
          if (!this.disabled) {
            this.trigger('click');
          }
        });
      }
      draw () {
        super.draw(...arguments);

        this.d3el
          .classed('small', this.size === 'small')
          .classed('tiny', this.size === 'tiny')
          .classed('selected', this.selected)
          .classed('disabled', this.disabled);

        this.d3el.select('img')
          .style('display', this.img ? null : 'none')
          .attr('src', this.img);

        this.d3el.select('.label')
          .classed('labelOnly', !this.img)
          .style('display', this.label === undefined ? 'none' : null)
          .text(this.label);

        this.d3el.select('.badge')
          .style('display', this.badge === undefined ? 'none' : null)
          .text(this.badge);
      }
    }
    return UkiButton;
  }
});
export { UkiButton, UkiButtonMixin };
