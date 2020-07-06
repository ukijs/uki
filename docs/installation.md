# Installation and Usage

## In the browser

### As an ES6 module
```html
<script src="https://d3js.org/d3.v5.min.js"></script>
<script type="module" src="myScript.js"></script>
```
`myScript.js`:
```javascript
import { Model, View } from 'uki.esm.js';
```

### As a global variable
```html
<script src="https://d3js.org/d3.v5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/uki@0.6.7/dist/uki.esm.js"></script>
<script type="module" src="myScript.js"></script>
```
`myScript.js`:
```javascript
/* globals uki */
class Example extends uki.Model {
  ...
}
```

### Optional dependencies
Note that `uki.js` has an **optional** dependency if you happen to load LESS
resources. `uki.js` will auto-load `less.js` on its own from a CDN if it
discovers that it is missing.

If you already know that a page will need to load LESS resources, it's a good
idea for performance reasons to include `less.js` in the page's `<head>`, to
avoid waiting when `uki.js` discovers that it needs to fetch it before rendering
something:

```html
<head>
  <script src="https://d3js.org/d3.v5.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/less.js/3.11.1/less.min.js" data-log-level="1"></script>
  <script type="module" src="myApp.js"></script>
</head>
```

This can also be important if you need control over the specific version of a
library that you want `uki` to use, as well as if you're making something that
needs to work offline, like an Electron app—for the latter, you would point to
a local copy of the library that you need.

## In Javascript bundle tool hell
One of the pipe dreams of `uki.js` is to enable a simpler coding workflow,
returning to native Javascript in the browser, with *ZERO BUILD STEPS* that
insist on a "right" way to do things.

But if you need to work with a bundler, at one point the following worked with
webpack as well as rollup (provided you have all the ES6/Babel magic properly
configured). However, I'm not actively testing this, so please file an issue if
you need it and it's not working.

```bash
npm install --save d3 uki
```
```javascript
import { Model, View } from 'uki';
```

## In Node.js
Of course, it doesn't make a ton of sense to use `uki.js` outside of the
browser, but I realize it can still be important for testing purposes, etc. This
*should* also work, but, like bundle tool hell, use at your own risk:

```bash
npm install --save d3 uki
```
```javascript
const uki = require('uki');
```
