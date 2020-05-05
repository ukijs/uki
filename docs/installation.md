# Installation and Usage

## In the browser
Import it as a module (currently, there is no non-ES6 support):
```html
<script src="https://d3js.org/d3.v5.min.js"></script>
<script type="module" src="myScript.js"></script>
```
`myScript.js`:
```javascript
import { Model, View } from 'uki.esm.js';
```

Note that `uki.js` has **optional** dependencies that it will auto-load on its
own from a CDN whenever it discovers that a needed library is missing.

Always needed:
- https://d3js.org/d3.v5.min.js
If you use LESS stylesheets:
- https://cdnjs.cloudflare.com/ajax/libs/less.js/3.11.1/less.min.js
If you use `goldenlayout` views:
- https://code.jquery.com/jquery-3.4.1.min.js
- https://golden-layout.com/files/latest/js/goldenlayout.min.js
If you use `google` models:
- https://apis.google.com/js/api.js

If your unsure what you're using, you can inspect the developer tools' Network
tab to see what `uki` is loading. When you know that you're using a part of
`uki` that relies on one of these dependencies, it's a good idea (but not
required) to include the library in your page for faster loading. For example,
if you have `View`s that have LESS resources, including `less.min.js` in the
page `<head>` will make your page load faster:

```html
<head>
  <script src="https://d3js.org/d3.v5.min.js"></script>
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/less.js/3.11.1/less.min.js" data-log-level="1"></script>
  <script type="module" src="myApp.js"></script>
</head>
```

This can also be important if you need control over the specific version of a
library that you want `uki` to use, as well as if you're making something that
needs to work offline, like an Electron app.

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
Of course, it doesn't make a ton of sense to use `uki.jj` outside of the
browser, but I realize it can still be important for testing purposes, etc. This
*should* also work, but, like bundle tool hell, use at your own risk:

```bash
npm install --save d3 uki
```
```javascript
const uki = require('uki');
```
