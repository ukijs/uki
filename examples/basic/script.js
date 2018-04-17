import { View } from './uki.esm.js';

class CustomView extends View {
  setup () {
    this.d3el.append('p');
  }
  draw () {
    this.d3el.text('Hello, world!');
  }
}
export default new CustomView();
