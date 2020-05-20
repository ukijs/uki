/* globals d3 */
import { goldenlayout, ui, View } from '../uki.esm.js';

/*
 * WARNING: The capabilities in this example are still totally undocumented and
 * prone to rapid revision + breaking changes; use at your own risk!!
 */

/* eslint-disable indent */
class BasicDemoView extends ui.LoadingMixin(
                            ui.EmptyStateMixin(goldenlayout.GLView)) {
  constructor (options) {
    options.resources = [{
      type: 'text',
      url: 'lipsum.html',
      name: 'lipsum'
    }];
    super(options);
  }
  setup () {
    super.setup();
    this.d3el.html(this.getNamedResource('lipsum'))
      .style('color', 'rgba(0,0,0,0.2)');
  }
  getEmptyMessage () {
    return `This is a basic view; by default its contents scroll.`;
  }
}

class ModalLauncherView extends goldenlayout.GLView {
  setup () {
    super.setup({ lessArgs: { modifyVars: {
      '@contentPadding': '2em'
    } } });
    this.d3el.style('padding', '1em');
    let count = 0;
    const button = new ui.UkiButton({
      d3el: this.d3el.append('div'),
      label: 'Show Modal'
    });
    const modalResult = this.d3el.append('div');
    button.on('click', () => {
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
    });
  }
}

class SvgDemoView extends ui.LoadingMixin(
                          ui.EmptyStateMixin(goldenlayout.SvgView)) {
  getEmptyMessage () {
    return `This is an SVG view`;
  }
  setup () {
    super.setup();
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

class IFrameView extends ui.LoadingMixin(
                         ui.EmptyStateMixin(
                         goldenlayout.IFrameMixin(goldenlayout.GLView))) {
  constructor (options) {
    options.src = 'https://www.xkcd.com';
    super(options);
  }
  getEmptyMessage () {
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

class ModalView extends ui.ModalMixin(View) {
  setup () {
    super.setup();
    this.contents.text('This is a modal!');
  }
}

window.rootView = new RootView({ d3el: d3.select('#glRoot') });
window.modal = new ModalView({ d3el: d3.select('#modalView') });
