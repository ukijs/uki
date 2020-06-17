/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { ThemeableMixin } from '../../style/ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './style.less';
import template from './template.html';

const { BaseTableView, BaseTableViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class BaseTableView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'BaseTableView'
    }) {
      constructor (options) {
        super(options);
        // By default, keep the original order
        this._rowSortFunc = options.rowSortFunc || null;
        this._rowIndexMode = options.rowIndexMode || 'none';
      }
      get rowIndexMode () {
        return this._rowIndexMode;
      }
      set rowIndexMode (value) {
        this._rowIndexMode = value;
        this.render();
      }
      get rowSortFunc () {
        return this._rowSortFunc;
      }
      set rowSortFunc (func) {
        this._rowSortFunc = func;
        this.render();
      }
      getRawHeaders () {
        const rawRows = this.getRawRows();
        if (rawRows.length === 0) {
          return [];
        } else {
          return Object.keys(rawRows[0]);
        }
      }
      getHeaders () {
        let headers = this.getRawHeaders().map((data, index) => {
          return { index, data };
        });
        if (this.rowIndexMode === 'rowIndex') {
          headers.unshift({ index: 'rowIndex' });
        } else if (this.rowIndexMode === 'itemIndex') {
          headers.unshift({ index: 'itemIndex' });
        }
        return headers;
      }
      getRawRows () {
        throw new Error(`getRows() not implemented by subclass`);
      }
      getRows () {
        let rows = this.getRawRows().map((data, itemIndex) => {
          return { itemIndex, rowIndex: itemIndex, data };
        });
        if (this.rowSortFunc) {
          rows.sort(this.rowSortFunc);
          rows.forEach((row, rowIndex) => {
            row.rowIndex = rowIndex;
          });
        }
        return rows;
      }
      setup () {
        super.setup(...arguments);

        this.d3el.html(template);
      }
      draw () {
        super.draw(...arguments);

        if (this.isHidden || this.isLoading || this.emptyMessage) {
          return;
        }
        this.drawHeaders();
        this.drawRows();
        this.drawCells();
      }
      drawHeaders () {
        const headersToDraw = this.getHeaders();

        this.headers = this.d3el.select('thead tr')
          .selectAll('th').data(headersToDraw, d => d.index)
          .order();
        this.headers.exit().remove();
        const headersEnter = this.headers.enter().append('th');
        this.headers = this.headers.merge(headersEnter);

        headersEnter.append('div')
          .filter(d => d.index === 'rowIndex' || d.index === 'itemIndex')
          .classed('corner', true);
        this.cornerHeader = this.headers.select('.corner');
        if (!this.cornerHeader.node()) {
          this.cornerHeader = null;
        }
        const self = this;
        this.headers.select('div')
          .each(function (d) {
            const d3el = d3.select(this);
            self.updateHeader(d3el, d);
            self.updateHoverListeners(d3el, d);
          });
      }
      updateHeader (d3el, header) {
        d3el.text(header.data);
      }
      drawRows () {
        this.rows = this.d3el.select('tbody')
          .selectAll('tr').data(this.getRows(), d => d.itemIndex)
          .order();
        this.rows.exit().remove();
        const rowsEnter = this.rows.enter().append('tr');
        this.rows = this.rows.merge(rowsEnter);
      }
      drawCells () {
        this.cells = this.rows.selectAll('td')
          .data(row => this.getHeaders().map((header, columnIndex) => {
            return {
              headerData: header.data,
              headerIndex: header.index,
              columnIndex: columnIndex,
              itemIndex: row.itemIndex,
              rowIndex: row.rowIndex,
              data: header.index === 'rowIndex' ? row.rowIndex
                : header.index === 'itemIndex' ? row.itemIndex
                  : row.data[header.data]
            };
          }));
        this.cells.exit().remove();
        const cellsEnter = this.cells.enter().append('td');
        this.cells = this.cells.merge(cellsEnter);

        cellsEnter.append('div'); // wrapper needed for flexible styling, like limiting height
        const self = this;
        this.cells.select('div')
          .each(function (d) {
            const d3el = d3.select(this);
            self.updateCell(d3el, d);
            self.updateHoverListeners(d3el, d);
          });
      }
      updateCell (d3el, cell) {
        d3el.text(cell.data);
      }
      updateHoverListeners (d3el, item) {
        // Show a tooltip on the parent td or th element if the contents are
        // truncated by text-overflow: ellipsis
        const element = d3el.node();
        if (element.clientHeight < element.scrollHeight) {
          d3el.on('mouseenter.baseTableView', () => {
            window.uki.showTooltip({
              content: item.data === undefined || item.data === null ? null : item.data,
              targetBounds: element.getBoundingClientRect()
            });
          }).on('mouseleave.baseTableView', () => {
            window.uki.showTooltip({ content: null });
          });
        } else {
          d3el.on('mouseenter.baseTableView', null)
            .on('mouseleave.baseTableView', null);
        }
      }
    }
    return BaseTableView;
  }
});
export { BaseTableView, BaseTableViewMixin };
