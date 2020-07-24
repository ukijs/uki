/* globals d3 */
import * as uki from '../uki.esm.js';

class CustomView extends uki.View {
  setup () {
    this.d3el.append('p');
  }

  draw () {
    this.d3el.select('p')
      .text('Hello, world!');
  }
}

window.testView = new CustomView({ d3el: d3.select('#myView') });
window.onload = () => {
  window.testView.render();
};
