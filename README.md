![uki.js](https://github.com/ukijs/uki/blob/main/docs/teaser.svg)

A minimal, d3-based Model-View framework.

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)

# What is this?
Yet another web framework ([why?](#why-another-framework)), originally designed
as a fast way to design maintainable, multiple linked visualizations from
[bl.ocks](https://bl.ocks.org).

Main selling point: **ZERO BUILD STEPS** means that there's nothing to configure.

# Documentation
Basic usage is to extend the `Model` and `View` classes with your own:
- [Models](./docs/models.md)
- [Views](./docs/views.md)
- [Installation and Usage](./docs/installation.md)
- [Examples](./docs/examples.md)

# What does this look like?
For a relatively small example of a multiple linked view system, check out the
[miserables example](https://github.com/ukijs/uki/tree/main/examples/miserables).

# Why another framework?
I rolled this together after lots of frustration with existing MVC frameworks.
Among these frustrations:
- Nasty build processes (e.g. webpack) that aren't really needed now that native
  ES6 imports are a thing. "Loading stuff is hard" shouldn't be a reason to
  [make web development hell for everyone](https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f).
- Introducing non-standard file formats and syntax that you have to learn,
  beyond what the browser already does natively—and in some cases, *re-learning*
  new variants of existing syntax that are subtly different (React, I'm looking
  at you).
- Non-optional philosophies. They have kool-aid, and make you drink it.
- Incompatibility with other frameworks / libraries (e.g. d3.js) that don't
  subscribe to those philosophies
- Cryptic, non-existent, or duplicate forms of documentation (some of which is
  out of date)
- Heavy-handed bindings between JS and the DOM. There's an enforced "right" way
  that it's supposed to be done, and if you want to do custom things (happens
  all the time when you're building custom visualizations), you usually end up
  having to poke inside / hack around the framework's source code.

... and all this, only to help you do some simple things.

`uki.js` isn't necessarily better than anything else out there. But if any of
these things sound appealing, maybe it's worth trying out:

- No build process required. Use native Javascript + HTML + CSS however you
  want. This also means that new people on your team can contribute
  meaningfully, and *not even be aware* that parts of the page use a framework
- Simplifies some of the issues of loading / fetching Javascript and
  non-Javascript resources (e.g. CSV files, API calls, CSS stylesheets, SVG
  templates) in a way that gives you more control over directory structures,
  load order, and knowing when it's finally safe to start drawing something
- Simplifies the process of connecting different, existing views (e.g. from
  [bl.ocks.org](https://bl.ocks.org/)) together in a linked view system
- Support for custom, d3-style, namespaced, non-blocking events
