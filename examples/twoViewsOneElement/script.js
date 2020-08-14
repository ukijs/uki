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

    this.d3el.select('.owner')
      .text(`draw() called for ${this === window.viewA ? 'A' : 'B'}`);
    this.d3el.select('.aState')
      .text(`A is ${window.viewA.renderPaused ? '' : 'not'} paused`);
    this.d3el.select('.bState')
      .text(`B is ${window.viewB.renderPaused ? '' : 'not'} paused`);
  }
}

const d3el = d3.select('#myView');

window.viewA = new CustomView({ d3el });
window.viewB = new CustomView({ d3el });

function renderA () {
  window.viewA.render(d3el);
  window.setTimeout(() => {
    renderB();
  }, 5000);
}

function renderB () {
  window.viewB.render(d3el);
  window.setTimeout(() => {
    renderA();
  }, 5000);
}

window.onload = renderA;
