/* globals GoldenLayout */
import View from '../View.js';
import defaultTheme from './GLDefaultTheme.less';

class GLRootView extends View {
  constructor (options) {
    options.resources = options.resources || [];
    // Core CSS Styles
    options.resources.push({
      'type': 'css',
      'url': 'https://golden-layout.com/files/latest/css/goldenlayout-base.css'
    });
    // Theme
    if (options.glThemeResource) {
      options.resources.push(options.glThemeResource);
    } else {
      options.resources.push({
        type: 'less',
        raw: defaultTheme
      });
    }

    // JS Dependencies if they aren't already loaded
    if (!window.jQuery) {
      options.resources.push({
        type: 'js',
        url: 'https://code.jquery.com/jquery-3.4.1.min.js',
        extraAttributes: {
          integrity: 'sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=',
          crossorigin: 'anonymous'
        }
      });
    }
    if (!window.GoldenLayout) {
      options.resources.push({
        type: 'js', url: 'https://golden-layout.com/files/latest/js/goldenlayout.min.js'
      });
    }
    options.suppressInitialRender = true;
    super(options);

    this.glSettings = options.glSettings;
    this.viewClassLookup = options.viewClassLookup;
    this.ready.then(() => {
      this.setupLayout();
      this.render();
    });
  }
  setupLayout () {
    this.goldenLayout = new GoldenLayout(this.glSettings, this.d3el.node());
    this.views = {};
    for (const [className, ViewClass] of Object.entries(this.viewClassLookup)) {
      const self = this;
      this.goldenLayout.registerComponent(className, function (container, state) {
        const view = new ViewClass({
          glContainer: container,
          glState: state
        });
        self.views[className] = view;
      });
    }
    window.addEventListener('resize', () => {
      this.goldenLayout.updateSize();
      this.render();
    });
  }
  setup () {
    // Don't do init() until setup() because GoldenLayout sometimes misbehaves
    // if LESS hasn't finished loading
    this.goldenLayout.init();
    this.renderAllViews();
  }
  draw () {
    this.renderAllViews();
  }
  renderAllViews () {
    for (const view of Object.values(this.views)) {
      view.render();
    }
  }
}

export default GLRootView;
