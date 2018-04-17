uki
===

A minimal, d3-based Model-View library library that I use in my projects.
I rolled this together after lots of frustration with existing MVC frameworks that really constrain what you do and force you to read a ton of documentation---all to just help you do something simple.
I don't claim this is better than any of them... but its code is short and it does so little, that it gets out of my way.

Installation and Usage
======================
To use in the browser, you should import it [from a module](https://github.com/alex-r-bigelow/uki/blob/master/examples/basic/script.js).

If you're playing with Javascript build chain hell:

```bash
npm install --save uki
```
and
```javascript
import { Model, View } from 'uki';
```
should just work.

Note that, currently, there is no non-ES6 support. Let me know if you're actually using this and need it, and I can try to cook up a build.

Running examples
================
To see the example in action (currently just have `basic`):
```bash
npm run example -- basic
```

Documentation
=============

The basic idea is you extend the `Model` and `View` classes; you can assign and listen to custom events on one, the other, or both, depending on how you roll. Or ignore events if you want to manage state differently.

## Models
Models are meant to do one simple thing: enable non-blocking custom events *a la* the classic `.on('someEvent', callback)` pattern. Events are fired when you call `.trigger('someEvent', additional, payload, arguments)`;

There is one extra feature, in that you can trigger events in a *sticky* fashion, i.e.:
```javascript
myModel.on('someEvent', paramObj => {
  console.log(JSON.stringify(paramObj, null, 2));
});

myModel.stickyTrigger('someEvent', { param1: 'one' });
myModel.stickyTrigger('someEvent', { param2: 'two' });
```
would result in a *single* callback:
```json
{
  "param1": "one",
  "param2": "two"
}
```

## Views
`View`s should implement a `setup` and `draw` function (should feel sort of familiar to you [Processing](https://processing.org/) fans), but these functions shouldn't be called directly. Instead, you should call the view's `render` function.

Exactly when / how / how often you call `render` is up to you; internally, it's debounced, so you can fire it as much as you like without affecting performance.

### Documentation TODOs:
- d3 file loading via the constructor
- talk about overriding an element's `d3el` object
- details of constructor, `setup`, and `draw` timing
- details about which auto-computed element bounds are available

## Details
For more details, read [the source code](https://github.com/alex-r-bigelow/uki/blob/master/src) itself; it's deliberately small!
