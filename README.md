A minimal, d3-based Model-View framework.

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)

# What is this?
Yet another web framework ([why?](#why-another-framework)), specifically designed
to support building multiple linked view systems with [d3.js](https://d3js.org/).

# Documentation
Basic usage is to extend the `Model` and `View` classes with your own:
- [Models](./docs/models.md)
- [Views](./docs/views.md)
- [Installation and Usage](./docs/installation.md)
- [Examples](./docs/examples.md)
  - If you're familiar with d3, the [les miserables example](https://github.com/ukijs/uki/tree/main/examples/miserables) should be somewhat self-explanatory.

# Why another framework?
I rolled this together after lots of frustration with existing MVC frameworks.
A major reason why [web development can be hell](https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f) boils down to "loading stuff is hard."

`uki.js` isn't necessarily better than anything else out there. But if any of
these things sound appealing, maybe it's worth trying out:

- **Zero** build steps required; relies on native ES6 imports + distributed, lazy resource retrieval
- Streamlines the process of loading resources (e.g. data files, API calls, or view-specific stylesheets / HTML / SVG template files)
- [Processing](https://processing.org/)-style (setup + draw) rendering pipeline that ensures that needed DOM elements and resources exist
- No extra syntax / template language / file formats to learn; only requires knowledge of JS, HTML, and CSS
- Mostly optional MVC philosophy—it can be used or ignored
- Composable [UI addon library](https://github.com/ukijs/uki-ui) includes standard components like tooltips, context menus, modals, and loading screens
- Integrations for GoldenLayout (and hopefully Observable and Vega soon); using them is often as simple as applying a Mixin
