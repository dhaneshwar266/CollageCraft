/**
 * Advanced Text Formatting & Measurement Utilities
 */

export const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
];

export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 120, 144];

export const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
];

export const LINE_HEIGHTS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0, 2.5];
export const LETTER_SPACINGS = [-5, -2, 0, 1, 2, 4, 8, 12];

/**
 * Normalizes text element data schema with safe defaults
 */
export function normalizeTextElement(textData = {}) {
  const isBgPillLegacy = textData.bgPill === true;

  return {
    id: textData.id || `text-${Date.now()}`,
    type: 'text',
    name: textData.name || (textData.text ? `"${textData.text.slice(0, 15)}"` : 'Text Layer'),
    x: textData.x ?? 50,
    y: textData.y ?? 50,
    width: textData.width ?? 200,
    height: textData.height ?? 50,
    rotation: textData.rotation ?? 0,
    opacity: textData.opacity ?? 1,
    visible: textData.visible ?? true,
    locked: textData.locked ?? false,
    zIndex: textData.zIndex ?? 200,
    groupId: textData.groupId || null,

    // Typography
    text: textData.text || 'YOUR CAPTION',
    fontFamily: textData.fontFamily || 'Inter',
    fontSize: textData.fontSize ?? 48,
    fontWeight: textData.fontWeight ?? (textData.bold ? 700 : 400),
    fontStyle: textData.fontStyle || (textData.italic ? 'italic' : 'normal'),
    color: textData.color || '#ffffff',

    // Alignment
    textAlign: textData.textAlign || textData.alignment || 'center',
    verticalAlign: textData.verticalAlign || 'middle',

    // Spacing
    lineHeight: textData.lineHeight ?? 1.2,
    letterSpacing: textData.letterSpacing ?? 0,

    // Case & Decoration
    textTransform: textData.textTransform || 'none',
    textDecoration: textData.textDecoration || 'none',

    // Background & Box
    backgroundColor: textData.backgroundColor || (isBgPillLegacy ? textData.bgPillColor || 'rgba(15, 23, 42, 0.85)' : 'transparent'),
    backgroundOpacity: textData.backgroundOpacity ?? 1,
    padding: textData.padding ?? (isBgPillLegacy ? 8 : 0),
    borderWidth: textData.borderWidth ?? 0,
    borderColor: textData.borderColor || 'transparent',
    borderRadius: textData.borderRadius ?? (isBgPillLegacy ? 12 : 0),

    // Effects
    shadow: textData.shadow || {
      enabled: false,
      color: '#000000',
      opacity: 0.25,
      blur: 4,
      offsetX: 0,
      offsetY: 2,
    },
    outline: textData.outline || {
      enabled: false,
      color: '#000000',
      width: 0,
    },

    autoFit: textData.autoFit ?? false,
  };
}

/**
 * Transforms string display value according to textTransform setting
 */
export function getTextTransformedValue(text = '', transform = 'none') {
  if (!text) return '';
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    default:
      return text;
  }
}

/**
 * Generates inline CSS style object for rendering text element in canvas
 */
export function getTextCSSStyles(txt) {
  const norm = normalizeTextElement(txt);

  const styles = {
    fontFamily: `${norm.fontFamily}, sans-serif`,
    fontSize: `${norm.fontSize}px`,
    fontWeight: norm.fontWeight,
    fontStyle: norm.fontStyle,
    color: norm.color,
    textAlign: norm.textAlign,
    lineHeight: norm.lineHeight,
    letterSpacing: `${norm.letterSpacing}px`,
    textTransform: norm.textTransform,
    textDecoration: norm.textDecoration,
    backgroundColor: norm.backgroundColor,
    opacity: norm.backgroundOpacity,
    padding: `${norm.padding}px`,
    borderRadius: `${norm.borderRadius}px`,
  };

  if (norm.borderWidth > 0) {
    styles.border = `${norm.borderWidth}px solid ${norm.borderColor || '#000000'}`;
  }

  if (norm.shadow?.enabled) {
    const shadowColor = norm.shadow.color || '#000000';
    styles.boxShadow = `${norm.shadow.offsetX || 0}px ${norm.shadow.offsetY || 2}px ${norm.shadow.blur || 4}px ${shadowColor}`;
  }

  if (norm.outline?.enabled && norm.outline.width > 0) {
    styles.WebkitTextStroke = `${norm.outline.width}px ${norm.outline.color || '#000000'}`;
  }

  return styles;
}

/**
 * Helper for multi-text formatting: returns common value or 'MIXED' if values differ
 */
export function getMultiTextCommonValue(selectedTextElements, key) {
  if (!selectedTextElements || selectedTextElements.length === 0) return null;

  const firstVal = normalizeTextElement(selectedTextElements[0])[key];
  for (let i = 1; i < selectedTextElements.length; i++) {
    const val = normalizeTextElement(selectedTextElements[i])[key];
    if (val !== firstVal) {
      return 'MIXED';
    }
  }
  return firstVal;
}
