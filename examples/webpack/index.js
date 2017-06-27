import * as d3 from './d3.bundle';
import { View } from 'uki';

class CustomView extends View {
  setup (d3el) {
    d3el.append('p');
  }
  draw (d3el) {
    d3el.select('p').text('Hello, world!');
  }
}

window.myView = new CustomView();
window.myView.render(d3.select('#myView'));
