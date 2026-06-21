import { Canvas, type RootState } from '@react-three/fiber';
import { UI } from './components/UI/UI';
import { MapScene } from './components/AudioVisualizer/MapScene';
import { useState, useEffect, useCallback } from 'react';
import { themes, createDynamicTheme } from './lib/themes';
import { engine } from './lib/AudioEngine';
import { fpsLimiter } from './lib/FPSLimiter';
import { initUserSettings } from './lib/UserSettings';

// ── Silence THREE.Clock deprecation warning ──
// @react-three/fiber (v9) internally creates `new THREE.Clock()` for its store,
// but Three.js ≥ 0.184 marks Clock as deprecated in favor of Timer.
// This is a framework-level concern — we suppress the noise here until R3F migrates.
(() => {
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
    origWarn.apply(console, args);
  };
})();

/** Wallpaper Engine media thumbnail event shape */
interface MediaThumbnailEvent {
  thumbnail: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  textColor: string;
  highContrastColor: string;
}

/** Wallpaper Engine media properties event shape */
interface MediaPropertiesEvent {
  title: string;
  artist: string;
  subTitle: string;
  albumTitle: string;
  albumArtist: string;
  genres: string;
  contentType: string;
}

/** Wallpaper Engine media status event shape */
interface MediaStatusEvent {
  enabled: boolean;
}

declare global {
  interface Window {
    wallpaperRegisterMediaThumbnailListener?: (callback: (event: MediaThumbnailEvent) => void) => void;
    wallpaperRegisterMediaPropertiesListener?: (callback: (event: MediaPropertiesEvent) => void) => void;
    wallpaperRegisterMediaStatusListener?: (callback: (event: MediaStatusEvent) => void) => void;
    wallpaperRegisterAudioListener?: (callback: (audioArray: number[]) => void) => void;
    wallpaperPropertyListener?: {
      applyGeneralProperties?: (properties: { fps?: number }) => void;
      applyUserProperties?: (properties: Record<string, { value: any }>) => void;
    };
  }
}

export default function App() {
  const [theme, setTheme] = useState('nocturnal');
  const [isMediaIntegrationEnabled, setIsMediaIntegrationEnabled] = useState(false);
  const [mediaProperties, setMediaProperties] = useState<MediaPropertiesEvent | null>(null);
  const [albumThumbnail, setAlbumThumbnail] = useState('');

  const applyDynamicTheme = useCallback((event: MediaThumbnailEvent) => {
    const dynamicTheme = createDynamicTheme(
      event.primaryColor,
      event.secondaryColor,
      event.tertiaryColor,
      event.textColor,
      event.highContrastColor,
    );
    themes['dynamic'] = dynamicTheme;
    setTheme('dynamic');
  }, []);

  // Register Wallpaper Engine media integration listeners
  useEffect(() => {
    // ── Unified wallpaperPropertyListener: FPS + user-defined properties ──
    initUserSettings();

    // Media status listener — detects whether the user enabled media integration
    if (window.wallpaperRegisterMediaStatusListener) {
      window.wallpaperRegisterMediaStatusListener((event: MediaStatusEvent) => {
        setIsMediaIntegrationEnabled(event.enabled);
      });
    }

    // Media thumbnail listener — provides album art colors for dynamic theming + cover image
    if (window.wallpaperRegisterMediaThumbnailListener) {
      window.wallpaperRegisterMediaThumbnailListener((event: MediaThumbnailEvent) => {
        applyDynamicTheme(event);
        setAlbumThumbnail(event.thumbnail || '');
      });
    }

    // Media properties listener — provides track title, artist, album etc.
    if (window.wallpaperRegisterMediaPropertiesListener) {
      window.wallpaperRegisterMediaPropertiesListener((event: MediaPropertiesEvent) => {
        setMediaProperties({ ...event });
      });
    }

    // Audio listener — feeds system audio frequency data into the visualizer
    if (window.wallpaperRegisterAudioListener) {
      window.wallpaperRegisterAudioListener((audioArray: number[]) => {
        engine.feedWallpaperAudio(audioArray);
      });
    }
  }, [applyDynamicTheme]);

  // Build combined media info object from properties + thumbnail
  const mediaInfo = mediaProperties ? {
    title: mediaProperties.title || '',
    artist: mediaProperties.artist || '',
    albumTitle: mediaProperties.albumTitle || '',
    albumArtist: mediaProperties.albumArtist || '',
    thumbnail: albumThumbnail,
    contentType: mediaProperties.contentType || '',
  } : null;

  const t = themes[theme] || themes['nocturnal'];

  // Convert THREE.Color to css strings
  const bgDark = `#${t.uBaseColor1.getHexString()}`;

  return (
    <div className="relative w-screen h-screen overflow-hidden text-[#94a3b8] font-sans selection:bg-blue-500/30 transition-colors duration-1000" style={{ backgroundColor: bgDark }}>
      <UI
        theme={theme}
        onThemeChange={setTheme}
        isMediaIntegrationEnabled={isMediaIntegrationEnabled}
        mediaInfo={mediaInfo}
      />
      <div className="absolute inset-0 z-0">
        <Canvas
          frameloop="demand"
          onCreated={(state: RootState) => {
            // ── Custom RAF loop with Wallpaper Engine FPS limiting ──
            // Pattern taken from the official FPS Limiter tutorial:
            // https://docs.wallpaperengine.io/en/web/fps.html
            let last = performance.now() / 1000;
            let fpsThreshold = 0;

            function run() {
              requestAnimationFrame(run);

              // Figure out how much time has passed since the last animation
              const now = performance.now() / 1000;
              const dt = Math.min(now - last, 1);
              last = now;

              // If there is an FPS limit, abort updating if we have reached the desired FPS
              const fps = fpsLimiter.fps;
              if (fps > 0) {
                fpsThreshold += dt;
                if (fpsThreshold < 1.0 / fps) {
                  return; // skip this frame
                }
                fpsThreshold -= 1.0 / fps;
              }

              // FPS limit not reached — trigger one R3F render cycle
              state.invalidate();
            }

            requestAnimationFrame(run);
          }}
          camera={{ position: [35, 25, 35], fov: 45 }}
        >
          <MapScene theme={theme} />
        </Canvas>
      </div>
    </div>
  );
}
