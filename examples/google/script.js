/* globals d3 */
import { View, GoogleSheetModel } from '../uki.esm.js';

class CustomView extends View {
  constructor (d3el) {
    super(d3el);

    this.model = new GoogleSheetModel({
      apiKey: 'AIzaSyAGvxpHTf5dEcnvsL7_DBynOjhRyh2hmuo',
      clientId: '785875941724-nt92f7nc2dpr8ha4uo16ls4eld9bvfed.apps.googleusercontent.com',
      // Point this to a spreadsheet that your google account has write access to:
      spreadsheetId: '15u2YOyqXpGr8krpBP55qC4gxmAwDwFfKLEgyuoIpnMM',
      mode: GoogleSheetModel.MODE.AUTH_READ_WRITE,
      range: 'Class Data!A1:E'
    });

    this.model.on('dataUpdated', () => { this.render(); });
    this.model.on('statusChanged', () => { this.render(); });
  }
  setup () {
    this.d3el.append('button')
      .classed('authorize', true)
      .text('Sign In')
      .on('click', () => {
        this.model.signIn();
      });
    this.d3el.append('button')
      .classed('signOut', true)
      .text('Sign Out')
      .on('click', () => {
        this.model.signOut();
      });
    this.d3el.append('button')
      .text('Add Rows')
      .on('click', () => {
        this.model.addRows([
          ['Jeffrey', 'Male', '6. Retired Dude', 'CA', 'Abiding'],
          ['Walter', 'Male', '5. Former Soldier', 'CA', 'Bowling'],
          ['Donny', 'Male', '7. Unknown', 'CA', 'Possible figment of Walter\'s imagination']
        ]);
      });
    this.d3el.append('div')
      .classed('status', true);
    this.d3el.append('pre')
      .classed('data', true);
  }
  draw () {
    this.d3el.select('.status')
      .text('Current Google Authentication: ' + this.model.status);
    this.d3el.select('.data')
      .text((this.model.getValues() || []).join('\n'));
  }
}

window.testView = new CustomView(d3.select('#myView'));
window.onload = () => {
  window.testView.render();
};
