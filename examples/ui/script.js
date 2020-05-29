/* globals d3 */
import { goldenlayout, ui } from '../uki.esm.js';

/*
 * WARNING: The capabilities in this example are still totally undocumented and
 * prone to rapid revision + breaking changes; use at your own risk!!
 */

/* eslint-disable indent */
class BasicDemoView extends ui.LoadingViewMixin(
                            ui.EmptyStateViewMixin(goldenlayout.GLView)) {
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
    this.d3el.html(this.getNamedResource('lipsum'))
      .style('color', 'rgba(0,0,0,0.2)');
  }
  get emptyMessage () {
    return `This is a basic view; by default its contents scroll.`;
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
      for (const selected of [false, true]) {
        for (const showBadge of [false, true]) {
          for (const img of [undefined, 'openIcon.svg']) {
            for (const label of [undefined, 'Show Modal']) {
              const wrapper = this.d3el.append('div');
              for (const size of [undefined, 'small', 'tiny']) {
                this.createButton(wrapper, size, img, label, showBadge, disabled, selected);
              }
            }
          }
        }
      }
    }
  }
  createButton (wrapper, size, img, label, showBadge, disabled, selected) {
    const container = wrapper.append('div')
      .style('display', 'inline-block');
    let count = 0;
    const button = new ui.UkiButton({
      d3el: container.append('div'),
      label,
      img,
      size,
      badge: showBadge ? 0 : undefined,
      disabled,
      selected
    });
    const modalResult = container.append('div')
      .style('margin-top', '1em');
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
      window.tooltip.showContextMenu({
        targetBounds: this.getBoundingClientRect(),
        menuEntries: [
          { content: { label, img, size, badge: count, disabled, selected }, onClick: showModalFunc },
          { content: null },
          { content: 'Button properties',
            subEntries: [
            { content: 'badge: ' + (count === 0 && !showBadge ? 'hidden' : count) },
            { content: 'label: ' + (label || '(no label)') },
            { content: 'img: ' + (img || '(no img)') },
            { content: 'size: ' + (size || '(default)') },
            { content: 'selected: ' + selected.toString() },
            { content: 'disabled: ' + disabled.toString() }
          ] },
          { content: null },
          { content: 'Deep',
            subEntries: [{ content: 'Nested',
              subEntries: [{ content: 'Menu',
                subEntries: [{ content: 'Example' }]
              }] },
              { content: 'Nested',
                subEntries: [{ content: 'Menu',
                  subEntries: [{ content: 'Example' }]
                }] }]
          }
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
        .attr('cy', coords[1]);
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
      settings: {
        // GoldenLayout has a (really buggy) feature for popping a view out in a
        // separate browser window; I usually disable this unless there is a
        // clear user need
        showPopoutIcon: false
      },
      content: [{
        type: 'row',
        isCloseable: false,
        content: [
          {
            type: 'column',
            isCloseable: false,
            content: [
              { type: 'component', componentName: 'BasicDemoView', componentState: {} },
              { type: 'component', componentName: 'IFrameView', componentState: {} }
            ]
          },
          {
            type: 'column',
            isCloseable: false,
            content: [
              { type: 'component', componentName: 'SvgDemoView', componentState: {} },
              { type: 'component', componentName: 'ModalLauncherView', componentState: {} }
            ]
          }
        ]
      }]
    };
    super(options);
  }
}

window.rootView = new RootView({ d3el: d3.select('#glRoot') });
window.modal = new ui.ModalView({ d3el: d3.select('#modalLayer') });
window.tooltip = new ui.TooltipView({ d3el: d3.select('#tooltipLayer') });
