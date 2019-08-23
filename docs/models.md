Models
======

Models do two things:
1. Help you [import "resources,"](#Importing_resources) i.e. CSS style files,
   HTML / SVG template files, and/or API queries
2. Enable non-blocking [custom events](#Custom_events) *a la* the classic
   `myModel.on('someEvent', callback)` pattern. Events are fired when you call
   `myModel.trigger('someEvent', additional, payload, arguments)`

Feel free to use these however you like; ideally (as implied by the name), it's
probably a good idea to create a Model to represent a dataset, and/or shared
state across linked views.

# Importing resources
The only (optional) argument to a Model's constructor is an array of resources
that are loaded, and the resulting parsed resources become available under the
`.resources` property once the `.ready` promise resolves.

Each entry in the array should be an `Object` with `type` and `url` properties,
for example:

```javascript
class MyModel extends Model {
  constructor() {
    super([
      { type: 'csv', url: './myData.csv' },
      { type: 'json', url: './myConfiguration.json' }
    ]);
  }
}

...

const myModel = new MyModel();
await myModel.ready;

console.log(myModel.resources[0]);
// Logs the parsed contents of myData.csv
```

## Supported `type`s
All of [d3's supported
formats](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#csv) can be
imported as a resource, as well as embedding `CSS` and `LESS` stylesheets into
the page's header (the latter of which probably make the most sense in the
[context of a view](../README.md#What_does_this_look_like), but you can technically load
anything from a model if that's what your use case requires).

# Custom events
`uki` lets you create your own custom events that should feel similar to d3's
native ones.

## Namespaced events
Like d3, `uki` supports namespaced events, to help with things like removing
listeners that you no longer want; i.e.:
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
You can trigger events in a *sticky* way that combines triggers into fewer
callbacks, while merging all parameters in a single object, i.e.:
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
