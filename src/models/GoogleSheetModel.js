/* globals gapi */
import Model from '../Model.js';

class GoogleSheetModel extends Model {
  constructor (resources = [], options) {
    if (!window.gapi) {
      resources.push({ type: 'js', url: 'https://apis.google.com/js/api.js' });
    }
    super(resources);

    this.spreadsheetId = options.spreadsheetId;
    this.mode = options.mode || GoogleSheetModel.MODE.AUTH_READ_ONLY;
    if (!GoogleSheetModel.MODE[this.mode]) {
      throw new Error(`Mode ${this.mode} not supported yet`);
    }
    this.sheet = options.sheet || 'Sheet1';

    this._cache = null;
    this._status = GoogleSheetModel.STATUS.PENDING;
  }
  async _initWorkaroundPromise (apiKey, clientId) {
    // Really annoying google bug: https://github.com/google/google-api-javascript-client/issues/399
    // means that we have to wait 10ms before actually trying to call init() or it fails silently
    // :rage_emoji: ... can I please have the last week of my life back?
    if (!GoogleSheetModel._initPromise) {
      GoogleSheetModel._initPromise = new Promise((resolve, reject) => {
        window.setTimeout(() => {
          gapi.client.init({
            apiKey: apiKey,
            clientId: clientId,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            scope: this.mode === GoogleSheetModel.MODE.AUTH_READ_ONLY
              ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
              : 'https://www.googleapis.com/auth/spreadsheets'
          }).then(resolve, reject);
        }, 10);
      });
    }
    return GoogleSheetModel._initPromise;
  }
  async setupAuth (apiKey, clientId) {
    await this.ready;

    if (this.mode === GoogleSheetModel.MODE.AUTH_READ_ONLY ||
        this.mode === GoogleSheetModel.MODE.AUTH_READ_WRITE) {
      gapi.load('client:auth2', async () => {
        try {
          await this._initWorkaroundPromise(apiKey, clientId);
        } catch (error) {
          this.status = GoogleSheetModel.STATUS.ERROR;
          throw error;
        }

        const auth = gapi.auth2.getAuthInstance().isSignedIn;

        // Listen for status changes
        auth.listen(signedIn => {
          this.status = signedIn
            ? GoogleSheetModel.STATUS.SIGNED_IN : GoogleSheetModel.STATUS.SIGNED_OUT;
        });

        // Figure out our initial status
        this.status = auth.get()
          ? GoogleSheetModel.STATUS.SIGNED_IN : GoogleSheetModel.STATUS.SIGNED_OUT;
      });
    } else {
      this.status = GoogleSheetModel.STATUS.NO_AUTH;
    }
  }
  get status () {
    return this._status;
  }
  set status (status) {
    this._status = status;
    if (this._status === GoogleSheetModel.STATUS.SIGNED_IN) {
      this.updateCache();
    } else {
      this._cache = null;
      this.trigger('dataUpdated');
    }
    this.trigger('statusChanged', status);
  }
  getHeaders () {
    const rawTable = this.getRawTable();
    return rawTable.length > 0 ? rawTable[0] : [];
  }
  getValues () {
    if (!this._valueCache) {
      const headers = this.getHeaders();
      this._valueCache = this.getRawTable().slice(1).map(row => {
        const obj = {};
        for (let i = 0; i < headers.length || i < row.length; i++) {
          let header = headers[i] || 'Blank Header';
          if (obj[header] !== undefined) {
            let extraHeader = 1;
            while (obj[header + extraHeader] !== undefined) { extraHeader += 1; }
            header = header + extraHeader;
          }
          obj[header] = row[i] || '';
        }
        return obj;
      });
    }
    return this._valueCache;
  }
  getRawTable () {
    return (this._cache && this._cache.values) || [];
  }
  async addRows (rows) {
    const headers = this.getHeaders();
    const initialHeaderLength = headers.length;
    await this.addRawRows(rows.map(row => {
      const list = [];
      const temp = Object.assign({}, row);
      for (const header of headers) {
        list.push(temp[header]);
        delete temp[header];
      }
      for (const [header, value] of Object.entries(temp)) {
        headers.push(header);
        list.push(value);
      }
      return list;
    }), true);
    if (initialHeaderLength < headers.length) {
      try {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: this.sheet + '!1:1',
          valueInputOption: 'RAW'
        }, {
          majorDimension: 'ROWS',
          values: [ headers ]
        });
      } catch (err) {
        this.status = GoogleSheetModel.STATUS.ERROR;
        throw err;
      }
    }
    await this.updateCache();
  }
  async removeRows (startIndex, endIndex) {
    try {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex,
                  endIndex
                }
              }
            }
          ]
        }
      });
    } catch (err) {
      this.status = GoogleSheetModel.STATUS.ERROR;
      throw err;
    }
    await this.updateCache();
  }
  async removeColumn (colName) {
    const headers = this.getHeaders();
    const index = headers.indexOf(colName);
    if (index === -1) {
      throw new Error(`Can't remove non-existent column ${colName}`);
    }
    try {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: index,
                endIndex: index + 1
              }
            }
          }]
        }
      });
    } catch (err) {
      this.status = GoogleSheetModel.STATUS.ERROR;
      throw err;
    }
    await this.updateCache();
  }
  async addRawRows (rows, skipCacheUpdate = false) {
    try {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.sheet,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS'
      }, {
        majorDimension: 'ROWS',
        values: rows
      });
    } catch (err) {
      this.status = GoogleSheetModel.STATUS.ERROR;
      throw err;
    }
    if (!skipCacheUpdate) {
      await this.updateCache();
    }
  }
  async updateCache () {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.sheet
      });
      this._cache = response.result;
      delete this._valueCache;
      this.trigger('dataUpdated');
    } catch (err) {
      this.status = GoogleSheetModel.STATUS.ERROR;
      throw err;
    }
  }
  signIn () {
    if (!this.mode.startsWith('AUTH')) {
      throw new Error(`Can't sign in to model with mode ${this.mode}`);
    }
    gapi.auth2.getAuthInstance().signIn();
  }
  signOut () {
    if (!this.mode.startsWith('AUTH')) {
      throw new Error(`Can't sign out of model with mode ${this.mode}`);
    }
    gapi.auth2.getAuthInstance().signOut();
  }
}

GoogleSheetModel.STATUS = {
  'SIGNED_IN': 'SIGNED_IN',
  'SIGNED_OUT': 'SIGNED_OUT',
  'ERROR': 'ERROR',
  'PENDING': 'PENDING',
  'NO_AUTH': 'NO_AUTH'
};

GoogleSheetModel.MODE = {
  // 'FORM_CURATED_WRITE': 'FORM_CURATED_WRITE',
  // 'FORM_DANGEROUS_READ_WRITE': 'FORM_DANGEROUS_READ_WRITE',
  'AUTH_READ_ONLY': 'AUTH_READ_ONLY',
  'AUTH_READ_WRITE': 'AUTH_READ_WRITE'
};

export default GoogleSheetModel;
