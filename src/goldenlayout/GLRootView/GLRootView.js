/* globals GoldenLayout */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { ThemeableMixin } from '../../style/ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';

const { GLRootView, GLRootViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class GLRootView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'GLRootView'
    }) {
      constructor (options) {
        options.resources = options.resources || [];

        // Core CSS Styles
        if (options.glCoreStyleResource) {
          options.resources.unshift(options.glCoreStyleResource);
        } else {
          options.resources.unshift({
            'type': 'css',
            'url': 'https://golden-layout.com/files/latest/css/goldenlayout-base.css'
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
            },
            name: 'jQuery'
          });
        }
        if (!window.GoldenLayout) {
          options.resources.push({
            type: 'js',
            url: 'https://golden-layout.com/files/latest/js/goldenlayout.min.js',
            loadAfter: ['jQuery']
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
        super.setup(...arguments);
        // Don't do init() until setup() because GoldenLayout sometimes misbehaves
        // if LESS hasn't finished loading
        this.goldenLayout.init();
        this.renderAllViews();
      }
      draw () {
        super.draw(...arguments);
        this.renderAllViews();
      }
      renderAllViews () {
        for (const view of Object.values(this.views)) {
          view.render();
        }
      }
    }
    return GLRootView;
  }
});

export { GLRootView, GLRootViewMixin };
