/* globals d3 */
import { View, google } from '../uki.esm.js';

class CustomView extends View {
  constructor (options) {
    super(options);

    this.model = new google.AuthSheetModel({
      // Point this to a spreadsheet that your google account has write access to:
      spreadsheetId: '15u2YOyqXpGr8krpBP55qC4gxmAwDwFfKLEgyuoIpnMM',
      mode: google.AuthSheetModel.MODE.AUTH_READ_WRITE,
      sheet: 'Class Data'
    });
    // You should include your own apiKey / clientId. These should work for
    // the demo on localhost, but you'll need your own for anything else
    this.model.setupAuth(
      'AIzaSyAGvxpHTf5dEcnvsL7_DBynOjhRyh2hmuo',
      '785875941724-nt92f7nc2dpr8ha4uo16ls4eld9bvfed.apps.googleusercontent.com'
    );

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
          {
            'Student Name': 'Jeffrey',
            Gender: 'Male',
            'Class Level': '6. Retired Dude',
            'Home State': 'WA',
            Major: 'Abiding'
          },
          {
            'Student Name': 'Walter',
            Gender: 'Male',
            'Class Level': '5. Former Soldier',
            'Deployment': 'Vietnam',
            'Home State': 'CA',
            Major: 'Bowling'
          },
          {
            'Student Name': 'Donny',
            Gender: 'Male',
            'Home State': 'CA',
            Errata: 'Possible figment of Walter\'s imagination'
          }
        ]);
      });
    this.d3el.append('button')
      .text('Reset')
      .on('click', async () => {
        await this.model.removeRows(31, this.model.getRawTable().length);
        await this.model.removeColumn('Deployment');
        await this.model.removeColumn('Errata');
      });
    this.d3el.append('div')
      .classed('status', true);
    this.d3el.append('div')
      .classed('data', true);
  }
  draw () {
    this.d3el.select('.status')
      .text('Current Google Authentication: ' + this.model.status);
    let dataRows = this.d3el.select('.data').selectAll('pre')
      .data(this.model.getValues() || []);
    dataRows.exit().remove();
    const dataRowsEnter = dataRows.enter().append('pre');
    dataRows = dataRows.merge(dataRowsEnter);

    dataRows.text(d => JSON.stringify(d));
  }
}

window.testView = new CustomView({ d3el: d3.select('#myView') });
window.onload = () => {
  window.testView.render();
};
