/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';

const { RecolorableImageView, RecolorableImageViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class RecolorableImageView extends SuperClass {
      constructor (options) {
        super(options);
        this._recolorFilters = {};
        for (const color of options.extraRecolorFilters || []) {
          this._recolorFilters[color] = true;
        }
        window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
          this.updateRecolorFilters();
        });
      }
      setup () {
        super.setup(...arguments);
        this.updateRecolorFilters();
      }
      updateRecolorFilters () {
        const temp = this.d3el.append('p');

        // Extract all CSS rules that look like
        // filter: url(#recolorImageToFFFFFF)
        // or
        // filter: url(#recolorImageTo--some-css-variable)
        // from this view's style resources
        for (const resource of this.resources) {
          if (resource.sheet) {
            try {
              for (const rule of Array.from(resource.sheet.cssRules || resource.sheet.rules)) {
                if (rule.style && rule.style.filter) {
                  // First check for CSS variables
                  let cssVar = /#recolorImageTo(--[^)"]*)/.exec(rule.style.filter);
                  if (cssVar && cssVar[1]) {
                    temp.node().setAttribute('style', `color: var(${cssVar[1]})`);
                    const styles = window.getComputedStyle(temp.node());
                    // Check that the variable exists
                    if (styles.getPropertyValue(cssVar[1])) {
                      // Convert the computed 0-255 rgb color to 0-1
                      const rgbChunks = /rgba?\((\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(styles.color);
                      if (rgbChunks[1] && rgbChunks[2] && rgbChunks[3]) {
                        this._recolorFilters[cssVar[1]] = {
                          r: parseInt(rgbChunks[1]) / 255,
                          g: parseInt(rgbChunks[2]) / 255,
                          b: parseInt(rgbChunks[3]) / 255
                        };
                      }
                    }
                  } else {
                    // Try for raw hex codes
                    let hexCode = cssVar || /#recolorImageTo(......)/.exec(rule.style.filter);
                    if (hexCode && hexCode[1]) {
                      // Convert the hex code to 0-1 rgb
                      this._recolorFilters[hexCode[1]] = {
                        r: parseInt(hexCode[1].slice(0, 2)) / 255,
                        g: parseInt(hexCode[1].slice(2, 4)) / 255,
                        b: parseInt(hexCode[1].slice(4, 6)) / 255
                      };
                    }
                  }
                }
              }
            } catch (err) {
              if (!(err instanceof window.DOMException)) {
                throw err;
              }
            }
          }
        }

        temp.remove();

        // Create a special hidden SVG element if it doesn't already exist
        if (d3.select('#recolorImageFilters').size() === 0) {
          let svg = d3.select('body').append('svg')
            .attr('id', 'recolorImageFilters')
            .attr('width', 0)
            .attr('height', 0);
          svg.append('defs');
        }

        // Generate / update SVG filters for any colors that haven't already
        // been created
        let recolorFilters = d3.select('#recolorImageFilters')
          .selectAll('filter.recolor')
          .data(Object.entries(this._recolorFilters), d => d[0]);
        // Note that we do NOT mess with / remove exit() filters; these things
        // might be added from many sources, and we want to leave stuff that's
        // already there
        let recolorFiltersEnter = recolorFilters.enter().append('filter')
          .attr('class', 'recolor')
          .attr('id', d => 'recolorImageTo' + d[0]);
        recolorFilters = recolorFilters.merge(recolorFiltersEnter);
        let cmpTransferEnter = recolorFiltersEnter.append('feComponentTransfer')
          .attr('in', 'SourceAlpha')
          .attr('result', 'color');
        cmpTransferEnter.append('feFuncR')
          .attr('type', 'linear')
          .attr('slope', 0);
        recolorFilters.select('feFuncR')
          .attr('intercept', d => Math.pow(d[1].r, 2));
        cmpTransferEnter.append('feFuncG')
          .attr('type', 'linear')
          .attr('slope', 0);
        recolorFilters.select('feFuncG')
          .attr('intercept', d => Math.pow(d[1].g, 2));
        cmpTransferEnter.append('feFuncB')
          .attr('type', 'linear')
          .attr('slope', 0);
        recolorFilters.select('feFuncB')
          .attr('intercept', d => Math.pow(d[1].b, 2));
      }
    }
    return RecolorableImageView;
  }
});
export { RecolorableImageView, RecolorableImageViewMixin };
