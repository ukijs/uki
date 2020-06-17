import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';
import { ThemeableMixin } from '../ThemeableMixin/ThemeableMixin.js';
import defaultStyle from './honegumi.less';

const { HonegumiView, HonegumiViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class HonegumiView extends ThemeableMixin({
      SuperClass, defaultStyle, className: 'HonegumiView'
    }) {}
    return HonegumiView;
  }
});
export { HonegumiView, HonegumiViewMixin };
