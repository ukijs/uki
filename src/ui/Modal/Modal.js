import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { RestylableMixin } from '../Restylable/Restylable.js';
import { UkiButton } from '../UkiButton/UkiButton.js';
import defaultStyle from './style.less';
import template from './template.html';

const { ModalView, ModalMixin } = createMixinAndDefault('ModalMixin', View, superclass => {
  class ModalView extends RestylableMixin(superclass, defaultStyle, 'ModalView') {
    get defaultButtons () {
      return [
        {
          label: 'Cancel',
          className: 'cancel',
          onclick: () => { this.hide(); }
        },
        {
          label: 'OK',
          className: 'ok',
          selected: true,
          onclick: () => { this.hide(); }
        }
      ];
    }
    show (options = {}) {
      this.contents.html(options.content || '');
      this.setupButtons(options.buttons || this.defaultButtons);
      this.d3el.style('display', options.hide ? 'none' : null);
    }
    hide () {
      this.show({ hide: true });
    }
    setup () {
      super.setup();
      this.d3el
        .style('display', 'none')
        .html(template);

      this.contents = this.d3el.select('.contents')
        .classed(this.type, true);
      this.buttonWrapper = this.d3el.select('.buttonWrapper');

      this.setupButtons();
    }
    setupButtons (buttonSpecs = this.defaultButtons) {
      this.buttonWrapper.html('');
      for (const spec of buttonSpecs) {
        spec.d3el = this.buttonWrapper.append('div');
        const button = new UkiButton(spec);
        button.on('click', () => { spec.onclick.call(this); });
      }
    }
  }
  return ModalView;
});
export { ModalView, ModalMixin };