/* globals d3 */
import View from '../View.js';
import { IntrospectableMixin } from '../utils/utils.js';
import lessStyle from './GoldenLayoutView.less';

class GoldenLayoutView extends IntrospectableMixin(View) {
  constructor ({
    container,
    state,
    resources
  }) {
    resources = resources || [];
    resources.push({
      type: 'less', raw: lessStyle
    });
    super(null, resources);
    this.glContainer = container;
    this.state = state;
    this.isHidden = false;
    this.ukiLoaded = false;
    this.on('load', () => {
      this.ukiLoaded = true;
    });
    this.glContainer.on('tab', tab => {
      this.tabElement = d3.select(tab.element[0]);
      this.setupTab();

      // GoldenLayout creates a separate DragProxy element that needs our
      // custom tab modifications while dragging
      tab._dragListener.on('dragStart', () => {
        const draggedTabElement = d3.select('.lm_dragProxy .lm_tab');
        this.setupTab(draggedTabElement);
        this.drawTab(draggedTabElement);
      });
    });
    this.glContainer.on('open', () => {
      this.render(d3.select(this.glContainer.getElement()[0]));
    });
    this.glContainer.on('hide', () => {
      this.isHidden = true;
    });
    this.glContainer.on('show', () => {
      this.isHidden = false;
      this.render();
    });
    this.glContainer.on('resize', () => this.render());
  }
  get title () {
    return this.humanReadableType;
  }
  get isEmpty () {
    // Should be overridden when a view has nothing to show
    return false;
  }
  get isLoading () {
    // Should be overridden when a view is loading data
    return !this.ukiLoaded;
  }
  setup () {
    this.d3el
      .classed('GoldenLayoutView', true)
      .classed(this.type, true);
    this.emptyStateDiv = this.d3el.append('div')
      .classed('emptyState', true)
      .style('display', 'none');
    this.content = this.setupContentElement(this.d3el);
    this.spinner = this.d3el.append('div')
      .classed('spinner', true)
      .style('display', 'none');
  }
  setupTab () {
    this.tabElement.classed(this.type, true);
  }
  drawTab () {
    this.tabElement.select(':scope > .lm_title')
      .text(this.title);
  }
  setupContentElement () {
    // Default setup is a scrollable div; SvgViewMixin overrides this
    return this.d3el.append('div')
      .classed('scrollArea', true);
  }
  getAvailableSpace (content = this.content) {
    return content.node().getBoundingClientRect();
  }
  draw () {
    this.emptyStateDiv.style('display', this.isEmpty ? null : 'none');
    this.spinner.style('display', this.isLoading ? null : 'none');
    if (this.tabElement) {
      this.drawTab();
    }
  }
}

export default GoldenLayoutView;
