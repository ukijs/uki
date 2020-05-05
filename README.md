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
    super({ resources: [
      { type: 'json', url: '/models/Graph/miserables.json' }
    ] });
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
    super({ resources: [
      { type: 'text', url: '/views/NodeLinkView/template.html', name: 'template' },
      { type: 'css', url: '/views/NodeLinkView/style.css' }
    ] });
    this.graph = graph;
    this.graph.on('highlight', () => { this.render(); });
  }
  setup () {
    // The contents of template.html are put into the #nodeLinkView div exactly
    // once
    this.d3el.html(this.getNamedResource('template'));
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
I rolled this together after lots of frustration with existing MVC frameworks.
Among these frustrations:
- Limited vision; frameworks often constrain what a web app can even be
- Cryptic, non-existent, or duplicate forms of documentation (some of which is
  out of date)
- Non-optional philosophies—they have kool-aid, and make you drink it
- Incompatibility with other frameworks / libraries (e.g. d3.js) that don't
 subscribe to those philosophies
- Nasty build processes (e.g. webpack) that aren't really needed now that native
  ES6 imports are a thing
- Introducing non-standard syntax that you have to learn beyond what the browser
  already does natively—and in some cases, *re-learning* new variants of
  existing syntax that are subtly different (React, I'm looking at you)
... and all this, only to help you do some simple things.

I don't claim this is better than anything else out there. But if any of these
things sound appealing, maybe it's worth trying out:

- No build process required. Use native Javascript + HTML + CSS however you want
- Simplifies some of the issues of loading / fetching Javascript and
  non-Javascript resources (e.g. CSV files, API calls, CSS stylesheets, SVG
  templates) in a way that gives you more control over directory structures,
  load order, and knowing when it's finally safe to start drawing something
- Simplifies the process of connecting different, existing views (e.g. from
  [bl.ocks.org](https://bl.ocks.org/)) together in a linked view system
- Support for custom, d3-style, namespaced, non-blocking events
