/* globals d3 */
import { View } from '../../uki.esm.js';

class NodeLinkView extends View {
  constructor (graph) {
    super({
      resources: [
        { type: 'text', url: '/views/NodeLinkView/template.html', name: 'template' },
        { type: 'css', url: '/views/NodeLinkView/style.css' }
      ]
    });
    this.graph = graph;
    this.graph.on('highlight', () => { this.render(); });
  }

  async setup () {
    // setup() will usually only be called once

    // Put the contents of template.html into the #nodeLinkView div
    this.d3el.html(this.getNamedResource('template'));

    // Ensure that the graph has loaded before we start drawing anything
    await this.graph.ready;

    // Initialize the force-directed simulation
    this.simulation = d3.forceSimulation(this.graph.nodes)
      .force('link', d3.forceLink(this.graph.links).id((d, i) => i))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter());

    // Create the drag behavior
    this.dragBehavior = d3.drag()
      .on('start', (event, d) => {
        if (!event.active) {
          this.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
        this.graph.highlightNode(d);
      }).on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      }).on('end', (event, d) => {
        if (!event.active) {
          this.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
      });

    this.on('resize', () => {
      this.simulation.alphaTarget(0.3).restart();
      this.render();
    });
  }

  async draw () {
    // Temporarily set the SVG's size to zero so that it doesn't affect the
    // calculation of available space as determined by CSS
    const svg = this.d3el.select('svg')
      .attr('width', 0)
      .attr('height', 0);

    const bounds = this.getBounds();

    // Update the bounds of the view to match the current window size
    svg
      .attr('width', bounds.width)
      .attr('height', bounds.height);

    // Update the simulation center force as well
    this.simulation.force('center')
      .x(bounds.width / 2)
      .y(bounds.height / 2);

    // Draw the link layer
    const links = svg.select('.linkLayer')
      .selectAll('.link').data(this.graph.links)
      .join('path')
      .classed('link', true);

    // Draw the node layer
    const nodes = svg.select('.nodeLayer')
      .selectAll('.node').data(this.graph.nodes)
      .join('circle')
      .classed('node', true)
      .attr('r', 5)
      .call(this.dragBehavior);

    // Update link and node positions
    this.simulation.on('tick', () => {
      links
        .attr('d', d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`);

      nodes
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    // Apply a class name to the currently highlighted node, if there is one
    nodes.classed('highlighted', d => d === this.graph.highlightedNode);
  }
}
export default NodeLinkView;
