/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import { BaseTableView } from '../BaseTableView/BaseTableView.js';
import { Button } from '../../ui/Button/Button.js';
import gearIcon from './gear.svg';

const { FlexTableView, FlexTableViewMixin } = createMixinAndDefault({
  DefaultSuperClass: BaseTableView,
  classDefFunc: SuperClass => {
    class FlexTableView extends SuperClass {
      constructor (options) {
        // FlexTable uses the corner header for its menu; showing either
        // itemIndex or rowIndex is recommended, so itemIndex is enabled by
        // default
        options.rowIndexMode = options.rowIndexMode || 'itemIndex';
        super(options);

        // By default, show all headers in their original order
        this.visibleHeaderIndices = null;
      }
      getHeaders () {
        const headers = super.getHeaders();
        if (this.visibleHeaderIndices === null) {
          return headers;
        } else {
          return this.visibleHeaderIndices.map(headerIndex => {
            return headers.find(h => h.index === headerIndex);
          });
        }
      }
      drawFlexMenu (tooltipEl) {
        const fullHeaderList = super.getHeaders();
        if (this.rowIndexMode !== 'none') {
          fullHeaderList.splice(0, 1);
        }

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
          .property('checked', d => this.headerIsVisible(d.index))
          .style('display', 'inline-block')
          .style('margin-right', '1em')
          .on('change', d => {
            this.toggleHeader(d);
          });
        listItemsEnter.append('label')
          .attr('for', (d, i) => `attrCheckbox${i}`)
          .text(d => d.data)
          .style('display', 'inline-block');
      }
      headerIsVisible (headerIndex) {
        return this.visibleHeaderIndices === null ||
          this.visibleHeaderIndices.indexOf(headerIndex) !== -1;
      }
      updateHeader (d3el, header) {
        if (d3el.node() === this.cornerHeader.node()) {
          if (!this.attributeSelector) {
            this.attributeSelector = new Button({
              d3el: this.cornerHeader.append('div').classed('attributeSelector', true),
              img: URL.createObjectURL(new window.Blob([gearIcon], { type: 'image/svg+xml' })),
              size: 'small'
            });
          }
          this.attributeSelector.on('click', () => {
            window.uki.showTooltip({
              content: tooltipEl => { this.drawFlexMenu(tooltipEl); },
              targetBounds: this.attributeSelector.d3el.node().getBoundingClientRect(),
              interactive: true,
              hideAfterMs: 0
            });
          });
        } else {
          super.updateHeader(d3el, header);
        }
      }
      toggleHeader (header) {
        if (this.visibleHeaderIndices === null) {
          // Show all but the header toggled
          this.visibleHeaderIndices = this.getHeaders().map(h2 => h2.index);
        }
        const index = this.visibleHeaderIndices.indexOf(header.index);
        if (index === -1) {
          this.visibleHeaderIndices.push(header.index);
        } else {
          this.visibleHeaderIndices.splice(index, 1);
        }
        this.render();
      }
    }
    return FlexTableView;
  }
});
export { FlexTableView, FlexTableViewMixin };
