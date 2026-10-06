/**
 * Element Normalizer & Legacy Compatibility Utilities
 * 
 * WHY THIS EXISTS:
 * Prepares the unified editor document model (Scene Graph) while preserving 100% 
 * backward compatibility for existing components expecting legacy state properties.
 * 
 * WHAT IT MAPS:
 * - Converts legacy cells[], textOverlays[], stickers[] into unified BaseElement objects in elements[].
 * - Derives legacy cells[], textOverlays[], stickers[], selectedCellId, and selectedOverlayId from elements[].
 * 
 * WHEN IT CAN BE REMOVED:
 * Once all canvas and UI components are fully upgraded in future steps to consume unified elements directly.
 */

import { LAYOUT_PRESETS, getAutoGridLayout } from './layoutTemplates';

// Z-Index Ranges for Deterministic Layering
const Z_INDEX_RANGES = {
  image: 100,
  text: 200,
  sticker: 300,
  shape: 400,
  group: 500,
};

/**
 * Creates a unified Image element from asset & cell specifications
 */
export function createImageElement(assetId, cellData = {}, index = 0) {
  return {
    id: cellData.id || `cell-${Date.now()}-${index}`,
    type: 'image',
    name: cellData.name || `Photo ${index + 1}`,
    x: cellData.x ?? 0,
    y: cellData.y ?? 0,
    width: cellData.width ?? 100,
    height: cellData.height ?? 100,
    rotation: cellData.rotation ?? 0,
    opacity: cellData.opacity ?? 1,
    visible: cellData.visible ?? true,
    locked: cellData.locked ?? false,
    zIndex: cellData.zIndex ?? (Z_INDEX_RANGES.image + index),
    groupId: cellData.groupId || null,

    // Image-specific properties
    assetId: assetId,
    objectFit: cellData.objectFit || "contain",
    zoom: cellData.zoom ?? 1,
    panX: cellData.panX ?? 0,
    panY: cellData.panY ?? 0,
    flipH: cellData.flipH ?? false,
    flipV: cellData.flipV ?? false,
    filterPreset: cellData.filterPreset || 'original',
    brightness: cellData.brightness ?? 100,
    contrast: cellData.contrast ?? 100,
    saturation: cellData.saturation ?? 100,
    temperature: cellData.temperature ?? 0,
    tint: cellData.tint ?? 0,
    exposure: cellData.exposure ?? 0,
    highlights: cellData.highlights ?? 0,
    shadows: cellData.shadows ?? 0,
    blur: cellData.blur ?? 0,
    sharpness: cellData.sharpness ?? 0,
    vignette: cellData.vignette ?? 0,
    vignetteIntensity: cellData.vignetteIntensity ?? 0.5,
    hue: cellData.hue ?? 0,
    crop: cellData.crop || { enabled: false, x: 0, y: 0, width: 100, height: 100, aspectRatio: null, rotation: 0 },
    focalPoint: cellData.focalPoint || { x: 50, y: 50 },
    borderRadius: cellData.borderRadius ?? null,
    imageOpacity: cellData.imageOpacity ?? (cellData.opacity ?? 1),
    blendMode: cellData.blendMode || 'normal',
    specOverride: cellData.specOverride || null,
    freeX: cellData.freeX ?? undefined,
    freeY: cellData.freeY ?? undefined,
    freeW: cellData.freeW ?? undefined,
    freeH: cellData.freeH ?? undefined,
  };
}

/**
 * Creates a unified Text element from overlay specification
 */
export function createTextElement(textData = {}, index = 0) {
  return {
    id: textData.id || `text-${Date.now()}-${index}`,
    type: 'text',
    name: textData.name || (textData.text ? `"${textData.text.slice(0, 15)}"` : `Text ${index + 1}`),
    x: textData.x ?? 50,
    y: textData.y ?? 50,
    width: textData.width ?? 200,
    height: textData.height ?? 50,
    rotation: textData.rotation ?? 0,
    opacity: textData.opacity ?? 1,
    visible: textData.visible ?? true,
    locked: textData.locked ?? false,
    zIndex: textData.zIndex ?? (Z_INDEX_RANGES.text + index),
    groupId: textData.groupId || null,

    // Text-specific properties
    text: textData.text || 'YOUR CAPTION',
    fontFamily: textData.fontFamily || 'Inter',
    fontSize: textData.fontSize ?? 28,
    color: textData.color || '#ffffff',
    bgPill: textData.bgPill ?? true,
    bgPillColor: textData.bgPillColor || 'rgba(15, 23, 42, 0.85)',
    alignment: textData.alignment || 'center',
    bold: textData.bold ?? false,
    italic: textData.italic ?? false,
  };
}

/**
 * Creates a unified Sticker element from emoji/sticker specification
 */
