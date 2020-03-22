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

- [D3.js native formats](#D3_js_native_formats)
- [Stylesheets](#Stylesheets)
- [Raw fetch requests](#Raw_fetch_requests)
- [Generic Promises](#Generic_Promises)

### D3.js native formats
All of [d3's supported
formats](https://github.com/d3/d3-fetch/blob/v1.1.2/README.md#csv) can be
imported as a resource. For each d3 type, use the `url` key in place of its
`input` parameter, and additional arguments, such as `delimiter`, `init`, and
`row` should be supplied with the respective key, e.g.:

```javascript
class MyModel extends Model {
  constructor() {
    super([
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
          }
        }
      }
    ]);
  }
  setup () {
    // This logs the contents of cars.csv, reformatted according to the row
    // function
    console.log(this.resources[0]);
  }
}
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

You can embed `CSS` and `LESS` stylesheets into the page's header by referring
to them as resources as well. This probably make the most sense in the
[context of a view](../README.md#What_does_this_look_like), but you can
technically load anything from a model if that's what your use case requires.

`uki` will avoid loading the same stylesheet more than once, even if it's loaded
as a resource from multiple places.

Note that to use LESS stylesheets, `less` will need to be in the global scope
before this will work. The easiest way to do this is usually something like
this:

```html
<head>
  <script type="text/javascript" src="node_modules/less/dist/less.min.js" data-log-level="1"></script>
  <script type="module" src="myApp.js"></script>
</head>
```

Some examples:
- CSS

  `{ type: 'css', url: 'http://path/to/some/file.css' }`

- LESS

  `{ type: 'less', url: 'http://path/to/some/file.less' }`

### Raw fetch requests

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
  setup () {
    // Setup won't be called until this.resources[0] resolves
    console.log('this will never be called', this.resources[0]);
  }
}
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
