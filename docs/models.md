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
You can give a `Model` an array of resources that will be loaded into the
browser as the `Model` is created (if they haven't been loaded already).
Resources are available from a `Model` once its `ready` Promise resolves.

```javascript
class MyModel extends Model {
  constructor() {
    super({
      resources: [
        { type: 'csv', url: 'myData.csv', name: 'My CSV Data' },
        { type: 'json', url: 'myConfiguration.json' }
      ]
    });
  }
}

(async () => {
  const myModel = new MyModel();
  await myModel.ready;

  console.log(myModel.getNamedResource('My CSV Data'));
  // Logs the parsed contents of myData.csv
})();
```

Where there is a parsed result (such as a CSV file), you can access it can be accessed through the
`this.resources` list (in the same order as the original `resources` option), or
you can give a string `name` to resources that you can use for
`getNamedResource()` access that doesn't depend on the order of that list.



Each entry in the array should be an `Object` with `type` and `url` properties,
for example:

```javascript
class MyModel extends Model {
  constructor() {
    super({
      resources: [
        { type: 'csv', url: 'myData.csv' },
        { type: 'json', url: 'myConfiguration.json' }
      ]
    });
  }
}

(async () => {
  const myModel = new MyModel();
  await myModel.ready;

  console.log(myModel.resources[0]);
  // Logs the parsed contents of myData.csv
})();
```

## Controlling resource load order
By default, all resources loaded in the constructor will be done asychronously,
with parallel requests. There are two options (`loadAfter` and `then`) and a
function (`loadLateResource`) that you can use for more fine-grained control
over the timing of loading resources.

### `loadAfter`
This option lets you tell `uki` not to load one resource until a list of other
named resources has finished loading:

```javascript
class MyModel extends Model {
  constructor() {
    super({
      resources: [
        { type: 'json', url: 'myConfiguration.json', name: 'config' },
        { type: 'csv', url: 'myData.csv', name: 'myData' },
        { type: 'js', url: 'someOtherScript.js', loadAfter: ['config', 'myData'] }
      ]
    });
  }
}
```

### `then`
This option lets you add additional processing after a resource's internal
Promise resolves:

```javascript
class MyModel extends Model {
  constructor() {
    super({
      resources: [
        {
          type: 'json',
          url: 'myConfiguration.json',
          name: 'config',
          storeOriginalResult: true,
          then: () => {
            console.log('config loaded');
            // Note that a return statement would be ignored, because
            // storeOriginalResult is set to true
          }
        },
        {
          type: 'csv',
          url: 'cars.csv',
          name: 'cars',
          then: result => {
            return result.map(row => {
              return {
                year: new Date(+d.Year, 0, 1),
                make: d.Make,
                model: d.Model,
                length: +d.Length
              };
            });
          }
        }
      ]
    });
  }
}

(async () => {
  const myModel = new MyModel();
  await myModel.ready;
  // config loaded

  console.log(myModel.getNamedResource('cars'));
  // ( logs the formatted version of cars.csv )
  console.log(myModel.getNamedResource('config'));
  // ( logs the contents of myConfiguration.json
  //   because storeOriginalResult was set to true )
})();
```

### `loadLateResource()`
All models can load resources outside of the constructor, however, these will
always load after the `ready` promise resolves.
```javascript
class myModel extends Model {
  constructor () {
    super({
      resources: [
        { type: 'csv', url: 'data.csv' }
      ]
    });
  }
  async loadStyles () {
    await this.loadLateResource({ type: 'less', url: 'conditionalStyle.less' });
  }
}
```


## Supported resource `type`s

- [D3.js native formats](#d3_js_native_formats)
- [Stylesheets](#stylesheets)
- [Other JS libraries](#other_js_libraries)
- [Fetch requests](#fetch_requests)
- [Generic Promises](#generic_promises)

### D3.js native formats
All of [d3's supported
formats](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#csv) can be
imported as a resource. For each d3 type, use the `url` key in place of its
`input` parameter, and additional arguments, such as `delimiter`, `init`, and
`row` should be supplied with the respective key, for example:

```javascript
class MyModel extends Model {
  constructor() {
    super({
      resources: [
        {
          type: 'dsv',
          delmiter: ',',
          url: 'http://some/other/server/cars.csv',
          init: {
            mode: 'no-cors'
          },
          row: d => {
            return {
              year: new Date(+d.Year, 0, 1),
              make: d.Make,
              model: d.Model,
              length: +d.Length
            };
          }
        }
      ]
    });
  }
}

(async () => {
  const myModel = new MyModel();
  await myModel.ready;

  console.log(myModel.resources[0]);
  // Logs the parsed contents of cars.csv, reformatted according to the row
  // function
})();
```

Some more specific examples:
- [Blob](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#blob)

  `{ type: 'blob', url: 'http://path/to/some/file.png' }`

- [Buffer](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#buffer)

  `{ type: 'buffer', url: 'http://path/to/some/file.tiff' }`

- [CSV](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#csv)

  `{ type: 'csv', url: 'http://path/to/some/file.csv' }`

- [DSV](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#dsv)

  `{ type: 'dsv', delimiter: '|', url: 'http://path/to/some/file.dsv' }`

- [HTML](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#html)

  `{ type: 'html', url: 'http://path/to/some/file.html' }`

- [Image](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#image)

  `{ type: 'image', url: 'http://path/to/some/file.png' }`

- [JSON](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#json)

  `{ type: 'json', url: 'http://path/to/some/file.json' }`

- [SVG](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#svg)

  `{ type: 'svg', url: 'http://path/to/some/file.svg' }`

- [Text](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#text)

  `{ type: 'text', url: 'http://path/to/some/file.txt' }`

- [TSV](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#tsv)

  `{ type: 'tsv', url: 'http://path/to/some/file.tsv' }`

- [XML](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#xml)

  `{ type: 'xml', url: 'http://path/to/some/file.xml' }`


### Stylesheets

You can embed `CSS` and `LESS` stylesheets into the page's `<head>` by referring
to them as resources as well. This probably makes the most sense in the [context
of a View](../README.md#what_does_this_look_like) (`View`s extend the `Model`
class), but you can technically load anything from a `Model` if that's what your
use case requires.

`uki` will avoid loading the same stylesheet more than once, even if it's loaded
as a resource by multiple `Model`s.

Some examples:
- CSS

  `{ type: 'css', url: 'http://path/to/some/file.css' }`

- LESS

  `{ type: 'less', url: 'http://path/to/some/file.less' }`

### Other JS libraries

Similar to stylesheets, you can inject scripts into the page's `<head>` directly
from a model as a resource as well. Although `uki` will try to avoid loading
the same script twice on its own, it's still usually a good idea to check if
the needed library has already been loaded first:

```javascript
class MyModel extends Model {
  constructor (options = {}) {
    options.resources = options.resources || [];

    // Only add jQuery as a resource if it's not available
    if (!window.jQuery) {
      options.resources.push({
        type: 'js',
        url: 'https://code.jquery.com/jquery-3.4.1.min.js',
        extraAttributes: {
          integrity: 'sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=',
          crossorigin: 'anonymous'
        },
        name: 'jQuery'
      });
    }
  }
}
```

### Fetch requests

`{ type: 'fetch', url: 'http://some/other/server/cars.csv', init: { mode: 'no-cors' }}`

### Generic Promises

```javascript
class MyModel extends Model {
  constructor() {
    super([
      new Promise((resolve, reject) => {
        // ...
      })
    ]);
  }
}

(async () => {
  const myModel = new MyModel();
  await myModel.ready;

  // myModel.ready won't resolve until this.resources[0] does
  console.log('this will never be logged', this.resources[0]);
})();
```

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
