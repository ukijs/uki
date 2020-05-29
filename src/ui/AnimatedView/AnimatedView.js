import createMixinAndDefault from '../../utils/createMixinAndDefault.js';
import View from '../../View.js';

const { AnimatedView, AnimatedViewMixin } = createMixinAndDefault({
  DefaultSuperClass: View,
  classDefFunc: SuperClass => {
    class AnimatedView extends SuperClass {
      constructor (options) {
        super(options);
        this.stop = false;
        this.framerate = options.framerate || 60;
        this.on('drawFinished.AnimatedViewMixin', () => {
          this.off('drawFinished.AnimatedViewMixin');
          this.startAnimationLoop();
        });
      }
      startAnimationLoop () {
        this.stop = false;
        const timestamp = () => {
          return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
        };

        let now;
        let dt = 0;
        let last = timestamp();
        let step = 1 / this.framerate;

        const frame = () => {
          if (this.stop) {
            return;
          }
          now = timestamp();
          dt = dt + Math.min(1, (now - last) / 1000);
          while (dt > step) {
            dt = dt - step;
            this.drawFrame(this.d3el, dt);
          }
          last = now;
          window.requestAnimationFrame(frame);
        };
        window.requestAnimationFrame(frame);
      }
      stopAnimationLoop () {
        this.stop = true;
      }
      drawFrame (d3el, timeSinceLastFrame) {}
    }
    return AnimatedView;
  }
});
export { AnimatedView, AnimatedViewMixin };
