/* globals d3, jQuery */
import { View } from '../uki.esm.js';

class CustomView extends View {
  constructor (d3el) {
    super(d3el, [
      // Can load plain text
      { type: 'text', url: 'template.html', then: data => { console.log('loaded template', data); } },
      // Can load data via d3.js
      { type: 'csv', url: 'data.csv', then: data => { console.log('loaded csv', data); } },
      // Can load CSS
      { type: 'css', url: 'style.css', then: linkTag => { console.log('loaded css', linkTag); } },
      // Can load LESS
      { type: 'less', url: 'style.less', then: styleTag => { console.log('loaded less', styleTag); } },
      // Can do raw fetch requests
      { type: 'fetch', url: 'data.json', then: async data => { console.log('raw fetch finished', await data.json()); } },
      // Can load other JS libraries
      { type: 'js',
        url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js',
        then: scriptTag => { console.log('legacy JS loaded', scriptTag); } },
      // Can wait for custom promises
      new Promise((resolve, reject) => {
        window.setTimeout(() => {
          console.log('raw promise resolved');
          resolve('Custom promise result');
        }, 1000);
      })
    ]);
  }
  setup () {
    console.log('called setup()', this.resources);
    // Normally, you'd probably do something like
    // this.d3el.html(this.resources[0]), but this example also wants to demo
    // that the jQuery library that we loaded works:
    jQuery(this.d3el.node()).html(this.resources[0]);
  }
  draw () {
    console.log('called draw()', this.resources);
    this.d3el.select('p')
      .text('Hello, world!');
    this.d3el.select('.data')
      .selectAll('pre').data(this.resources[1])
      .enter().append('pre')
      .text(d => JSON.stringify(d, null, 2));
  }
}

window.testView = new CustomView();
window.testView.render(d3.select('#myView'));
