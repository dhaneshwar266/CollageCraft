/**
 * Sticker & Icon Utilities
 * Helpers for normalizing sticker elements, managing local storage favorites/recents,
 * and performing multi-selection formatting extractions.
 */

import { BUILTIN_STICKERS } from '../data/stickerRegistry';

const FAVORITES_STORAGE_KEY = 'photocollage_sticker_favorites';
const RECENTS_STORAGE_KEY = 'photocollage_sticker_recents';

/**
 * Normalizes sticker element properties safely
 */
export function normalizeStickerElement(el = {}) {
  const contentStr = typeof el === 'string' ? el : (el.content || el.emoji || '✨');
  const source = el.stickerSource || (contentStr.length <= 4 && !contentStr.includes(' ') && !contentStr.includes('M ') ? 'emoji' : 'svg');

  return {
    id: el.id || `sticker-${Date.now()}`,
    type: 'sticker',
    name: el.name || (source === 'emoji' ? `${contentStr} Sticker` : 'Sticker'),
    x: el.x ?? 50,
    y: el.y ?? 50,
    width: el.width ?? 64,
    height: el.height ?? 64,
    rotation: el.rotation ?? 0,
    opacity: el.opacity ?? 1,
    visible: el.visible ?? true,
    locked: el.locked ?? false,
    zIndex: el.zIndex ?? 300,
    groupId: el.groupId || null,

    // Sticker-specific properties
    stickerSource: source, // 'emoji' | 'svg' | 'icon' | 'decorative'
    stickerCategory: el.stickerCategory || 'decorative',
    content: contentStr,
    viewBox: el.viewBox || '0 0 24 24',

    fill: el.fill || el.fillColor || (source === 'emoji' ? 'transparent' : '#3b82f6'),
    stroke: el.stroke || el.strokeColor || 'none',
    strokeWidth: el.strokeWidth ?? 0,

    shadow: el.shadow || {
      enabled: false,
      color: '#000000',
      opacity: 0.25,
      blur: 4,
      offsetX: 0,
      offsetY: 2,
    },

    flipH: el.flipH ?? false,
    flipV: el.flipV ?? false,
    scale: el.scale ?? 1,
    colorMode: el.colorMode || 'original',
    blendMode: el.blendMode || 'normal',

    // Legacy compatibility fields
    emoji: el.emoji || (source === 'emoji' ? contentStr : '✨'),
    iconName: el.iconName || null,
    fillColor: el.fillColor || el.fill,
    strokeColor: el.strokeColor || el.stroke,
  };
}

/**
 * Creates a new sticker element from a registry item definition
 */
export function createStickerFromRegistry(registryItem, index = 0, offsetCenter = false) {
  const source = registryItem.stickerSource || (registryItem.type === 'emoji' ? 'emoji' : 'svg');
  
  // Center coordinates with slight deterministic jitter if offset requested
  const offset = offsetCenter ? (index % 5) * 3 - 6 : 0;
  const cx = 50 + offset;
  const cy = 50 + offset;

  return normalizeStickerElement({
    id: `sticker-${Date.now()}-${index}`,
    type: 'sticker',
    name: registryItem.name || 'Sticker',
    x: cx,
    y: cy,
    width: registryItem.defaultWidth || 64,
    height: registryItem.defaultHeight || 64,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 300 + index * 10,
    groupId: null,

    stickerSource: source,
    stickerCategory: registryItem.category || 'decorative',
    content: registryItem.content,
    viewBox: registryItem.viewBox || '0 0 24 24',

    fill: registryItem.defaultFill || (source === 'emoji' ? 'transparent' : '#3b82f6'),
    stroke: registryItem.defaultStroke || 'none',
    strokeWidth: registryItem.defaultStrokeWidth || 0,
  });
}

/**
 * Multi-selection common value extractor
 */
export function getMultiStickerCommonValue(elements = [], key, defaultValue = '') {
  if (!Array.isArray(elements) || elements.length === 0) return defaultValue;
  const stickerElements = elements.filter((el) => el.type === 'sticker');
  if (stickerElements.length === 0) return defaultValue;

  const firstVal = stickerElements[0][key];
  const allSame = stickerElements.every((el) => {
    if (typeof firstVal === 'object' && firstVal !== null) {
      return JSON.stringify(el[key]) === JSON.stringify(firstVal);
    }
    return el[key] === firstVal;
  });

  return allSame ? (firstVal ?? defaultValue) : 'Mixed';
}

/**
 * Reset state generator for stickers
 */
export function getResetStickerFormattingState(el = {}) {
  const isEmoji = el.stickerSource === 'emoji';
  return {
    fill: isEmoji ? 'transparent' : '#3b82f6',
    stroke: 'none',
    strokeWidth: 0,
    shadow: {
      enabled: false,
      color: '#000000',
      opacity: 0.25,
      blur: 4,
      offsetX: 0,
      offsetY: 2,
    },
    opacity: 1,
    flipH: false,
    flipV: false,
    blendMode: 'normal',
  };
}

/**
 * LocalStorage Favorites Management
 */
export function getStickerFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleStickerFavorite(stickerId) {
  try {
    const favs = getStickerFavorites();
    const idx = favs.indexOf(stickerId);
    let updated = [];
    if (idx >= 0) {
      updated = favs.filter((id) => id !== stickerId);
    } else {
      updated = [...favs, stickerId];
    }
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * LocalStorage Recently Used Management (Max 20)
 */
export function getStickerRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushStickerRecent(stickerId) {
  try {
    const recents = getStickerRecents().filter((id) => id !== stickerId);
    const updated = [stickerId, ...recents].slice(0, 20);
    localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
