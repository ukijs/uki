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

## In Javascript bundle tool hell
At one point this worked with webpack as well as rollup (provided you have all
the ES6 babel magic properly configured), but I'm not actively testing this;
please file an issue if you need it and it's not working:

```bash
npm install --save d3 uki
```
```javascript
import { Model, View } from 'uki';
```

## In Node.js
Of course, it doesn't make a ton of sense to use uki outside of the browser,
but I realize it can still be important for testing purposes, etc. This *should*
also work, but, like bundle tool hell, use at your own risk:

```bash
npm install --save d3 uki
```
```javascript
const uki = require('uki');
```
