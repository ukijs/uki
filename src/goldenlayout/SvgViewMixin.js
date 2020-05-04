/* globals d3 */
import FixedGLViewMixin from './FixedGLViewMixin.js';
import lessStyle from './SvgViewMixin.less';

const SvgViewMixin = function (superclass) {
  const SvgView = class extends FixedGLViewMixin(superclass) {
    constructor (options) {
      options.resources = options.resources || [];
      options.resources.push({
        type: 'less', raw: lessStyle
      });
      options.fixedTagType = 'svg';
      super(options);
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
        .classed('svgTab', true)
        .append('div')
        .classed('downloadIcon', true)
        .attr('title', 'Download')
        .on('click', () => {
          this.downloadSvg();
        });
    }
    downloadSvg () {
      // Adapted from https://stackoverflow.com/a/37387449/1058935
      const containerElements = ['svg', 'g'];
      const relevantStyles = {
        'svg': ['width', 'height'],
        'rect': ['fill', 'stroke', 'stroke-width', 'opacity'],
        'p': ['font', 'opacity'],
        '.node': ['cursor', 'opacity'],
        'path': ['fill', 'stroke', 'stroke-width', 'opacity'],
        'circle': ['fill', 'stroke', 'stroke-width', 'opacity'],
        'line': ['stroke', 'stroke-width', 'opacity'],
        'text': ['fill', 'font-size', 'text-anchor', 'opacity'],
        'polygon': ['stroke', 'fill', 'opacity']
      };
      const copyStyles = (original, copy) => {
        const tagName = original.tagName;
        const allStyles = window.getComputedStyle(original);
        for (const style of relevantStyles[tagName] || []) {
          d3.select(copy).style(style, allStyles[style]);
        }
        if (containerElements.indexOf(tagName) !== -1) {
          for (let i = 0; i < original.children.length; i++) {
            copyStyles(original.children[i], copy.children[i]);
          }
        }
      };

      const original = this.d3el.node();
      const copy = original.cloneNode(true);
      copyStyles(original, copy);

      const data = new window.XMLSerializer().serializeToString(copy);
      const svg = new window.Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svg);

      const link = d3.select('body')
        .append('a')
        .attr('download', `${this.title}.svg`)
        .attr('href', url);
      link.node().click();
      link.remove();
    }
  };
  SvgView.prototype._instanceOfSvgViewMixin = true;
  return SvgView;
};
Object.defineProperty(SvgViewMixin, Symbol.hasInstance, {
  value: i => !!i._instanceOfSvgViewMixin
});
export default SvgViewMixin;
