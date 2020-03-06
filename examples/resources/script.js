/* globals d3 */
import { View } from '../uki.esm.js';

class CustomView extends View {
  constructor (d3el) {
    super(d3el, [
      { type: 'less', url: 'style.less' },
      { type: 'csv', url: 'data.csv' }
    ]);
  }
  setup () {
    this.d3el.append('p');
    this.d3el.append('div')
      .classed('data', true);
  }
  draw () {
    this.d3el.select('p')
      .text('Hello, world!');
    this.d3el.select('.data')
      .selectAll('pre').data(this.resources[1])
      .enter().append('pre')
      .text(d => JSON.stringify(d, null, 2));
  }
}

window.testView = new CustomView();
window.testView.render(d3.select('#myView'));
