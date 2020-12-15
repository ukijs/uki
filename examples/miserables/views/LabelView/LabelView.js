import { View } from '../../uki.esm.js';

class LabelView extends View {
  constructor (graph) {
    super({
      resources: [
        { type: 'css', url: '/views/LabelView/style.css' }
      ]
    });
    this.graph = graph;
    this.graph.on('highlight', () => { this.render(); });
  }

  async draw () {
    // Draw the currently highlighted node name, or clear the contents if
    // nothing is selected
    this.d3el.text(this.graph.highlightedNode?.name || '');
  }
}
export default LabelView;
