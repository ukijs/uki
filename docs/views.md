Views
=====

Views can do everything Models can do, as well as:
1. Abstracts away some of the worries about the timing and context of
  [rendering views](#Rendering).
2. Provides / updates some [basic statistics](#Drawing_statistics) that are
   commonly used in designing custom visual interfaces

# Setting up views
Like `Model`, the `View` is designed to be overridden with your custom code. For
views, you should override the `setup` and/or `draw` functions (should feel sort
of familiar to [Processing](https://processing.org/) fans). Typically, you won't
call these functions directly (though nothing will break if you do); instead,
you will call the view's `render()` function to tell it to initialize or update
itself.

## Creating views

To instantiate a view, you need to give it a d3-selected DOM element *at some
point*, that will be available to `setup` and `draw` calls as `this.d3el`. You
can do this during initialization, or as an argument to any subsequent
`render()` call. For example:

```javascript
class MyView extends View {
  setup () {
    this.d3el.html('<p>Called setup, but not draw yet...</p>')
  }
  draw () {
    this.d3el.select('p')
      .text('...just called draw!')
  }
}

const view1 = new MyView(d3.select('#view1'));
const view2 = new MyView();

view1.render();
view2.render();

// At this point, view1 will have drawn its contents, but view2 is waiting for
// a DOM element

view2.render(d3.select('#view2'));
// Now view2 will have drawn
```

## Rendering
Exactly when / how / how often you call `render` is up to you. In general, you
shouldn't need to worry about doing it too often (even if your `draw()` function
is somewhat expensive), as `setup()` is only called once, and `draw()` will be
debounced—meaning that you can fire it as much as you like without affecting
performance.

`render()` also returns a Promise that resolves when `draw()` is finally
complete.

A common pattern for larger apps is to listen to specific model changes,
and update when those changes are relevant, e.g.:

```javascript
class MyModel extends Model () {
  externalUpdate () {
    // ...
    this.trigger('update');
  }
}

class MyView extends View () {
  constructor (d3el, sharedState) {
    super(d3el, []);

    this.sharedState = sharedState;
    this.sharedState.on('update', () => { this.render(); });
  }
}

const state = new MyModel();
const view = new MyView(d3.select('#view'), state);

state.externalUpdate();
// view will update itself after this call
```

## Setup functions
`setup` functions are designed for cases where you want to initially create some
DOM scaffolding, or initialize things like scales that don't change. Basically,
anything that should only happen once should probably go in `setup`.

`setup` will be called immediately, and *exactly once*, after these three
conditions are met (in any order):
- Any [resources](./models.md#Importing_resources) the view has requested have
  finished loading
- The view has been [assigned a DOM element](#Creating_views)
- [render](#Rendering) has been called at least once

If, for some reason, you need `setup` to be called again, you can set a `dirty`
flag to `true`:

```javascript
myView.dirty = true;
myView.render();
```

Also, if you ever replace the assigned DOM element, `setup` will be called
again:

```javascript
myView.render(d3.select('#view1'));
// If this is the first time myView has rendered to #view1, setup() will be called

myView.render(d3.select('#view2'));
// setup() will be called again on the new element. Note that at this point,
// myView will only render to #view2, and ignore #view1
```

## Draw functions
`draw()` is where the meat of your d3 code should go, and a good habit is to
use d3 `update` selections here as much as possible to avoid the classic `enter`
vs `update` bugs that d3 developers frequently encounter.

In the event that you want to fine-tune the rate at which `draw()` is debounced,
you can tweak the `debounceWait` property of a view:

```javascript
class MyView extends View {
  constructor (d3el, resources) {
    super(d3el, resources);
    this.debounceWait = 10000;
  }
}

const view = new MyView(d3.select('#view'));
view.render();
// Do something expensive here that lasts less than 10 seconds
view.render();
// There should only be one call to draw()
```

# Drawing statistics
For visual design, some statistics are often inconsistent across browsers and
operating systems. For convenience, the following statistics are computed before
each `setup` call:

- `view.emSize`: the size of an EM in pixels
- `view.scrollBarSize`: the size of a scrollbar in pixels
- `view.bounds`: the result of `getBoundingClientRect` on the current `d3el`
