/**
 * Professional Image Editing Utilities
 * Reusable calculations for CSS filters, transforms, cropping, focal points,
 * adjustments, and non-destructive image manipulation.
 */

import { FILTER_PRESETS } from './filterPresets';

// Enhanced Filter Presets including new additions (Noir, Fade, Dramatic, Vintage)
export const EXTENDED_FILTER_PRESETS = [
  ...FILTER_PRESETS,
  {
    id: 'noir',
    label: 'Noir High Contrast',
    brightness: 90,
    contrast: 150,
    saturation: 0,
    sepia: 0,
    hue: 0,
    blur: 0,
    cssFilter: 'grayscale(100%) contrast(150%) brightness(90%)',
  },
  {
    id: 'fade',
    label: 'Matte Fade',
    brightness: 110,
    contrast: 85,
    saturation: 80,
    sepia: 10,
    hue: 0,
    blur: 0,
    cssFilter: 'brightness(110%) contrast(85%) saturate(80%) sepia(10%)',
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    brightness: 95,
    contrast: 140,
    saturation: 125,
    sepia: 0,
    hue: -5,
    blur: 0,
    cssFilter: 'contrast(140%) saturate(125%) brightness(95%) hue-rotate(-5deg)',
  },
  {
    id: 'vintage',
    label: 'Retro Film',
    brightness: 100,
    contrast: 95,
    saturation: 85,
    sepia: 40,
    hue: 10,
    blur: 0,
    cssFilter: 'sepia(40%) contrast(95%) saturate(85%) hue-rotate(10deg)',
  },
];

export const CROP_ASPECT_RATIOS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '4:5', label: '4:5 Portrait', ratio: 4 / 5 },
  { id: '5:4', label: '5:4 Landscape', ratio: 5 / 4 },
  { id: '3:4', label: '3:4 Photo', ratio: 3 / 4 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9 },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: 'original', label: 'Original', ratio: 'original' },
];

export const BLEND_MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'screen', label: 'Screen' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'darken', label: 'Darken' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'hard-light', label: 'Hard Light' },
];

/**
 * Normalizes all image adjustment parameters to safe defaults
 */
export function normalizeImageAdjustments(element = {}) {
  return {
    brightness: element.brightness ?? 100,
    contrast: element.contrast ?? 100,
    saturation: element.saturation ?? 100,
    temperature: element.temperature ?? 0,
    tint: element.tint ?? 0,
    exposure: element.exposure ?? 0,
    highlights: element.highlights ?? 0,
    shadows: element.shadows ?? 0,
    blur: element.blur ?? 0,
    sharpness: element.sharpness ?? 0,
    vignette: element.vignette ?? 0,
    vignetteIntensity: element.vignetteIntensity ?? 0.5,
    hue: element.hue ?? 0,
  };
}

/**
 * Normalizes crop specification safely
 */
export function normalizeCrop(crop = {}) {
  if (!crop) {
    return { enabled: false, x: 0, y: 0, width: 100, height: 100, aspectRatio: null, rotation: 0 };
  }
  return {
    enabled: crop.enabled ?? false,
    x: crop.x ?? 0,
    y: crop.y ?? 0,
    width: crop.width ?? 100,
    height: crop.height ?? 100,
    aspectRatio: crop.aspectRatio ?? null,
    rotation: crop.rotation ?? 0,
  };
}

/**
 * Normalizes focal point specification
 */
export function normalizeFocalPoint(fp = {}) {
  return {
    x: fp?.x ?? 50,
    y: fp?.y ?? 50,
  };
}

/**
 * Safe numeric adjustment clamp
 */
