export const FILTER_PRESETS = [
  {
    id: 'original',
    label: 'Original',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    hue: 0,
    blur: 0,
    cssFilter: 'none',
  },
  {
    id: 'vivid',
    label: 'Vivid Pop',
    brightness: 105,
    contrast: 120,
    saturation: 140,
    sepia: 0,
    hue: 0,
    blur: 0,
    cssFilter: 'contrast(120%) saturate(140%) brightness(105%)',
  },
  {
    id: 'bw',
    label: 'Monochrome',
    brightness: 100,
    contrast: 115,
    saturation: 0,
    sepia: 0,
    hue: 0,
    blur: 0,
    cssFilter: 'grayscale(100%) contrast(115%)',
  },
  {
    id: 'sepia',
    label: 'Sepia Nostalgia',
    brightness: 95,
    contrast: 105,
    saturation: 90,
    sepia: 80,
    hue: 0,
    blur: 0,
    cssFilter: 'sepia(80%) contrast(105%) brightness(95%)',
  },
  {
    id: 'warm',
    label: 'Warm Vintage',
    brightness: 105,
    contrast: 95,
    saturation: 115,
    sepia: 25,
    hue: -10,
    blur: 0,
    cssFilter: 'sepia(25%) saturate(115%) contrast(95%) brightness(105%) hue-rotate(-10deg)',
  },
  {
    id: 'cool',
    label: 'Cool Fade',
    brightness: 100,
    contrast: 90,
    saturation: 85,
    sepia: 0,
    hue: 15,
    blur: 0,
    cssFilter: 'saturate(85%) contrast(90%) hue-rotate(15deg)',
  },
];

export function getCombinedFilterCSS(presetId = 'original', brightness = 100, contrast = 100, saturation = 100) {
  const preset = FILTER_PRESETS.find(p => p.id === presetId) || FILTER_PRESETS[0];
  
  let filters = [];
  
  // Calculate relative adjustments
  const finalBrightness = (preset.brightness * (brightness / 100)).toFixed(1);
  const finalContrast = (preset.contrast * (contrast / 100)).toFixed(1);
  const finalSaturation = (preset.saturation * (saturation / 100)).toFixed(1);

  if (preset.id === 'bw') {
    filters.push('grayscale(100%)');
  }
  if (preset.sepia > 0) {
    filters.push(`sepia(${preset.sepia}%)`);
  }
  if (preset.hue !== 0) {
    filters.push(`hue-rotate(${preset.hue}deg)`);
  }

  filters.push(`brightness(${finalBrightness}%)`);
  filters.push(`contrast(${finalContrast}%)`);
  filters.push(`saturate(${finalSaturation}%)`);

  return filters.join(' ');
}
