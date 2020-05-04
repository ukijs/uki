/* globals d3 */
import { goldenlayout, ui } from '../uki.esm.js';

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
    super.setup();
    this.d3el.html(this.getNamedResource('lipsum'))
      .style('color', 'rgba(0,0,0,0.2)');
  }
  getEmptyMessage () {
    return `This is a basic view; by default its contents scroll.`;
  }
}

class SvgDemoView extends ui.LoadingViewMixin(
                          ui.EmptyStateViewMixin(
                          goldenlayout.SvgViewMixin(goldenlayout.GLView))) {
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

class IFrameView extends ui.LoadingViewMixin(
                         ui.EmptyStateViewMixin(
                         goldenlayout.IFrameViewMixin(goldenlayout.GLView))) {
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
