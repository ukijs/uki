/* globals d3 */
import { goldenlayout, ui } from '../uki.esm.js';

/*
 * WARNING: The capabilities in this example are still totally undocumented and
 * prone to rapid revision + breaking changes; use at your own risk!!
 */

/* eslint-disable indent */
class BasicDemoView extends ui.LoadingViewMixin(goldenlayout.GLView) {
  constructor (options) {
    options.resources = [{
      type: 'text',
      url: 'lipsum.html',
      name: 'lipsum'
    }];
    super(options);
  }
  setup () {
    super.setup(...arguments);
    this.d3el.html(this.getNamedResource('lipsum'));
  }
}

class ModalLauncherView extends goldenlayout.GLView {
  get title () {
    return 'Buttons, Tooltips, and Modals';
  }
  setup () {
    super.setup({ lessArgs: { modifyVars: {
      '@contentPadding': '2em'
    } } });
    this.d3el.style('padding', '1em');

    for (const disabled of [false, true]) {
      for (const primary of [false, true]) {
        for (const showBadge of [false, true]) {
          const wrapper = this.d3el.append('div');
          for (const img of [undefined, 'openIcon.svg']) {
            for (const label of [undefined, 'Show Modal']) {
              this.createButton(wrapper, img, label, showBadge, disabled, primary);
            }
          }
        }
      }
    }
  }
  createButton (wrapper, img, label, showBadge, disabled, primary) {
    const container = wrapper.append('div')
      .style('display', 'inline-block');
    let count = 0;
    const button = new ui.Button({
      d3el: container.append('div'),
      label,
      img,
      badge: showBadge ? 0 : undefined,
      disabled,
      primary
    });
    const modalResult = container.append('div')
      .style('position', 'absolute')
      .style('font-size', '0.5em')
      .style('margin-top', '-1em');
    const showModalFunc = () => {
      const buttons = window.modal.defaultButtons;
      buttons[1].onclick = function () {
        modalResult.text('Clicked OK');
        this.hide();
        count += 1;
        button.badge = count;
      };
      buttons[0].onclick = function () {
        modalResult.text('Clicked Cancel');
        this.hide();
        count -= 1;
        button.badge = count;
      };
      window.modal.show({
        content: `
          <div>This is an example modal</div>
          <div>It accepts arbitrary html</div>
        `,
        buttons
      });
    };
    button.on('click', showModalFunc);
    button.d3el.on('mouseenter', function () {
      const generateRandomEntries = length => {
        return Array.from({ length }, () => {
          const childLength = Math.floor(Math.random() * length / 2);
          const result = { content: childLength };
          if (childLength > 0) {
            result.subEntries = generateRandomEntries(childLength);
          }
          return result;
        });
      };

      window.tooltip.showContextMenu({
        targetBounds: this.getBoundingClientRect(),
        menuEntries: [
          { content: { label, img, badge: count, disabled, primary }, onClick: showModalFunc },
          { content: null },
          { content: 'Button properties',
            subEntries: [
            { content: 'badge: ' + (count === 0 && !showBadge ? 'hidden' : count) },
            { content: 'label: ' + (label || '(no label)') },
            { content: 'img: ' + (img || '(no img)') },
            { content: 'primary: ' + primary.toString() },
            { content: 'disabled: ' + disabled.toString() }
          ] },
          { content: null },
          { content: 'Random Submenu Test',
            subEntries: generateRandomEntries(100) }
        ]
      });
    });
  }
}

class SvgDemoView extends ui.LoadingViewMixin(
                          ui.EmptyStateViewMixin(goldenlayout.SvgGLView)) {
  get emptyMessage () {
    return `This is an SVG view`;
  }
  setup () {
    super.setup(...arguments);
    const circle = this.d3el.append('circle').attr('r', 20);
    this.d3el.on('mousemove', function () {
      const coords = d3.mouse(this);
      circle
        .attr('cx', coords[0])
        .attr('cy', coords[1])
        .style('fill', 'var(--text-color-softer)');
    });
  }
  drawFrame () {
    console.log('frame');
  }
}

class IFrameView extends ui.LoadingViewMixin(
                         ui.EmptyStateViewMixin(
                         goldenlayout.IFrameGLViewMixin(goldenlayout.GLView))) {
  constructor (options) {
    options.src = 'https://www.xkcd.com';
    super(options);
  }
  get emptyMessage () {
    return 'This is an iframe view';
  }
}

class RootView extends goldenlayout.GLRootView {
  constructor (options) {
    options.viewClassLookup = {
      BasicDemoView,
      SvgDemoView,
      IFrameView,
      ModalLauncherView
    };
    options.glSettings = {
      content: [{
        type: 'stack',
        isCloseable: false,
        content: [
          { type: 'component', componentName: 'BasicDemoView', componentState: {} },
          { type: 'component', componentName: 'IFrameView', componentState: {} },
          { type: 'component', componentName: 'SvgDemoView', componentState: {} },
          { type: 'component', componentName: 'ModalLauncherView', componentState: {} }
        ]
      }]
    };
    super(options);
  }
}

window.rootView = new RootView({ d3el: d3.select('#glRoot') });
window.modal = new ui.ModalView({ d3el: d3.select('#modalLayer') });
window.tooltip = new ui.TooltipView({ d3el: d3.select('#tooltipLayer') });
