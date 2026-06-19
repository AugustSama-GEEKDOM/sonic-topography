import * as THREE from 'three';

export interface ThemeColors {
  name: string;
  id: string;
  uBaseColor1: THREE.Color;
  uBaseColor2: THREE.Color;
  uCoolCore: THREE.Color;
  uCoolEdge: THREE.Color;
  uWarmCore: THREE.Color;
  uWarmEdge: THREE.Color;
  uRippleColor: THREE.Color;
  uGlowIntensity: number;
}

/**
 * Safely parse a CSS color string into a THREE.Color.
 * Falls back to the provided default if parsing fails.
 */
function safeParseColor(colorStr: string, fallback: THREE.Color): THREE.Color {
  if (!colorStr) return fallback;
  try {
    const c = new THREE.Color(colorStr);
    if (isNaN(c.r) || isNaN(c.g) || isNaN(c.b)) return fallback;
    return c;
  } catch {
    return fallback;
  }
}

/**
 * Create a dynamic ThemeColors from Wallpaper Engine's MediaThumbnailListener colors.
 *
 * @param primaryColor - Dominant album art color (CSS string)
 * @param secondaryColor - Second most prominent color (CSS string)
 * @param tertiaryColor - Third most prominent color (CSS string)
 * @param textColor - High-contrast text-safe color (CSS string)
 * @param highContrastColor - Black or white for maximum contrast (CSS string)
 */
export function createDynamicTheme(
  primaryColor: string,
  secondaryColor: string,
  tertiaryColor: string,
  textColor: string,
  highContrastColor: string,
): ThemeColors {
  const fallbackPrimary = new THREE.Color(0.0, 0.3, 1.0);

  const primary = safeParseColor(primaryColor, fallbackPrimary);
  const secondary = safeParseColor(secondaryColor, new THREE.Color(0.6, 0.2, 1.0));
  const tertiary = safeParseColor(tertiaryColor, new THREE.Color(1.0, 0.2, 0.1));
  const text = safeParseColor(textColor, new THREE.Color(1.0, 1.0, 1.0));
  const highContrast = safeParseColor(highContrastColor, new THREE.Color(0.0, 0.0, 0.0));

  // Darken primary for backgrounds — keep the hue but drop luminance
  const darkBg1 = primary.clone().multiplyScalar(0.08);
  const darkBg2 = primary.clone().multiplyScalar(0.15);

  // Warm edge: blend tertiary toward secondary for a complementary accent
  const warmEdge = tertiary.clone().lerp(secondary, 0.4);

  // Glow intensity: higher for dark album art (needs punch), lower for bright art.
  // highContrastColor tells us whether the art is predominantly dark (white contrast) or light (black contrast).
  const isDarkArt = highContrast.r + highContrast.g + highContrast.b > 1.5; // white needed → art is dark
  const glowIntensity = isDarkArt ? 1.5 : 1.1;

  return {
    name: 'Dynamic',
    id: 'dynamic',
    uBaseColor1: darkBg1,
    uBaseColor2: darkBg2,
    uCoolCore: primary.clone(),
    uCoolEdge: secondary.clone(),
    uWarmCore: tertiary.clone(),
    uWarmEdge: warmEdge,
    uRippleColor: text.clone(),
    uGlowIntensity: glowIntensity,
  };
}

export const themes: Record<string, ThemeColors> = {
  'dynamic': createDynamicTheme(
    '#0044ff',
    '#9933ff',
    '#ff3322',
    '#ffffff',
    '#000000',
  ),
  'nocturnal': {
    name: 'Nocturnal',
    id: 'nocturnal',
    uBaseColor1: new THREE.Color(0.01, 0.02, 0.04),
    uBaseColor2: new THREE.Color(0.03, 0.05, 0.09),
    uCoolCore: new THREE.Color(0.0, 0.3, 1.0),
    uCoolEdge: new THREE.Color(0.6, 0.2, 1.0),
    uWarmCore: new THREE.Color(1.0, 0.2, 0.1),
    uWarmEdge: new THREE.Color(1.0, 0.6, 0.0),
    uRippleColor: new THREE.Color(0.2, 0.9, 1.0),
    uGlowIntensity: 1.0,
  },
  'neon-tokyo': {
    name: 'Neon Tokyo',
    id: 'neon-tokyo',
    uBaseColor1: new THREE.Color(0.01, 0.005, 0.02),
    uBaseColor2: new THREE.Color(0.04, 0.01, 0.06),
    uCoolCore: new THREE.Color(1.0, 0.1, 0.6), // Hot pink
    uCoolEdge: new THREE.Color(0.6, 0.1, 1.0), // Deep purple
    uWarmCore: new THREE.Color(0.1, 1.0, 0.8), // Mint cyan
    uWarmEdge: new THREE.Color(0.1, 0.4, 1.0), // Royal blue
    uRippleColor: new THREE.Color(1.0, 1.0, 1.0),
    uGlowIntensity: 1.5,
  },
  'cyber-forest': {
    name: 'Cyber Forest',
    id: 'cyber-forest',
    uBaseColor1: new THREE.Color(0.01, 0.02, 0.01),
    uBaseColor2: new THREE.Color(0.02, 0.05, 0.02),
    uCoolCore: new THREE.Color(0.1, 1.0, 0.5), // Bright emerald
    uCoolEdge: new THREE.Color(0.05, 0.5, 0.3), // Dark green
    uWarmCore: new THREE.Color(0.8, 1.0, 0.1), // Lime yellow
    uWarmEdge: new THREE.Color(0.9, 0.5, 0.1), // Orange
    uRippleColor: new THREE.Color(0.6, 1.0, 0.3),
    uGlowIntensity: 1.3,
  },
  'minimal-monochrome': {
    name: 'Minimal Monochrome',
    id: 'minimal-monochrome',
    uBaseColor1: new THREE.Color(0.02, 0.02, 0.02),
    uBaseColor2: new THREE.Color(0.06, 0.06, 0.06),
    uCoolCore: new THREE.Color(0.9, 0.9, 0.9), // Bright silver
    uCoolEdge: new THREE.Color(0.4, 0.4, 0.4), // Mid grey
    uWarmCore: new THREE.Color(1.0, 1.0, 1.0), // Pure white
    uWarmEdge: new THREE.Color(0.7, 0.7, 0.7), // Light grey
    uRippleColor: new THREE.Color(1.0, 1.0, 1.0),
    uGlowIntensity: 0.8,
  }
};
