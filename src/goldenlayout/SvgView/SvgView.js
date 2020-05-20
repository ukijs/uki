/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import FixedGLViewMixin from '../FixedGLView/FixedGLViewMixin.js';
import { GLView } from '../GLView/GLView.js';
import { RestylableMixin } from '../../ui/Restylable/Restylable.js';
import defaultStyle from './style.less';

const { SvgView, SvgViewMixin } = createMixinAndDefault('SvgViewMixin', GLView, superclass => {
  class SvgView extends FixedGLViewMixin(RestylableMixin(superclass, defaultStyle, 'SvgView', true)) {
    constructor (options) {
      options.fixedTagType = 'svg';
      super(options);
    }
    setupTab () {
      super.setupTab();
      this.glTabEl
        .classed('SvgTab', true)
        .append('div')
        .classed('downloadIcon', true)
        .attr('title', 'Download')
        .on('mousedown', () => {
          d3.event.stopPropagation();
        })
        .on('mouseup', () => {
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
  }
  return SvgView;
});
export { SvgView, SvgViewMixin };
