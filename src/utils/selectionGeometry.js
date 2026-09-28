import { LAYOUT_PRESETS, getAutoGridLayout } from './layoutTemplates';

/**
 * Normalizes element bounds to standard percentage box { x, y, width, height, rotation, cx, cy }
 */
export function getElementBounds(el, allElements = [], layoutId = 'freestyle') {
  let x = 0;
  let y = 0;
  let width = 20;
  let height = 20;
  let rotation = el.rotation || 0;

  if (el.type === 'image') {
    if (el.specOverride) {
      x = el.specOverride.x ?? 0;
      y = el.specOverride.y ?? 0;
      width = el.specOverride.width ?? 50;
      height = el.specOverride.height ?? 50;
    } else if (layoutId && layoutId !== 'freestyle' && Array.isArray(allElements)) {
      const imageCells = allElements.filter((e) => e.type === 'image' && e.visible !== false);
      const idx = imageCells.findIndex((e) => e.id === el.id);
      if (idx !== -1) {
        const preset = LAYOUT_PRESETS.find((p) => p.id === layoutId);
        const cellSpecs = preset ? preset.cells : getAutoGridLayout(imageCells.length);
        const spec = cellSpecs[idx] || { x: 0, y: 0, width: 50, height: 50 };
        x = spec.x;
        y = spec.y;
        width = spec.width;
        height = spec.height;
      } else {
        x = el.freeX ?? el.x ?? 10;
        y = el.freeY ?? el.y ?? 10;
        width = el.freeW ?? el.width ?? 35;
        height = el.freeH ?? el.height ?? 35;
      }
    } else {
      x = el.freeX ?? el.x ?? 10;
      y = el.freeY ?? el.y ?? 10;
      width = el.freeW ?? el.width ?? 35;
      height = el.freeH ?? el.height ?? 35;
    }
  } else if (el.type === 'text') {
    x = el.x ?? 50;
    y = el.y ?? 50;
    // Estimate bounding box around centered text
    const textLen = (el.text || 'Text').length;
    const fontSize = el.fontSize || 28;
    width = Math.max(10, Math.min(80, textLen * (fontSize * 0.06) + 4));
    height = Math.max(4, Math.min(40, fontSize * 0.12 + 2));
    x = x - width / 2;
    y = y - height / 2;
  } else if (el.type === 'sticker') {
    x = el.x ?? 50;
    y = el.y ?? 50;
    const scale = el.scale || 1;
    width = Math.max(6, scale * 10);
    height = Math.max(6, scale * 10);
    x = x - width / 2;
    y = y - height / 2;
  } else {
    x = el.x ?? 10;
    y = el.y ?? 10;
    width = el.width ?? 20;
    height = el.height ?? 20;
  }

  const cx = x + width / 2;
  const cy = y + height / 2;

  return { x, y, width, height, rotation, cx, cy };
}

/**
 * Computes combined selection bounding box encompassing all transformable elements
 */
