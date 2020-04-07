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
    this.range = options.range || 'Sheet1';

    this._cache = null;
    this._status = GoogleSheetModel.STATUS.PENDING;
  }
  async setupAuth (apiKey, clientId) {
    await this.ready;

    if (this.mode === GoogleSheetModel.MODE.AUTH_READ_ONLY ||
        this.mode === GoogleSheetModel.MODE.AUTH_READ_WRITE) {
      gapi.load('client:auth2', () => {
        // Really annoying google bug: https://github.com/google/google-api-javascript-client/issues/399
        // means that we have to wait 10ms before actually trying to call init() or it fails silently
        // :rage_emoji: ... can I please have the last 4 hours of my life back?
        window.setTimeout(() => {
          gapi.client.init({
            apiKey: apiKey,
            clientId: clientId,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            scope: this.mode === GoogleSheetModel.MODE.AUTH_READ_ONLY
              ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
              : 'https://www.googleapis.com/auth/spreadsheets'
          }).then(() => {
            const auth = gapi.auth2.getAuthInstance().isSignedIn;

            // Listen for status changes
            auth.listen(signedIn => {
              this.status = signedIn
                ? GoogleSheetModel.STATUS.SIGNED_IN : GoogleSheetModel.STATUS.SIGNED_OUT;
            });

            // Figure out our initial status
            this.status = auth.get()
              ? GoogleSheetModel.STATUS.SIGNED_IN : GoogleSheetModel.STATUS.SIGNED_OUT;
          }, error => {
            this.status = GoogleSheetModel.STATUS.ERROR;
            console.warn('Error in google authentication:', error);
          });
        }, 10);
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
  getValues () {
    return this._cache && this._cache.values;
  }
  async addRows (values) {
    try {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS'
      }, {
        majorDimension: 'ROWS',
        values: values
      });
      await this.updateCache();
    } catch (err) {
      this.status = GoogleSheetModel.STATUS.ERROR;
      throw err;
    }
  }
  async updateCache () {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.range
      });
      this._cache = response.result;
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