export function createStickerElement(stickerData = {}, index = 0) {
  const emojiStr = typeof stickerData === 'string' ? stickerData : (stickerData.emoji || '✨');
  return {
    id: stickerData.id || `sticker-${Date.now()}-${index}`,
    type: 'sticker',
    name: stickerData.name || `${emojiStr} Sticker`,
    x: stickerData.x ?? 50,
    y: stickerData.y ?? 30,
    width: stickerData.width ?? 48,
    height: stickerData.height ?? 48,
    rotation: stickerData.rotation ?? 0,
    opacity: stickerData.opacity ?? 1,
    visible: stickerData.visible ?? true,
    locked: stickerData.locked ?? false,
    zIndex: stickerData.zIndex ?? (Z_INDEX_RANGES.sticker + index),
    groupId: stickerData.groupId || null,

    // Sticker-specific properties
    emoji: emojiStr,
    scale: stickerData.scale ?? 1,
    iconName: stickerData.iconName || null,
    fillColor: stickerData.fillColor || null,
    strokeColor: stickerData.strokeColor || null,
  };
}

/**
 * Creates a unified Shape element
 */
export function createShapeElement(shapeData = {}, index = 0) {
  const shapeType = shapeData.shapeType || 'rectangle';
  return {
    id: shapeData.id || `shape-${Date.now()}-${index}`,
    type: 'shape',
    name: shapeData.name || `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`,
    x: shapeData.x ?? 100,
    y: shapeData.y ?? 100,
    width: shapeData.width ?? 140,
    height: shapeData.height ?? 120,
    rotation: shapeData.rotation ?? 0,
    opacity: shapeData.opacity ?? 1,
    visible: shapeData.visible ?? true,
    locked: shapeData.locked ?? false,
    zIndex: shapeData.zIndex ?? (Z_INDEX_RANGES.shape + index),
    groupId: shapeData.groupId || null,

    // Shape-specific properties
    shapeType: shapeType,
    fill: shapeData.fill || {
      type: 'solid',
      color: '#3b82f6',
      gradient: {
        type: 'linear',
        angle: 45,
        stops: [
          { offset: 0, color: '#3b82f6' },
          { offset: 1, color: '#8b5cf6' },
        ],
      },
    },
    fillOpacity: shapeData.fillOpacity ?? 1,
    stroke: shapeData.stroke || '#1e3a8a',
    strokeOpacity: shapeData.strokeOpacity ?? 1,
    strokeWidth: shapeData.strokeWidth ?? 0,
    strokeStyle: shapeData.strokeStyle || 'solid',
    cornerRadius: shapeData.cornerRadius ?? (shapeType === 'rounded-rectangle' ? 16 : 0),
    shadow: shapeData.shadow || {
      enabled: false,
      color: '#000000',
      opacity: 0.25,
      blur: 6,
      offsetX: 0,
      offsetY: 3,
    },
    flipH: shapeData.flipH ?? false,
    flipV: shapeData.flipV ?? false,
    sides: shapeData.sides ?? (shapeType === 'pentagon' ? 5 : shapeType === 'hexagon' ? 6 : shapeType === 'star' ? 5 : 3),
    innerRadius: shapeData.innerRadius ?? 0.4,
    blendMode: shapeData.blendMode || 'normal',
  };
}

/**
 * Normalizes initial / legacy state structures into a Document Model
 */
export function normalizeLegacyStateToDocument(legacyState = {}) {
  const elements = [];

  // Preserve existing elements if already normalized
  if (Array.isArray(legacyState.elements)) {
    elements.push(...legacyState.elements);
  }

  // Convert cells -> Image elements
  if (Array.isArray(legacyState.cells)) {
    legacyState.cells.forEach((cell, idx) => {
      elements.push(createImageElement(cell.assetId, cell, idx));
    });
  }

  // Convert textOverlays -> Text elements
  if (Array.isArray(legacyState.textOverlays)) {
    legacyState.textOverlays.forEach((txt, idx) => {
      elements.push(createTextElement(txt, idx));
    });
  }

  // Convert stickers -> Sticker elements
  if (Array.isArray(legacyState.stickers)) {
    legacyState.stickers.forEach((st, idx) => {
      elements.push(createStickerElement(st, idx));
    });
  }

  return {
    version: '2.0',
    title: legacyState.title || 'Untitled Collage',
    aspectRatio: legacyState.aspectRatio || '1:1',
    dimensions: legacyState.dimensions || { width: 1080, height: 1080 },
    background: legacyState.backgroundSettings || {
      type: 'color',
      value: '#ffffff',
    },
    frameSettings: legacyState.frameSettings || {
      padding: 0,
      gap: 0,
      cornerRadius: 0,
      borderWidth: 0,
      borderColor: '#ffffff',
      cellShadow: false,
    },
    layoutId: legacyState.layoutId || '2x2-grid',
    guides: Array.isArray(legacyState.guides) ? legacyState.guides : [],
    elements: reorderAndNormalizeZIndexes(elements),
  };
}

