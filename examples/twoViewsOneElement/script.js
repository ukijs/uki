/* globals d3 */
import * as uki from '../uki.esm.js';

class CustomView extends uki.View {
  setup () {
    super.setup(...arguments);

    if (this.renderPaused) {
      throw new Error(`setup() called while paused for ${this === window.viewA ? 'A' : 'B'}`);
    }
    console.log(`setup() called for ${this === window.viewA ? 'A' : 'B'}`);

    this.d3el.html('');
    this.d3el.append('p').classed('owner', true);
    this.d3el.append('p').classed('aState', true);
    this.d3el.append('p').classed('bState', true);
    this.d3el.append('p').text('Switching in 5 sec...');
  }

  draw () {
    if (this.renderPaused) {
      throw new Error(`draw() called while paused for ${this === window.viewA ? 'A' : 'B'}`);
    }
    console.log(`draw() called for ${this === window.viewA ? 'A' : 'B'}`);

    this.d3el.select('.owner')
      .text(`Current element owner: ${this === window.viewA ? 'A' : 'B'}`);
    this.d3el.select('.aState')
      .text(`A is ${window.viewA.renderPaused ? '' : 'not'} paused`);
    this.d3el.select('.bState')
      .text(`B is ${window.viewB.renderPaused ? '' : 'not'} paused`);
  }
}

const d3el = d3.select('#myView');

console.log('Initializing A *without* d3el...');
window.viewA = new CustomView();
console.log('Initializing B *with* d3el; B.render() auto-called from the constructor...');
window.viewB = new CustomView({ d3el });

async function renderA () {
  console.log('Calling A.render() ...');
  await window.viewA.render(d3el);
  console.log('... A.render() promise resolved');
  window.setTimeout(() => {
    renderB();
  }, 5000);
}

async function renderB () {
  console.log('Calling B.render() ...');
  await window.viewB.render(d3el);
  console.log('... B.render() promise resolved');
  window.setTimeout(() => {
    renderA();
  }, 5000);
}

window.onload = renderA;
