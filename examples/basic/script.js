/* globals d3 */
import { View } from '../uki.esm.js';

class CustomView extends View {
  setup () {
    this.d3el.append('p');
  }
  draw () {
    this.d3el.select('p')
      .text('Hello, world!');
  }
}

window.testView = new CustomView();
window.onload = () => {
  window.testView.render(d3.select('#myView'));
};
