/* globals d3 */
import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import { UkiButton } from '../UkiButton/UkiButton.js';
import defaultStyle from './style.less';

const { TooltipView, TooltipViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class TooltipView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'tooltip'
    }) {
      setup () {
        super.setup(...arguments);
        this.hide();
      }
      draw () {
        super.draw(...arguments);
        // TODO: migrate a lot of the show() stuff here?
      }
      hide () {
        this.show({ content: null });
      }
      /**
         * @param  {String | Function} [content='']
         * The message that will be displayed; a falsey value hides the tooltip.
         * If, instead of a string, a function is supplied, that function will be
         * called with a d3-selected div as its first argument (useful for more
         * complex, custom tooltip contents)
         * @param  {Object} [targetBounds=null]
         * Specifies a target rectangle that the tooltip should be positioned
         * relative to; usually element.getBoundingClientRect() will do the trick,
         * but you could also specify a similarly-formatted custom rectangle
         * @param  {Object} [anchor=null]
         * Specifies -1 to 1 positioning of the tooltip relative to targetBounds;
         * for example, { x: -1 } would right-align the tooltip to the left edge of
         * targetBounds, { x: 0 } would center the tooltip horizontally, and
         * { x: 1 } would left-align the tooltip to the right edge of targetBounds
         * @param  {Boolean} [interactive = false]
         * Specifies whether pointer-events should register on the tooltip
         * element(s); if false, pointer events will pass through
         * @param  {Number} [nestNew = 0]
         * If true, adds an additional "tooltip"-classed element instead of
         * replacing the existing one (useful for things like nested context menus)
         */
      async show ({
        content = '',
        targetBounds = null,
        anchor = null,
        hideAfterMs = 1000,
        interactive = false,
        nestNew = 0
      } = {}) {
        window.clearTimeout(this._tooltipTimeout);
        const showEvent = d3.event;
        d3.select('body').on('click.tooltip', () => {
          if (showEvent === d3.event) {
            // This is the same event that opened the tooltip; absorb the event to
            // prevent flicker
            d3.event.stopPropagation();
          } else if (!interactive || !this.d3el.node().contains(d3.event.target)) {
            // Only hide the tooltip if we interacted with something outside an
            // interactive tooltip (otherwise don't mess with the event)
            this.hide();
          }
        });

        let tooltip = this.d3el;
        if (nestNew > 0) {
          this._nestedTooltips = this._nestedTooltips || [];
          // Remove any existing tooltips at or deeper than this layer
          while (this._nestedTooltips.length > nestNew) {
            this._nestedTooltips.splice(this._nestedTooltips.length - 1, 1)[0].remove();
          }
          tooltip = this.d3el.append('div')
            .classed('tooltip', true);
          this._nestedTooltips[nestNew] = tooltip;
        }

        tooltip
          .classed('interactive', interactive)
          .style('left', '-1000em')
          .style('top', '-1000em')
          .style('display', content ? null : 'none');

        if (!content) {
          d3.select('body').on('click.tooltip', null);
          this._nestedTooltips = [];
        } else {
          if (typeof content === 'function') {
            await content(tooltip);
          } else {
            tooltip.html(content);
          }
          let tooltipBounds = tooltip.node().getBoundingClientRect();

          let left;
          let top;

          if (targetBounds === null) {
            // todo: position the tooltip WITHIN the window, based on anchor,
            // instead of outside the targetBounds
            throw new Error('tooltips without targets are not yet supported');
          } else {
            anchor = anchor || {};
            if (anchor.x === undefined) {
              if (anchor.y !== undefined) {
                // with y defined, default is to center x
                anchor.x = 0;
              } else {
                if (targetBounds.left > window.innerWidth - targetBounds.right) {
                  // there's more space on the left; try to put it there
                  anchor.x = -1;
                } else {
                  // more space on the right; try to put it there
                  anchor.x = 1;
                }
              }
            }
            if (anchor.y === undefined) {
              if (anchor.x !== undefined) {
                // with x defined, default is to center y
                anchor.y = 0;
              } else {
                if (targetBounds.top > window.innerHeight - targetBounds.bottom) {
                  // more space above; try to put it there
                  anchor.y = -1;
                } else {
                  // more space below; try to put it there
                  anchor.y = 1;
                }
              }
            }
            left = (targetBounds.left + targetBounds.right) / 2 +
                   anchor.x * targetBounds.width / 2 -
                   tooltipBounds.width / 2 +
                   anchor.x * tooltipBounds.width / 2;
            top = (targetBounds.top + targetBounds.bottom) / 2 +
                  anchor.y * targetBounds.height / 2 -
                  tooltipBounds.height / 2 +
                  anchor.y * tooltipBounds.height / 2;
          }

          // Clamp the tooltip so that it stays on screen
          if (left + tooltipBounds.width > window.innerWidth) {
            left = window.innerWidth - tooltipBounds.width;
          }
          if (left < 0) {
            left = 0;
          }
          if (top + tooltipBounds.height > window.innerHeight) {
            top = window.innerHeight - tooltipBounds.height;
          }
          if (top < 0) {
            top = 0;
          }
          tooltip.style('left', left + 'px')
            .style('top', top + 'px');

          if (hideAfterMs > 0) {
            this._tooltipTimeout = window.setTimeout(() => {
              this.hide();
            }, hideAfterMs);
          }
        }
      }
      /**
         * @param  {Array} [menuEntries]
         * A list of objects for each menu item. Each object can have these
         * properties:
         * - A `content` property that is a string, a function, or an object. If a
         *   string or object are provided, a `UkiButton` will be created (the
         *   object will be passed to the `UkiButton` constructor, or the string
         *   will be the `UkiButton`'s `label`). A function will be given a div
         *   for custom formatting, and no `UkiButton` will be created. If
         *  `content` is not provided or is falsey, a separator is drawn.
         * - Either an `onClick` function that will be called when the menu entry is
         *   clicked, or a `subEntries` list of additional menuEntries
         * @param  {Object} [targetBounds=null]
         * Specifies a target rectangle that the tooltip should be positioned
         * relative to; usually element.getBoundingClientRect() will do the trick,
         * but you could also specify a similarly-formatted custom rectangle
         * @param  {Object} [anchor=null]
         * Specifies -1 to 1 positioning of the tooltip relative to targetBounds;
         * for example, { x: -1 } would right-align the tooltip to the left edge of
         * targetBounds, { x: 0 } would center the tooltip horizontally, and
         * { x: 1 } would left-align the tooltip to the right edge of targetBounds
         * @param  {Number} [nestLayer = 0]
         * This should be false for most use cases; it's used internally for nested
         * context menus
         */
      async showContextMenu ({ menuEntries, targetBounds, anchor, nestNew = 0 } = {}) {
        const self = this;
        await this.show({
          targetBounds,
          anchor,
          hideAfterMs: 0,
          interactive: true,
          nestNew,
          content: async d3el => {
            d3el.html('');

            const menuItems = d3el.selectAll('.menuItem')
              .data(menuEntries)
              .enter().append('div')
              .classed('menuItem', true)
              .classed('submenu', d => !!d.subEntries);
            const contentFuncPromises = [];
            const butTemp = [];
            menuItems.each(function (d) {
              let item;
              if (!d.content) {
                item = d3.select(this);
                item.append('hr');
              } else if (typeof d.content === 'function') {
                item = d3.select(this);
                contentFuncPromises.push(d.content(item));
              } else {
                const ukiProps = typeof d.content === 'object' ? d.content : { label: d.content };
                Object.assign(ukiProps, { d3el: d3.select(this) });
                item = new UkiButton(ukiProps);
                butTemp.push(item);
                contentFuncPromises.push(item.render());
              }
              item.on('click', function () {
                if (d.onClick) {
                  d.onClick();
                  self.hide();
                } else if (d.subEntries) {
                  let targetBounds = this instanceof UkiButton
                    ? this.d3el.node().getBoundingClientRect()
                    : this.getBoundingClientRect();
                  targetBounds = {
                    left: targetBounds.left,
                    right: targetBounds.right + TooltipView.SUBMENU_OFFSET,
                    top: targetBounds.top,
                    bottom: targetBounds.bottom,
                    width: targetBounds.width + TooltipView.SUBMENU_OFFSET,
                    height: targetBounds.height
                  };
                  self.showContextMenu({
                    menuEntries: d.subEntries,
                    targetBounds,
                    anchor,
                    interactive: true,
                    nestNew: nestNew + 1
                  });
                }
              });
            });
            await Promise.all(contentFuncPromises);
          }
        });
      }
    }
    TooltipView.SUBMENU_OFFSET = 20;
    return TooltipView;
  }
});

export { TooltipView, TooltipViewMixin };
