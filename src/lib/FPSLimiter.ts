/**
 * Global FPS state — kept as a lightweight proxy to userSettings.fps
 * for backward-compatible reads from App.tsx's RAF loop.
 */

import { userSettings } from './UserSettings';

/**
 * Convenience alias — the rendering loop reads fpsLimiter.fps each frame.
 * The actual value lives in userSettings, updated by wallpaperPropertyListener.
 */
const fpsLimiter = {
  get fps(): number {
    return userSettings.fps;
  },
  set fps(v: number) {
    userSettings.fps = v;
  },
};

export { fpsLimiter };
