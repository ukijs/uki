import { Model } from '../../uki.esm.js';
class Graph extends Model {
  constructor () {
    super({
      resources: [
        { type: 'json', url: '/models/Graph/miserables.json', name: 'miserables' }
      ]
    });
    this.highlightedNode = null;

    // this.ready is a Promise that resolves once all of the resources have
    // been loaded
    this.ready.then(() => {
      const rawData = this.getNamedResource('miserables');
      this.nodes = rawData.nodes;
      this.links = rawData.links;
    });
  }
  highlightNode (node) {
    this.highlightedNode = node;
    this.trigger('highlight');
  }
}
export default Graph;
