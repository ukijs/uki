import { Model, ModelMixin } from './Model.js';
import { View, ViewMixin } from './View.js';
import * as utils from './utils/utils.js';
import pkg from '../package.json';
const version = pkg.version;

globalThis.uki = globalThis.uki || {};
globalThis.uki.Model = Model;
globalThis.uki.ModelMixin = ModelMixin;
globalThis.uki.View = View;
globalThis.uki.ViewMixin = ViewMixin;
globalThis.uki.utils = utils;
globalThis.uki.version = version;

const d3Version = pkg.peerDependencies.d3.match(/[\d.]+/)[0];
const lessVersion = pkg.optionalDependencies.less.match(/[\d.]+/)[0];

globalThis.uki.dynamicDependencies = {
  d3: `https://cdnjs.cloudflare.com/ajax/libs/d3/${d3Version}/d3.min.js`,
  less: `https://cdnjs.cloudflare.com/ajax/libs/less.js/${lessVersion}/less.min.js`
};

export { Model, View, utils, version };
