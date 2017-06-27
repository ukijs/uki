uki
===

A minimal, d3-based Model-View library library that I use in my projects.
I rolled this together after lots of frustration with existing MVC frameworks that really constrain what you do and force you to read a ton of documentation---all to just help you do something simple.
I don't claim this is better than any of them... but its code is short and it does so little, that it gets out of my way.

Installation and Usage
======================

If you need wide browser support, or you're new to setting up web projects, I recommend using the ES5 library: [UMD / Classic HTML](https://github.com/alex-r-bigelow/uki/blob/master/examples/umd)

If you're more familiar with Javascript build chain hell, you can use cleaner ES6 syntax following this [webpack](https://github.com/alex-r-bigelow/uki/blob/master/examples/webpack) example.
Note that the `main` field in `package.json` points to the Babel-ified ES5 version, and `bundle` / `jsnext:main` point to a rolled up ES6 file without any Babel transpiling.

Documentation
=============

The basic idea is you extend the `Model` and `View` classes; you can assign and listen to custom events on one, the other, or both, depending on how you roll. Or ignore events if you want to manage state differently.

`View`s should implement a `setup` and `draw` function, but they shouldn't be called directly. Instead, you should call the view's `render` function. Exactly when / how you call it is up to you.

At least the first time `render(d3element)` is called, it should be passed a d3-selected DOM container as the parameter (it can be a div, span, svg, whatever). Thereafter, the parameter is optional.

You don't need to worry about calling render too frequently: `render` triggers a `setup` only once when the view is given a new DOM element to render to (you can give a view a new element at any point, and setup will be called again if it's actually a different element).
`draw` is debounced, so only the last render call will trigger a draw (you can adjust the waiting period by changing the View's `debounceWait` property).

For more details, read [the source code](https://github.com/alex-r-bigelow/uki/blob/master/src); it's deliberately small!