export function getCombinedSelectionBounds(elements, selectedIds, layoutId = 'freestyle') {
  if (!elements || !selectedIds || selectedIds.length === 0) {
    return null;
  }

  const selectedElements = elements.filter(
    (el) => selectedIds.includes(el.id) && el.visible !== false
  );

  if (selectedElements.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedElements.forEach((el) => {
    const bounds = getElementBounds(el, elements, layoutId);
    
    // Compute 4 corner points if rotated
    if (bounds.rotation) {
      const rad = (bounds.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const halfW = bounds.width / 2;
      const halfH = bounds.height / 2;

      const corners = [
        { x: -halfW, y: -halfH },
        { x: halfW, y: -halfH },
        { x: halfW, y: halfH },
        { x: -halfW, y: halfH },
      ];

      corners.forEach((c) => {
        const rx = bounds.cx + (c.x * cos - c.y * sin);
        const ry = bounds.cy + (c.x * sin + c.y * cos);
        minX = Math.min(minX, rx);
        minY = Math.min(minY, ry);
        maxX = Math.max(maxX, rx);
        maxY = Math.max(maxY, ry);
      });
    } else {
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }
  });

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const cx = minX + width / 2;
  const cy = minY + height / 2;

  return {
    x: minX,
    y: minY,
    width,
    height,
    cx,
    cy,
    count: selectedElements.length,
    hasLocked: selectedElements.some((el) => el.locked === true),
  };
}

/**
 * Calculates updated element properties for multi-move operation
 */
export function calculateMultiMove(elements, selectedIds, deltaX, deltaY) {
  const updates = [];

  elements.forEach((el) => {
    if (!selectedIds.includes(el.id) || el.locked || el.visible === false) {
      return;
    }

    if (el.type === 'image') {
      if (el.specOverride) {
        updates.push({
          id: el.id,
          patch: {
            specOverride: {
              ...el.specOverride,
              x: el.specOverride.x + deltaX,
              y: el.specOverride.y + deltaY,
            },
          },
        });
      } else {
        updates.push({
          id: el.id,
          patch: {
            freeX: (el.freeX ?? 10) + deltaX,
            freeY: (el.freeY ?? 10) + deltaY,
            x: (el.x ?? 10) + deltaX,
            y: (el.y ?? 10) + deltaY,
          },
        });
      }
    } else if (el.type === 'text' || el.type === 'sticker') {
      updates.push({
        id: el.id,
        patch: {
          x: (el.x ?? 50) + deltaX,
          y: (el.y ?? 50) + deltaY,
        },
      });
    }
  });

  return updates;
}

/**
 * Calculates updated element properties for multi-resize operation relative to initial bounds
 */
export function calculateMultiScale(elements, selectedIds, initialBounds, scaleX, scaleY) {
  if (!initialBounds || initialBounds.width === 0 || initialBounds.height === 0) {
    return [];
  }

  const updates = [];

  elements.forEach((el) => {
    if (!selectedIds.includes(el.id) || el.locked || el.visible === false) {
      return;
    }

    const bounds = getElementBounds(el);

    // Compute relative center offset from initial group center
    const relCx = (bounds.cx - initialBounds.x) / initialBounds.width;
    const relCy = (bounds.cy - initialBounds.y) / initialBounds.height;

    const newGroupW = initialBounds.width * scaleX;
    const newGroupH = initialBounds.height * scaleY;

    const newCx = initialBounds.x + relCx * newGroupW;
    const newCy = initialBounds.y + relCy * newGroupH;

    const newW = Math.max(2, bounds.width * scaleX);
    const newH = Math.max(2, bounds.height * scaleY);
    const newX = newCx - newW / 2;
    const newY = newCy - newH / 2;

    if (el.type === 'image') {
      if (el.specOverride) {
        updates.push({
          id: el.id,
          patch: {
            specOverride: {
              ...el.specOverride,
              x: newX,
              y: newY,
              width: newW,
              height: newH,
            },
          },
        });
      } else {
        updates.push({
          id: el.id,
          patch: {
            freeX: newX,
            freeY: newY,
            freeW: newW,
            freeH: newH,
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          },
        });
      }
    } else if (el.type === 'text') {
      const scaleFactor = (scaleX + scaleY) / 2;
      const newFontSize = Math.max(12, Math.min(120, Math.round((el.fontSize || 28) * scaleFactor)));
      updates.push({
        id: el.id,
        patch: {
          x: newCx,
          y: newCy,
          fontSize: newFontSize,
        },
      });
    } else if (el.type === 'sticker') {
      const scaleFactor = (scaleX + scaleY) / 2;
      const newScale = Math.max(0.3, Math.min(5, parseFloat(((el.scale || 1) * scaleFactor).toFixed(2))));
      updates.push({
        id: el.id,
        patch: {
          x: newCx,
          y: newCy,
          scale: newScale,
        },
      });
    }
  });

  return updates;
}

/**
 * Calculates updated element properties for multi-rotate operation around group center
 */
export function calculateMultiRotation(elements, selectedIds, initialBounds, deltaAngleDeg) {
  if (!initialBounds) return [];

  const updates = [];
  const rad = (deltaAngleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const center = { x: initialBounds.cx, y: initialBounds.cy };

  elements.forEach((el) => {
    if (!selectedIds.includes(el.id) || el.locked || el.visible === false) {
      return;
    }

    const bounds = getElementBounds(el);

    // Rotate element center around group center
    const dx = bounds.cx - center.x;
    const dy = bounds.cy - center.y;

    const rotatedCx = center.x + (dx * cos - dy * sin);
    const rotatedCy = center.y + (dx * sin + dy * cos);

    const newX = rotatedCx - bounds.width / 2;
    const newY = rotatedCy - bounds.height / 2;
    const newRot = (bounds.rotation + deltaAngleDeg + 360) % 360;

    if (el.type === 'image') {
      if (el.specOverride) {
        updates.push({
          id: el.id,
          patch: {
            rotation: newRot,
            specOverride: {
              ...el.specOverride,
              x: newX,
              y: newY,
            },
          },
        });
      } else {
        updates.push({
          id: el.id,
          patch: {
            rotation: newRot,
            freeX: newX,
            freeY: newY,
            x: newX,
            y: newY,
          },
        });
      }
    } else if (el.type === 'text' || el.type === 'sticker') {
      updates.push({
        id: el.id,
        patch: {
          x: rotatedCx,
          y: rotatedCy,
          rotation: newRot,
        },
      });
    }
  });

  return updates;
}
