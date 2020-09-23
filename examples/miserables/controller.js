/* globals d3 */
import Graph from './models/Graph/Graph.js';
import NodeLinkView from './views/NodeLinkView/NodeLinkView.js';
import LabelView from './views/LabelView/LabelView.js';

const miserables = new Graph();
const nodeLinkView = new NodeLinkView(miserables);
const labelView = new LabelView(miserables);

window.onload = () => {
  nodeLinkView.render(d3.select('#nodeLinkView'));
  labelView.render(d3.select('#labelView'));
};
window.onresize = () => {
  nodeLinkView.trigger('resize');
};
