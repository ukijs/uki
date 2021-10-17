import { Model } from './Model.js';
import * as utils from './utils/utils.js';

const { View, ViewMixin } = utils.createMixinAndDefault({
  DefaultSuperClass: Model,
  classDefFunc: SuperClass => {
    class View extends SuperClass {
      constructor (options = {}) {
        super(options);
        this.setupFinished = false;
        this._renderResult = {};
        this.drawFinished = false;
        this.debounceWait = options.debounceWait || 100;
        this._mutationObserver = null;
        this._drawTimeout = null;
        this._renderResolves = [];
        this.resetPauseReasons();
        this.claimD3elOwnership(options.d3el || null, true);
        if (!options.suppressInitialRender) {
          this.render();
        }
      }

      claimD3elOwnership (d3el, skipRenderCall = false) {
        if (d3el instanceof globalThis.HTMLElement) {
          d3el = globalThis.d3.select(globalThis.HTMLElement);
        }
        if (d3el) {
          if (d3el.size() === 0) {
            console.warn('Ignoring empty d3 selection assigned to uki.js View');
            return;
          } else if (d3el.size() > 1) {
            console.warn('Ignoring d3 selection with multiple nodes assigned to uki.js View');
            return;
          }

          const newNode = d3el.node();

          let claimNode = false;
          let revokeOldOwnership = false;
          if (!this.d3el) {
            // Always claim if we don't currently have an element
            claimNode = true;
            revokeOldOwnership = !!newNode.__ukiView__;
          } else {
            // Only go through the process of claiming the new node if it's
            // different from our current one
            claimNode = newNode !== this.d3el.node();
            revokeOldOwnership = claimNode && newNode.__ukiView__;
          }

          if (revokeOldOwnership) {
            // The new element already had a view; let it know that we've taken over
            newNode.__ukiView__.revokeD3elOwnership();
          }

          if (claimNode) {
            if (this.d3el) {
              // We've been given a different element than what we used before
              const oldNode = this.d3el.node();
              delete oldNode.__ukiView__;
              if (this._mutationObserver) {
                this._mutationObserver.disconnect();
              }
            }

            // Assign ourselves the new new node
            newNode.__ukiView__ = this;
            this.d3el = d3el;
            this.setupFinished = false;
            this.drawFinished = false;
            delete this._pauseRenderReasons['No d3el'];

            // Detect if the DOM node is ever removed
            this._mutationObserver = new globalThis.MutationObserver(mutationList => {
              for (const mutation of mutationList) {
                for (const removedNode of mutation.removedNodes) {
                  if (removedNode === newNode) {
                    this.revokeD3elOwnership();
                  }
                }
              }
            });
            this._mutationObserver.observe(newNode.parentNode, { childList: true });

            if (!skipRenderCall) {
              this.render();
            }
          }
        }
      }

      revokeD3elOwnership () {
        if (this.d3el) {
          delete this.d3el.node().__ukiView__;
        }
        if (this._mutationObserver) {
          this._mutationObserver.disconnect();
        }
        this.d3el = null;
        this.pauseRender('No d3el');
      }

      pauseRender (reason) {
        this._pauseRenderReasons[reason] = null;
        this.trigger('pauseRender', reason);
      }

      resumeRender (reason) {
        if (!reason) {
          this.resetPauseReasons();
        } else {
          delete this._pauseRenderReasons[reason];
        }
        if (!this.renderPaused) {
          this.trigger('resumeRender');
          this.render();
        }
      }

      resetPauseReasons () {
        this._pauseRenderReasons = {};
        if (!this.d3el) {
          this._pauseRenderReasons['No d3el'] = null;
        }
      }

      get renderPausedReasons () {
        return Object.keys(this._pauseRenderReasons);
      }

      get renderPaused () {
        return this.renderPausedReasons.length > 0;
      }

      async render (d3el = this.d3el) {
        this.claimD3elOwnership(d3el, true);

        await this.ready;
        if (this.renderPaused) {
          // Don't execute any render calls until all resources are loaded,
          // we've actually been given a d3 element to work with, and we're not
          // paused for another reason
          const promiseList = [];
          for (const [reason, priorPromise] of Object.entries(this._pauseRenderReasons)) {
            if (priorPromise === null) {
              this._pauseRenderReasons[reason] = new Promise((resolve, reject) => {
                this._renderResolves.push(resolve);
              });
            }
            promiseList.push(this._pauseRenderReasons[reason]);
          }
          return Promise.all(promiseList);
        }

        if (!this.setupFinished && this._setupPromise === undefined) {
          // Need a fresh render; call setup immediately
          this.updateContainerCharacteristics(this.d3el);
          try {
            this._setupPromise = this.setup(this.d3el);
            if (this._setupPromise instanceof Promise) {
              this._renderResult.setup = await this._setupPromise;
            } else {
              this._renderResult.setup = this._setupPromise;
              this._setupPromise = Promise.resolve();
            }
          } catch (err) {
            if (this.setupError) {
              this._setupPromise = this.setupError(this.d3el, err);
              if (this._setupPromise instanceof Promise) {
                this._renderResult.setupError = await this._setupPromise;
              } else {
                this._renderResult.setupError = this._setupPromise;
                this._setupPromise = Promise.resolve();
              }
            } else {
              throw err;
            }
          }
          this.setupFinished = true;
          delete this._setupPromise;
          this.trigger('setupFinished', { ...this._renderResult });
        }

        // Debounce the actual draw call, and return a promise that will resolve
        // when draw() actually finishes
        if (this._drawPromise) {
          return this._drawPromise;
        }
        this._drawPromise = new Promise((resolve, reject) => {
          this._renderResolves.push(resolve);
          clearTimeout(this._drawTimeout);
          this._drawTimeout = setTimeout(async () => {
            this._drawTimeout = null;
            if (this._setupPromise) {
              // Don't try / catch here because if there's an error, it will
              // be handled exactly once in the original context
              await this._setupPromise;
            }
            if (this.renderPaused) {
              // Check if we've been paused after setup(), but before draw(); if
              // we've been paused, wait for another render() call to resolve
              // everything in this._renderResolves
              return;
            }
            const renderResultCopy = {
              ...this._renderResult
            };
            try {
              renderResultCopy.draw = await this.draw(this.d3el);
            } catch (err) {
              if (this.drawError) {
                renderResultCopy.drawError = await this.drawError(this.d3el, err);
              } else {
                throw err;
              }
            }
            this.drawFinished = true;
            this.trigger('drawFinished', renderResultCopy);
            const temp = this._renderResolves;
            this._renderResolves = [];
            delete this._drawPromise;
            for (const r of temp) {
              r(renderResultCopy);
            }
          }, this.debounceWait);
        });
        return this._drawPromise;
      }

      async setup (d3el = this.d3el) {}

      async draw (d3el = this.d3el) {}

      updateContainerCharacteristics (d3el) {
        this.emSize = parseFloat(d3el.style('font-size'));
        this.scrollBarSize = this.computeScrollBarSize(d3el);
      }

      getBounds (d3el = this.d3el) {
        if (d3el) {
          return d3el.node().getBoundingClientRect();
        } else {
          return { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 };
        }
      }

      computeScrollBarSize (d3el) {
        // blatantly adapted from SO thread:
        // http://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.width = '100px';
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

        d3el.node().appendChild(outer);

        const widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = 'scroll';

        // add innerdiv
        const inner = document.createElement('div');
        inner.style.width = '100%';
        outer.appendChild(inner);

        const widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
      }

      static async initForD3Selection (selection, optionsAccessor = d => d) {
        const ClassDef = this;
        const promises = [];
        selection.each(function () {
          const view = new ClassDef(optionsAccessor(...arguments));
          promises.push(view.render(globalThis.d3.select(this)));
        });
        return Promise.all(promises);
      }

      static async iterD3Selection (selection, func) {
        const promises = [];
        selection.each(function () {
          promises.push(func.call(this, this.__ukiView__, ...arguments));
        });
        return Promise.all(promises);
      }
    }
    return View;
  }
});

export { View, ViewMixin };
