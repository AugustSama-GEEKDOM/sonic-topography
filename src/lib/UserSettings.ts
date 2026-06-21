/**
 * Wallpaper Engine User Properties — unified settings module.
 *
 * Handles both built-in (applyGeneralProperties → FPS) and user-defined
 * (applyUserProperties → sliders/checkboxes) properties through a single
 * wallpaperPropertyListener.
 *
 * Users create these properties in the Wallpaper Engine editor:
 *   Edit → Change Project Settings → Add Property
 *
 * Property keys must match EXACTLY what's below.
 */

/** Default values — used when Wallpaper Engine is not present (browser dev). */
const defaults = {
  fps: 0,        // applyGeneralProperties.fps

  // ── User-defined sliders ──
  /** Audio response sensitivity multiplier (0.1 – 5.0, default 1.0) */
  audiosensitivity: 1.0,
  /** Glow / light intensity multiplier (0.0 – 3.0, default 1.0) */
  glowintensity: 1.0,
  /** Camera mouse-follow sensitivity (0.1 – 3.0, default 1.0) */
  camerasensitivity: 1.0,
  /** Field-of-view zoom level (0.3 – 3.0, default 1.0; larger = closer) */
  zoomlevel: 1.0,
};

/** Reactive settings store — read directly by any module. */
const userSettings = { ...defaults };

/**
 * Register the global wallpaperPropertyListener.
 * Must be called once at app startup, BEFORE any render loop.
 *
 * Merges:
 *  - applyGeneralProperties  → FPS limit
 *  - applyUserProperties     → user-defined sliders/checkboxes etc.
 */
function initUserSettings(): void {
  (window as any).wallpaperPropertyListener = {
    applyGeneralProperties: function (properties: { fps?: number }) {
      if (typeof properties.fps === 'number') {
        userSettings.fps = properties.fps;
      }
    },

    applyUserProperties: function (properties: Record<string, { value: any }>) {
      if (properties.audiosensitivity) {
        const v = Number(properties.audiosensitivity.value);
        if (!isNaN(v)) userSettings.audiosensitivity = v;
      }
      if (properties.glowintensity) {
        const v = Number(properties.glowintensity.value);
        if (!isNaN(v)) userSettings.glowintensity = v;
      }
      if (properties.camerasensitivity) {
        const v = Number(properties.camerasensitivity.value);
        if (!isNaN(v)) userSettings.camerasensitivity = v;
      }
      if (properties.zoomlevel) {
        const v = Number(properties.zoomlevel.value);
        if (!isNaN(v)) userSettings.zoomlevel = v;
      }
      // Add more user properties here as needed
    },
  };
}

export { userSettings, initUserSettings, defaults };
