/* globals GoldenLayout */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { ThemeableMixin } from '../../style/ThemeableMixin/ThemeableMixin.js';
import { RecolorableImageViewMixin } from '../../style/RecolorableImageView/RecolorableImageView.js';
import defaultStyle from './style.less';

const { GLRootView, GLRootViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class GLRootView extends RecolorableImageViewMixin(ThemeableMixin({
      SuperClass, defaultStyle, className: 'GLRootView'
    })) {
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
        super(options);

        this.glSettings = options.glSettings;
        this.viewClassLookup = options.viewClassLookup;
      }
      setupLayout () {
        // Add some default settings if they're not already set
        this.glSettings.dimensions = this.glSettings.dimensions || {};
        this.glSettings.dimensions.headerHeight =
          this.glSettings.dimensions.headerHeight ||
          parseInt(this.d3el.style('--form-element-height'));

        // Create the GoldenLayout instance and infrastructure for creating /
        // referencing views
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
        this.goldenLayout.init();
      }
      setup () {
        super.setup(...arguments);

        this.setupLayout();
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
