import Model from './Model.js';
import View from './View.js';
import * as utils from './utils/utils.js';
import pkg from '../package.json';
const version = pkg.version;

globalThis.uki = globalThis.uki || {};
globalThis.uki.Model = Model;
globalThis.uki.View = View;
globalThis.uki.utils = utils;
globalThis.uki.version = version;

export { Model, View, utils, version };