export function clampImageAdjustment(val, min = -100, max = 100) {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

/**
 * Computes complete CSS filter string from preset + manual adjustments
 */
export function getImageFilterStyle(element = {}) {
  const presetId = element.filterPreset || 'original';
  const preset = EXTENDED_FILTER_PRESETS.find((p) => p.id === presetId) || EXTENDED_FILTER_PRESETS[0];

  const adj = normalizeImageAdjustments(element);

  // Combine preset values with manual adjustment offsets
  // Exposure maps to additional brightness shift (-100..+100 -> 0.5x .. 1.5x)
  const exposureMult = 1 + adj.exposure / 100;
  const finalBrightness = (preset.brightness * (adj.brightness / 100) * exposureMult).toFixed(1);

  // Highlights and shadows alter contrast & brightness curves safely
  const contrastShift = adj.contrast + (adj.highlights - adj.shadows) * 0.25;
  const finalContrast = (preset.contrast * (contrastShift / 100)).toFixed(1);

  const finalSaturation = (preset.saturation * (adj.saturation / 100)).toFixed(1);

  // Temperature (Warm: positive hue/sepia shift, Cool: negative hue/blue shift)
  const tempHueShift = adj.temperature * 0.3;
  const tempSepia = adj.temperature > 0 ? Math.min(50, adj.temperature * 0.4) : 0;

  // Tint (Green/Magenta shift via hue-rotate)
  const tintHueShift = adj.tint * 0.3;

  const totalHue = ((preset.hue || 0) + adj.hue + tempHueShift + tintHueShift).toFixed(1);

  const filterParts = [];

  if (preset.id === 'bw' || preset.id === 'noir') {
    filterParts.push('grayscale(100%)');
  }

  const effectiveSepia = Math.min(100, (preset.sepia || 0) + tempSepia);
  if (effectiveSepia > 0) {
    filterParts.push(`sepia(${effectiveSepia.toFixed(1)}%)`);
  }

  if (Number(totalHue) !== 0) {
    filterParts.push(`hue-rotate(${totalHue}deg)`);
  }

  filterParts.push(`brightness(${finalBrightness}%)`);
  filterParts.push(`contrast(${finalContrast}%)`);
  filterParts.push(`saturate(${finalSaturation}%)`);

  if (adj.blur > 0) {
    // Map 0-100 blur to 0-20px blur for DOM preview
    const blurPx = (adj.blur * 0.2).toFixed(1);
    filterParts.push(`blur(${blurPx}px)`);
  }

  // Sharpness approximation using contrast & subtle brightness boost if > 0
  if (adj.sharpness > 0) {
    const contrastBoost = (100 + adj.sharpness * 0.2).toFixed(1);
    filterParts.push(`contrast(${contrastBoost}%)`);
  }

  return filterParts.join(' ');
}

/**
 * Computes CSS transform for image zoom, internal pan, flip, and rotation.
 * PIPELINE ORDER: translate(panX, panY) -> scale(zoom) -> rotate(rotation) -> scaleX/scaleY(flip)
 * This ensures pan operates in unscaled CSS pixel space relative to frame center.
 */
export function getImageTransformStyle(element = {}) {
  const zoom = element.zoom || 1;
  const panX = element.panX || 0;
  const panY = element.panY || 0;
  const rotation = element.rotation || 0;
  const flipH = element.flipH ? -1 : 1;
  const flipV = element.flipV ? -1 : 1;

  return `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg) scale(${flipH}, ${flipV})`;
}

/**
 * Calculates dynamic pan bounds and clamps panX / panY to prevent revealing blank space
 */
export function clampImagePan(panX, panY, cellWidth, cellHeight, zoom = 1, asset = null) {
  const z = Math.max(1, zoom);
  const cW = Math.max(10, cellWidth || 300);
  const cH = Math.max(10, cellHeight || 300);

  let imgRatio = 1;
  if (asset && asset.width && asset.height) {
    imgRatio = asset.width / asset.height;
  }

  const cellRatio = cW / cH;

  let baseW, baseH;
  if (imgRatio > cellRatio) {
    baseH = cH;
    baseW = baseH * imgRatio;
  } else {
    baseW = cW;
    baseH = baseW / imgRatio;
  }

  const renderedW = baseW * z;
  const renderedH = baseH * z;

  const maxPanX = Math.max(0, (renderedW - cW) / 2);
  const maxPanY = Math.max(0, (renderedH - cH) / 2);

  const clampedX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  const clampedY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  return { panX: clampedX, panY: clampedY, maxPanX, maxPanY };
}

/**
 * Calculates common value across multiple image elements (or returns 'Mixed')
 */
export function getMultiImageCommonValue(elements = [], key, defaultValue = '') {
  if (!Array.isArray(elements) || elements.length === 0) return defaultValue;
  const imageElements = elements.filter((el) => el.type === 'image');
  if (imageElements.length === 0) return defaultValue;

  const firstVal = imageElements[0][key];
  const allSame = imageElements.every((el) => el[key] === firstVal);

  return allSame ? (firstVal ?? defaultValue) : 'Mixed';
}

/**
 * Reset options helpers
 */
export function getResetImageAdjustmentsState() {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    temperature: 0,
    tint: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    blur: 0,
    sharpness: 0,
    vignette: 0,
    vignetteIntensity: 0.5,
    hue: 0,
  };
}

export function getResetImageCropState() {
  return {
    crop: { enabled: false, x: 0, y: 0, width: 100, height: 100, aspectRatio: null, rotation: 0 },
    focalPoint: { x: 50, y: 50 },
  };
}

export function getResetImageFiltersState() {
  return {
    filterPreset: 'original',
  };
}

export function getResetImageTransformState() {
  return {
    zoom: 1,
    panX: 0,
    panY: 0,
    flipH: false,
    flipV: false,
    rotation: 0,
  };
}

export function getResetAllImagePropertiesState(element) {
  return {
    ...getResetImageAdjustmentsState(),
    ...getResetImageCropState(),
    ...getResetImageFiltersState(),
    ...getResetImageTransformState(),
    borderRadius: 0,
    blendMode: 'normal',
    opacity: 1,
  };
}
