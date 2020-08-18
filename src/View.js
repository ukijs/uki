/* globals d3, HTMLElement */
import { Model } from './Model.js';
import * as utils from './utils/utils.js';

const { View, ViewMixin } = utils.createMixinAndDefault({
  DefaultSuperClass: Model,
  classDefFunc: SuperClass => {
    class View extends SuperClass {
      constructor (options = {}) {
        super(options);
        this.dirty = true;
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
        if (d3el instanceof HTMLElement) {
          d3el = d3.select(HTMLElement);
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
            this.dirty = true;
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
        this._pauseRenderReasons[reason] = true;
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
          this._pauseRenderReasons['No d3el'] = true;
        }
      }

      get renderPaused () {
        return Object.keys(this._pauseRenderReasons).length > 0;
      }

      async render (d3el = this.d3el) {
        this.claimD3elOwnership(d3el, true);

        await this.ready;
        if (this.renderPaused) {
          // Don't execute any render calls until all resources are loaded,
          // we've actually been given a d3 element to work with, and we're not
          // paused for another reason
          return new Promise((resolve, reject) => {
            this._renderResolves.push(resolve);
          });
        }

        if (this.dirty && this._setupPromise === undefined) {
          // Need a fresh render; call setup immediately
          this.updateContainerCharacteristics(this.d3el);
          this._setupPromise = this.setup(this.d3el);
          this.dirty = false;
          try {
            await this._setupPromise;
          } catch (err) {
            if (this.setupError) {
              this._setupPromise = this.setupError(this.d3el, err);
              await this._setupPromise;
            } else {
              throw err;
            }
          }
          delete this._setupPromise;
          this.trigger('setupFinished');
        }

        // Debounce the actual draw call, and return a promise that will resolve
        // when draw() actually finishes
        return new Promise((resolve, reject) => {
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
            let result;
            try {
              result = await this.draw(this.d3el);
            } catch (err) {
              if (this.drawError) {
                result = await this.drawError(this.d3el, err);
              } else {
                throw err;
              }
            }
            this.trigger('drawFinished');
            const temp = this._renderResolves;
            this._renderResolves = [];
            for (const r of temp) {
              r(result);
            }
          }, this.debounceWait);
        });
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
        var outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.width = '100px';
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

        d3el.node().appendChild(outer);

        var widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = 'scroll';

        // add innerdiv
        var inner = document.createElement('div');
        inner.style.width = '100%';
        outer.appendChild(inner);

        var widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
      }

      static initForD3Selection (selection, optionsAccessor = d => d) {
        const ClassDef = this;
        selection.each(function () {
          const view = new ClassDef(optionsAccessor(...arguments));
          view.render(d3.select(this));
        });
      }

      static iterD3Selection (selection, func) {
        selection.each(function () {
          func.call(this, this.__ukiView__, ...arguments);
        });
      }
    }
    return View;
  }
});

export { View, ViewMixin };
