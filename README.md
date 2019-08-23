![uki.js](https://github.com/alex-r-bigelow/uki/blob/master/docs/teaser.svg)

A minimal, d3-based Model-View framework.

# What is this?
[bl.ocks](https://bl.ocks.org) are awesome and simple, but building more
complex / linked systems gets hairy.

`uki` is a framework to act as glue between bl.ock-esque views.

# Documentation
The basic idea is that you extend the `Model` and `View` classes with your own:
- [Models](./docs/models.md)
- [Views](./docs/views.md)
- [Installation and Usage](./docs/installation.md)
- [Examples](./docs/examples.md)

# What does this look like?
Ideally, you should be able to create visualizations with this kind of directory
structure (or, as paths are open-ended, you can use whatever structure you
want):

```
index.html
controller.js
lib/
  uki.esm.js
  d3.min.js
models/
  Graph/
    Graph.js
    miserables.json
views/
  NodeLinkView/
    NodeLinkView.js
    template.html
    style.css
```

**index.html**
```html
<!DOCTYPE html>
<html>
  <head>
    <script src="lib/d3.min.js"></script>
    <script src="controller.js" type="module"></script>
  </head>
  <body>
    <div id="nodeLinkView"></div>
  </body>
</html>
```

**controller.js**
```javascript
/* globals d3 */
import Graph from './models/Graph/Graph.js';
import NodeLinkView from './views/NodeLinkView/NodeLinkView.js';

const miserables = new Graph();
const nodeLinkView = new NodeLinkView(miserables);
window.onload = () => {
  nodeLinkView.render(d3.select('#nodeLinkView'))
};
window.onresize = () => {
  nodeLinkView.render();
};
```

**Graph.js**
```javascript
import { Model } from '../lib/uki.esm.js';
class Graph extends Model {
  constructor () {
    super([
      { type: 'json', url: '/models/Graph/miserables.json' }
    ]);
    this.highlightedNode = null;
  }
  highlightNode (node) {
    this.highlightedNode = node;
    this.trigger('highlight');
  }
}
```

**NodeLinkView.js**
```javascript
import { View } from '../lib/uki.esm.js';
class NodeLinkView extends View {
  constructor (graph) {
    super(null, [
      { type: 'text', url: '/views/NodeLinkView/template.html' },
      { type: 'css', url: '/views/NodeLinkView/style.css' }
    ]);
    this.graph = graph;
    this.graph.on('highlight', () => { this.render(); });
  }
  setup () {
    // The contents of template.html are put into the #nodeLinkView div exactly
    // once
    this.d3el.html(this.resources[0]);
  }
  draw () {
    // d3.js force-directed graph drawing would go here; a fully-implemented
    // example coming soon!
  }
}
```

**template.html**
```html
<svg>
  <g id="linkLayer"></g>
  <g id="nodeLayer"></g>
</svg>
```

**style.css**
```css
.linkLayer path {
  stroke-width: 1px;
  stroke: #666666;
}
.nodeLayer circle {
  fill: #333333;
}
```

# Why another framework?
I rolled this together after lots of frustration with existing MVC frameworks
(Angular and Backbone, I'm looking at you) that really constrain what you do,
force you to read a ton of documentation, and make you drink their particular
philosophical kool-aid—only to help you do some simple things.

I don't claim this is better than anything else out there. But if any of these
things sound appealing, maybe it's worth trying out:

- Helps simplify the process of connecting different, existing views (e.g. from
  [bl.ocks.org](https://bl.ocks.org/)) together in a linked view system
- Simplifies some of the issues of loading / fetching non-Javascript resources
  (e.g. CSV files, API calls, CSS stylesheets) in a way that *should* give you
  more control over directory structures (e.g. if, like me, you like to have all
  the JS, CSS, template HTML / SVG, and data files pertaining to a view in a
  common directory)
- Simplifies some of the setup / timing issues common to working with d3 (e.g.
  setup vs update functions, making sure things render only after needed
  resources have been loaded, etc)
- Support for custom, d3-style, namespaced, non-blocking events