/**
 * Sorts elements by zIndex and normalizes zIndexes sequentially starting from 100
 */
export function reorderAndNormalizeZIndexes(elements) {
  if (!Array.isArray(elements)) return [];
  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  return sorted.map((el, idx) => ({
    ...el,
    zIndex: 100 + idx * 10,
  }));
}

/**
 * Reorders an element in element list (bringForward, sendBackward, bringToFront, sendToBack)
 */
export function reorderElementInList(elements, id, action) {
  if (!Array.isArray(elements)) return elements;

  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const idx = sorted.findIndex((el) => el.id === id);
  if (idx === -1) return elements;

  if (action === 'bringForward' && idx < sorted.length - 1) {
    const temp = sorted[idx];
    sorted[idx] = sorted[idx + 1];
    sorted[idx + 1] = temp;
  } else if (action === 'sendBackward' && idx > 0) {
    const temp = sorted[idx];
    sorted[idx] = sorted[idx - 1];
    sorted[idx - 1] = temp;
  } else if (action === 'bringToFront' && idx < sorted.length - 1) {
    const [target] = sorted.splice(idx, 1);
    sorted.push(target);
  } else if (action === 'sendToBack' && idx > 0) {
    const [target] = sorted.splice(idx, 1);
    sorted.unshift(target);
  }

  return sorted.map((el, index) => ({
    ...el,
    zIndex: 100 + index * 10,
  }));
}

/**
 * LEGACY SELECTOR: Derives legacy cells[] array from unified elements[]
 */
export function getLegacyCells(document) {
  if (!document || !Array.isArray(document.elements)) return [];
  return document.elements
    .filter((el) => el.type === 'image')
    .map((el) => ({
      id: el.id,
      assetId: el.assetId,
      x: el.x ?? 0,
      y: el.y ?? 0,
      width: el.width ?? 100,
      height: el.height ?? 100,
      objectFit: el.objectFit || "contain",
      zoom: el.zoom ?? 1,
      panX: el.panX ?? 0,
      panY: el.panY ?? 0,
      rotation: el.rotation ?? 0,
      flipH: el.flipH ?? false,
      flipV: el.flipV ?? false,
      filterPreset: el.filterPreset || 'original',
      brightness: el.brightness ?? 100,
      contrast: el.contrast ?? 100,
      saturation: el.saturation ?? 100,
      temperature: el.temperature ?? 0,
      tint: el.tint ?? 0,
      exposure: el.exposure ?? 0,
      highlights: el.highlights ?? 0,
      shadows: el.shadows ?? 0,
      blur: el.blur ?? 0,
      sharpness: el.sharpness ?? 0,
      vignette: el.vignette ?? 0,
      vignetteIntensity: el.vignetteIntensity ?? 0.5,
      hue: el.hue ?? 0,
      crop: el.crop || { enabled: false, x: 0, y: 0, width: 100, height: 100, aspectRatio: null, rotation: 0 },
      focalPoint: el.focalPoint || { x: 50, y: 50 },
      borderRadius: el.borderRadius != null ? el.borderRadius : (document?.frameSettings?.cornerRadius ?? 0),
      imageOpacity: el.imageOpacity ?? (el.opacity ?? 1),
      blendMode: el.blendMode || 'normal',
      specOverride: el.specOverride || null,
      freeX: el.freeX,
      freeY: el.freeY,
      freeW: el.freeW,
      freeH: el.freeH,
      zIndex: el.zIndex,
      visible: el.visible ?? true,
      locked: el.locked ?? false,
      name: el.name,
    }));
}

/**
 * LEGACY SELECTOR: Derives legacy textOverlays[] array from unified elements[]
 */
export function getLegacyTextOverlays(document) {
  if (!document || !Array.isArray(document.elements)) return [];
  return document.elements
    .filter((el) => el.type === 'text')
    .map((el) => ({
      id: el.id,
      text: el.text,
      x: el.x,
      y: el.y,
      fontSize: el.fontSize,
      fontFamily: el.fontFamily,
      color: el.color,
      bgPill: el.bgPill,
      bgPillColor: el.bgPillColor,
      rotation: el.rotation ?? 0,
      alignment: el.alignment,
      bold: el.bold,
      italic: el.italic,
      zIndex: el.zIndex,
      visible: el.visible ?? true,
      locked: el.locked ?? false,
      name: el.name,
    }));
}

/**
 * LEGACY SELECTOR: Derives legacy stickers[] array from unified elements[]
 */
