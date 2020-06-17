import Model from './Model.js';
import View from './View.js';
import UkiSettings from './UkiSettings.js';

import * as goldenlayout from './goldenlayout/goldenlayout.js';
import * as google from './google/google.js';
import * as ui from './ui/ui.js';
import * as table from './table/table.js';
import * as util from './utils/utils.js';

if (window) {
  window.uki = new UkiSettings(window.uki || {});
}

export { Model };
export { View };
export { goldenlayout };
export { google };
export { ui };
export { table };
export { util };
