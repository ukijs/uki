/* globals d3 */
import Model from './Model.js';
import { ThemeableMixin } from './style/ThemeableMixin/ThemeableMixin.js';
import { TooltipView } from './ui/TooltipView/TooltipView.js';
import defaultVars from './style/defaultVars.css';
import normalize from '../node_modules/normalize.css/normalize.css';
import honegumi from './style/honegumi.css'; // TODO: npm install this one too

const defaultStyle = normalize + honegumi;

class UkiSettings extends ThemeableMixin({
  SuperClass: Model,
  defaultStyle,
  className: 'root',
  cnNotOnD3el: true // not actually used, because there's no d3el anyway
}) {
  constructor (options) {
    options.resources = options.resources || [];
    // defaultVars is always required, but can be overridden
    options.resources.unshift({
      type: 'css', raw: defaultVars
    });
    super(options);
    this.tooltip = options.tooltip || null;
  }
  async showTooltip (tooltipArgs) {
    if (!this.tooltip) {
      this.tooltip = new TooltipView({
        d3el: d3.select('body').append('div')
      });
      await this.tooltip.render();
    }
    this.tooltip.show(tooltipArgs);
  }
}
export default UkiSettings;
