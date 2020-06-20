import Model from './Model.js';
import View from './View.js';
import * as utils from './utils/utils.js';

globalThis.uki = globalThis.uki || {};
globalThis.uki.Model = Model;
globalThis.uki.View = View;
globalThis.uki.utils = utils;

export { Model };
export { View };
export { utils };
