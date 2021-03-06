/* globals d3, jQuery */
import * as uki from '../uki.esm.js';

class CustomView extends uki.View {
  constructor () {
    super({
      resources: [
        { // Can load plain text
          name: 'template',
          type: 'text',
          url: 'template.html',
          then: data => {
            console.log('loaded template', data);
            return data;
          }
        },
        { // Can load data via d3.js
          name: 'CSV data',
          type: 'csv',
          url: 'data.csv',
          then: data => {
            console.log('loaded csv', data);
            return data;
          }
        },
        { // Can load CSS
          type: 'css',
          url: 'style.css',
          then: linkTag => {
            console.log('loaded css', linkTag);
            return linkTag;
          }
        },
        { // Can load LESS
          type: 'less',
          url: 'style.less',
          then: styleTag => {
            console.log('loaded less', styleTag);
            return styleTag;
          }
        },
        { // Can do raw fetch requests
          type: 'fetch',
          url: 'data.json',
          then: async data => {
            console.log('raw fetch finished', await data.json());
            return data;
          },
          loadAfter: ['template']
        },
        { // Can load other JS libraries
          type: 'js',
          url: 'https://code.jquery.com/jquery-3.4.1.min.js',
          extraAttributes: {
            integrity: 'sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=',
            crossorigin: 'anonymous'
          },
          then: scriptTag => {
            console.log('legacy JS loaded', scriptTag);
            return scriptTag;
          }
        },
        // Can wait for custom promises
        new Promise((resolve, reject) => {
          window.setTimeout(() => {
            console.log('raw promise resolved');
            resolve('Custom promise result');
          }, 1000);
        }),
        { // Placeholder resource to be updated later
          type: 'placeholder',
          value: null,
          name: 'placeholderDemo'
        },
        { // Custom logic, such as conditionally fetching something
          type: 'derivation',
          derive: async () => {
            console.log('deriving a value...');
            return 'this is a derived value';
          }
        }
      ]
    });

    // Give us a d3el *very* late to demo uki dynamically loading d3
    this.ready.then(() => {
      this.render(d3.select('#myView'));
    });
  }

  async setup () {
    console.log('called setup()', this.resources);
    // Normally, you'd probably do something like
    // this.d3el.html(this.resources[0]), but this example also wants to demo
    // that the jQuery library that we loaded works:
    jQuery(this.d3el.node()).html(this.getNamedResource('template'));

    this.d3el.select('#late').on('click', async () => {
      await this.loadLateResource({ type: 'less', url: 'late.less', name: 'late' });
      console.log('late resource loaded:', this.getNamedResource('late'));
    });
    this.d3el.select('#placeholder').on('click', async () => {
      console.log('Placeholder was:', this.getNamedResource('placeholderDemo'));
      await this.updateResource({
        type: 'derivation',
        name: 'placeholderDemo',
        derive: () => {
          return { 'Now an object': 'Updated successfully!' };
        }
      });
      console.log('Placeholder is:', this.getNamedResource('placeholderDemo'));
    });
  }

  async draw () {
    console.log('called draw()', this.resources);
    this.d3el.select('p')
      .text('This example demonstrates different types of resources that uki can load; see the console for many of the results');
    this.d3el.select('.data')
      .selectAll('pre').data(this.getNamedResource('CSV data'))
      .enter().append('pre')
      .text(d => JSON.stringify(d, null, 2));
  }
}

window.testView = new CustomView();
