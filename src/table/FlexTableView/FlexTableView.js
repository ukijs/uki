/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { RestylableMixin } from '../../ui/Restylable/Restylable.js';
import { UkiButton } from '../../ui/UkiButton/UkiButton.js';
import { TooltipView } from '../../ui/Tooltip/Tooltip.js';
import defaultStyle from './style.less';
import template from './template.html';
import gearIcon from './gear.svg';

const { FlexTableView, FlexTableMixin } = createMixinAndDefault('FlexTableMixin', View, superclass => {
  class FlexTableView extends RestylableMixin(superclass, defaultStyle, 'FlexTableView') {
    constructor (options) {
      super(options);

      // By default, show all headers in their original order
      this.visibleHeaderIndices = null;
      // By default, keep the original order
      this.rowSortFunc = null;
    }
    getRawHeaders () {
      throw new Error(`getHeaders() not implemented by subclass`);
    }

    getHeaders () {
      return this.getRawHeaders().map((data, index) => {
        return { index, data }; // can also have stylefunc
      });
    }
    getRawRows () {
      throw new Error(`getRows() not implemented by subclass`);
    }
    getRows () {
      // This one can also be overridden, but not required
      return this.getRawRows().map((data, index) => {
        return { index, data };
      });
    }
    setup () {
      super.setup();

      this.d3el.html(template);
    }
    async showTooltip (tooltipArgs) {
      // Can + should be overridden if there's a global Tooltip instance somewhere
      if (!this._tooltip) {
        this._tooltip = new TooltipView({
          d3el: d3.select('body').append('div')
        });
        await this._tooltip.render();
      }
      this._tooltip.show(tooltipArgs);
    }
    drawAttributeTooltip (tooltipEl) {
      const fullHeaderList = this.getHeaders();

      tooltipEl.html(`<h3>Show columns:</h3><ul style="padding:0"></ul>`);

      let listItems = tooltipEl.select('ul')
        .selectAll('li').data(fullHeaderList);
      listItems.exit().remove();
      const listItemsEnter = listItems.enter().append('li');
      listItems = listItems.merge(listItemsEnter);

      listItems
        .style('max-width', '15em')
        .style('list-style', 'none')
        .on('click', () => {
          d3.event.stopPropagation();
        });

      listItemsEnter.append('input')
        .attr('type', 'checkbox')
        .attr('id', (d, i) => `attrCheckbox${i}`)
        .property('checked', d => this.headerIsVisible(d))
        .on('change', d => {
          this.toggleHeader(d);
        });
      listItemsEnter.append('label')
        .attr('for', (d, i) => `attrCheckbox${i}`)
        .text(d => d);
    }
    draw () {
      super.draw();

      const self = this;

      if (this.isHidden || this.isLoading) {
        return;
      }
      this.drawHeaders();


      this.rows = this.d3el.select('tbody')
        .selectAll('tr').data(this.getRows(), d => d.index)
        .order();
      this.rows.exit().remove();
      const rowsEnter = this.rows.enter().append('tr');
      this.rows = this.rows.merge(rowsEnter);

      this.cells = this.rows.selectAll('td')
        .data(row => headersToDraw.map(header => row[header]));
      this.cells.exit().remove();
      const cellsEnter = this.cells.enter().append('td');
      this.cells = this.cells.merge(cellsEnter);

      cellsEnter.append('div'); // wrapper needed to limit height
      this.cells.select('div')
        .text(d => d === undefined ? '' : d === null ? 'null' : d)
        .on('mouseenter', function (d) {
          self.showTooltip({
            content: d === undefined || d === null ? null : d,
            targetBounds: this.getBoundingClientRect()
          });
        })
        .on('mouseleave', () => {
          this.showTooltip({ content: null });
        });
    }
    drawHeaders () {
      // Prepend the corner header to the ordered list of headers that the user
      // wants to see (or all the headers in their original headers if they
      // haven't picked anything yet)
      const headersToDraw = [{ index: null }]
        .concat(this.visibleHeaders || this.getHeaders());

      this.headers = this.d3el.select('thead tr')
        .selectAll('th').data(headersToDraw, d => d.index);
      this.headers.exit().remove();
      const headersEnter = this.headers.enter().append('th');
      this.headers = this.headers.merge(headersEnter);

      headersEnter.append('div')
        .filter(d => d.index === null)
        .classed('corner', true);
      this.headers.select('div')
        .text(d => d)
        .on('mouseenter', function (d) {
          self.showTooltip({
            content: d,
            targetBounds: this.getBoundingClientRect()
          });
        })
        .on('mouseleave', () => {
          this.showTooltip({ content: null });
        });

      .each(function () {
        const attributeSelector = new UkiButton({
          d3el: this.d3el.append('div').classed('attributeSelector', true),
          img: URL.createObjectURL(new window.Blob([gearIcon], { type: 'image/svg+xml' })),
          size: 'small'
        });
        attributeSelector.on('click', () => {
          this.showTooltip({
            content: tooltipEl => { this.drawAttributeTooltip(tooltipEl); },
            targetBounds: attributeSelector.d3el.node().getBoundingClientRect(),
            interactive: true,
            hideAfterMs: 0
          });
        });
      });
    }
    headerIsVisible (header) {
      return this.visibleHeaders === null ||
        this.visibleHeaders.indexOf(header) !== -1;
    }
    toggleHeader (h) {
      if (this.visibleHeaders === null) {
        // Show all but the header toggled
        this.visibleHeaders = this.getHeaders();
      }
      const index = this.visibleHeaders.indexOf(h);
      if (index === -1) {
        this.visibleHeaders.push(h);
      } else {
        this.visibleHeaders.splice(index, 1);
      }
      this.render();
    }
  }
  return FlexTableView;
}, true);
export { FlexTableView, FlexTableMixin };
