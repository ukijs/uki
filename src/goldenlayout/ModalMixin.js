import IntrospectableMixin from '../../utils/IntrospectableMixin.js';

const ModalMixin = function (superclass) {
  const Modal = class extends IntrospectableMixin(superclass) {
    constructor (d3el, resources = []) {
      resources.push(...[
        { type: 'less', url: './views/common/ModalMixin.less' },
        { type: 'text', url: './views/common/ModalMixinTemplate.html', name: 'ModalMixinTemplate' }
      ]);
      super(d3el, resources);
    }
    get buttons () {
      return [
        {
          label: 'Cancel',
          className: 'cancel',
          onclick: () => { this.cancel(); }
        },
        {
          label: 'OK',
          className: 'ok',
          selected: true,
          onclick: () => { this.ok(); }
        }
      ];
    }
    cancel () {
      window.controller.hideModal();
    }
    ok () {
      window.controller.hideModal();
    }
    setup () {
      super.setup();
      this.d3el.attr('class', `ModalMixin`)
        .html(this.getNamedResource('ModalMixinTemplate'));

      this.contents = this.d3el.select('.contents')
        .classed(this.type, true);
      this.buttonWrapper = this.d3el.select('.buttonWrapper');

      let buttons = this.buttonWrapper.selectAll('.button').data(this.buttons);
      buttons.exit().remove();
      const buttonsEnter = buttons.enter().append('div')
        .attr('class', d => d.className)
        .classed('button', true);
      buttons = buttons.merge(buttonsEnter);

      buttonsEnter.append('a');
      buttonsEnter.append('img');
      buttons.select('img')
        .style('display', d => d.img ? null : 'none')
        .attr('src', d => d.img || null);
      buttonsEnter.append('div')
        .classed('label', true);
      buttons.select('.label')
        .text(d => d.label || null);

      buttons.classed('selected', d => d.selected)
        .classed('disabled', d => d.disabled)
        .on('click', d => d.onclick());
    }
  };
  Modal.prototype._instanceOfModalMixin = true;
  return Modal;
};
Object.defineProperty(ModalMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfModalMixin
});
export default ModalMixin;