export function getLegacyStickers(document) {
  if (!document || !Array.isArray(document.elements)) return [];
  return document.elements
    .filter((el) => el.type === 'sticker')
    .map((el) => ({
      id: el.id,
      emoji: el.emoji,
      x: el.x,
      y: el.y,
      scale: el.scale ?? 1,
      rotation: el.rotation ?? 0,
      iconName: el.iconName,
      fillColor: el.fillColor,
      strokeColor: el.strokeColor,
      zIndex: el.zIndex,
      visible: el.visible ?? true,
      locked: el.locked ?? false,
      name: el.name,
    }));
}

/**
 * LEGACY SELECTOR: Derives selectedCellId from unified selection state
 */
export function getSelectedCellId(selection, document) {
  if (!selection?.primaryId || !document?.elements) return null;
  const target = document.elements.find((el) => el.id === selection.primaryId);
  return target && target.type === 'image' ? target.id : null;
}

/**
 * LEGACY SELECTOR: Derives selectedOverlayId from unified selection state
 */
export function getSelectedOverlayId(selection, document) {
  if (!selection?.primaryId || !document?.elements) return null;
  const target = document.elements.find((el) => el.id === selection.primaryId);
  return target && (target.type === 'text' || target.type === 'sticker') ? target.id : null;
}

/**
  * Applies layout preset geometry (x, y, width, height) to active image elements.
  * Clears old manual specOverrides and free position overrides.
  */
export function applyLayoutToElements(newLayoutId, elements) {
  if (!Array.isArray(elements)) return [];

  let preset = LAYOUT_PRESETS.find((p) => p.id === newLayoutId);
  if (!preset && newLayoutId && newLayoutId.startsWith('auto-grid-')) {
    const parsed = parseInt(newLayoutId.replace('auto-grid-', ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      preset = {
        id: newLayoutId,
        name: `${parsed} Photo Auto Grid`,
        photoCount: parsed,
        capacity: parsed,
        cells: getAutoGridLayout(parsed),
      };
    }
  }

  const allImageElements = elements.filter((el) => el.type === 'image');
  const otherElements = elements.filter((el) => el.type !== 'image');

  // Separate real photo elements (assetId != null) from empty cell placeholders (assetId == null)
  const realImageElements = allImageElements.filter((el) => el.assetId != null);
  const placeholderElements = allImageElements.filter((el) => el.assetId == null);

  // Real photos take priority and map to the first slots
  const orderedImageElements = [...realImageElements, ...placeholderElements];

  const targetCellCount = preset
    ? (preset.capacity || preset.photoCount || preset.cells.length)
    : Math.max(realImageElements.length, 1);
  const templateCells = preset ? preset.cells : getAutoGridLayout(targetCellCount);

  // Map image elements in strict index order
  const updatedImageElements = orderedImageElements.map((el, i) => {
    if (i < targetCellCount) {
      const templateCell = templateCells[i] || { x: 0, y: 0, width: 100, height: 100 };
      return {
        ...el,
        x: templateCell.x,
        y: templateCell.y,
        width: templateCell.width,
        height: templateCell.height,
        specOverride: null,
        freeX: null,
        freeY: null,
        freeW: null,
        freeH: null,
        visible: true,
      };
    } else {
      return {
        ...el,
        specOverride: null,
        freeX: null,
        freeY: null,
        freeW: null,
        freeH: null,
        visible: false,
      };
    }
  });

  // If missing placeholder slots needed
  if (updatedImageElements.length < targetCellCount) {
    const startCount = updatedImageElements.length;
    for (let i = startCount; i < targetCellCount; i++) {
      const templateCell = templateCells[i] || { x: 0, y: 0, width: 100, height: 100 };
      const placeholderCell = createImageElement(null, { name: `Photo ${i + 1}` }, i);
      updatedImageElements.push({
        ...placeholderCell,
        x: templateCell.x,
        y: templateCell.y,
        width: templateCell.width,
        height: templateCell.height,
        specOverride: null,
        freeX: null,
        freeY: null,
        freeW: null,
        freeH: null,
        visible: true,
      });
    }
  }

  // Prune invisible dead placeholder elements (assetId == null) that are beyond target capacity
  const cleanedImageElements = updatedImageElements.filter(
    (el) => el.assetId != null || el.visible !== false
  );

  console.log('[TEMPLATE DEBUG]', {
    layoutId: newLayoutId,
    templateCellCount: targetCellCount,
    imageElementCount: cleanedImageElements.length,
    visibleImageElementCount: cleanedImageElements.filter((e) => e.visible !== false).length,
    imageElementIds: cleanedImageElements.map((e) => e.id),
    assetIds: cleanedImageElements.map((e) => e.assetId),
    cellIndexes: cleanedImageElements.map((e, idx) => ({ idx, id: e.id, assetId: e.assetId, visible: e.visible })),
  });

  return reorderAndNormalizeZIndexes([...cleanedImageElements, ...otherElements]);
}
