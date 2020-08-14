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

export { Model, View, utils, version };
