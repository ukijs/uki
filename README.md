uki
===

A minimal, d3-based Model-View library library that I use in my projects.
I rolled this together after lots of frustration with existing MVC frameworks that really constrain what you do and force you to read a ton of documentation---all to just help you do some simple things.
I don't claim this is better than any of them... but its code is short and it does so little, that it gets out of my way.

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

## In Javascript bundle tool hell:
```bash
npm install --save uki
```
```javascript
import { Model, View } from 'uki';
```

## In Node.js
(Of course, it doesn't make a ton of sense to use uki outside of the browser, but I realize it can still be important for testing purposes, etc)
```bash
npm install --save uki
```
```javascript
const uki = require('uki');
```

# Running examples
To see examples in action:
```bash
npm run example -- basic
npm run example -- resources
```

# Documentation

The basic idea is you extend the `Model` and `View` classes; you can assign and listen to custom events on one, the other, or both, depending on how you roll. Or ignore events if you want to manage state differently.

## Models
Models are meant to do one simple thing: enable non-blocking custom events *a la* the classic `.on('someEvent', callback)` pattern. Events are fired when you call `.trigger('someEvent', additional, payload, arguments)`

### Namespaced events
`uki` supports namespaced events; i.e.:
```javascript
myModel.on('someEvent.context1', () => { console.log('do one thing'); });
myModel.on('someEvent.context2', () => { console.log('do another thing'); });

myModel.trigger('someEvent');
/*
do one thing
do another thing
*/
myModel.off('someEvent.context1');
myModel.trigger('someEvent');
/*
do another thing
*/
```

### Sticky events
You can trigger events in a *sticky* way that combines triggers into fewer callbacks, while merging all parameters in a single object, i.e.:
```javascript
myModel.on('someEvent', paramObj => {
  console.log(JSON.stringify(paramObj, null, 2));
});

myModel.stickyTrigger('someEvent', { param1: 'one' });
myModel.stickyTrigger('someEvent', { param2: 'two' });
myModel.stickyTrigger('someEvent', { param1: 'override one' });
/*
{
  "param1": "override one",
  "param2": "two"
}
*/
```

## Views
`View`s should implement a `setup` and `draw` function (should feel sort of familiar to you [Processing](https://processing.org/) fans), but these functions shouldn't be called directly. Instead, you should call the view's `render` function.

Exactly when / how / how often you call `render` is up to you; internally, it's debounced, so you can fire it as much as you like without affecting performance.

### Other magic I'm considering adding:
- My GoldenLayout integrations?
- Introspectable?
- CSS hacks for re-coloring icons?

### Documentation TODOs:
- loading resources via the constructor
- talk about overriding an element's `d3el` object
- details of constructor, `setup`, and `draw` timing
- details about which auto-computed element bounds are available
- `queueAsync`

# Releasing a new version
A list of reminders to make sure I don't forget any steps:

- Update the version in package.json
- `npm run build`
- `git commit -a -m "commit message"`
- `git tag -a #.#.# -m "tag annotation"`
- `git push --tags`
- `npm publish`
- (maybe optional) Edit / document the release on Github
