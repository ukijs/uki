/* globals d3 */
import { goldenlayout, ui } from '../uki.esm.js';

const mixins = superclass => ui.LoadingViewMixin(ui.EmptyStateViewMixin(superclass));

class BasicDemoView extends mixins(goldenlayout.GLView) {
  getEmptyMessage () {
    return 'This is a basic view; its contents would scroll';
  }
}

class SvgDemoView extends mixins(goldenlayout.SvgViewMixin(goldenlayout.GLView)) {
  getEmptyMessage () {
    return 'This is an SVG view';
  }
}

class IFrameView extends mixins(goldenlayout.IFrameViewMixin(goldenlayout.GLView)) {
  constructor (options) {
    options.src = 'https://www.xkcd.com';
    super(options);
  }
  getEmptyMessage () {
    return 'This is an iframe view';
  }
}

class RootView extends goldenlayout.GLRootView {
  constructor () {
    super({
      d3el: d3.select('#myView'),
      viewClassLookup: {
        BasicDemoView,
        SvgDemoView,
        IFrameView
      },
      glSettings: {
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
            { type: 'component', componentName: 'BasicDemoView', componentState: {} },
            { type: 'component', componentName: 'SvgDemoView', componentState: {} },
            { type: 'component', componentName: 'IFrameView', componentState: {} }
          ]
        }]
      }
    });
  }
}

window.testView = new RootView();
window.onload = () => {
  window.testView.render();
};
