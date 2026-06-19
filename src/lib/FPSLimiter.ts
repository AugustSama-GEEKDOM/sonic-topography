/**
 * Global FPS limiter — reads the user-configured FPS from Wallpaper Engine's
 * wallpaperPropertyListener and provides shouldRender() for custom render loops.
 *
 * Usage pattern follows the official Wallpaper Engine FPS Limiter tutorial:
 * https://docs.wallpaperengine.io/en/web/fps.html
 */

const fpsLimiter = {
  /** Current FPS limit set by the user (0 = unlimited) */
  fps: 0 as number,
};

/**
 * Register the wallpaperPropertyListener so Wallpaper Engine can push FPS updates.
 * Call once at app startup (before any render loop runs).
 */
function initFPSListener(): void {
  (window as any).wallpaperPropertyListener = {
    applyGeneralProperties: function (properties: { fps?: number }) {
      if (typeof properties.fps === 'number') {
        fpsLimiter.fps = properties.fps;
      }
    },
  };
}

export { fpsLimiter, initFPSListener };
