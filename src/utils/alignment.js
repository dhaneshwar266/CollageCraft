/**
 * Alignment & Distribution Utilities
 */
import { getElementBounds, getCombinedSelectionBounds } from './selectionGeometry';
import { isElementHidden, isElementLocked } from './groupUtils';

/**
 * Calculates position updates for moving a target element or group by (deltaX, deltaY)
 */
export function calculateDeltaMoveForTarget(elements, targetId, deltaX, deltaY) {
  const updates = [];
  const target = elements.find((el) => el.id === targetId);
  if (!target) return updates;

  // If target is a group, move group container and all its children
  if (target.type === 'group') {
    updates.push({
      id: target.id,
      patch: {
        x: target.x + deltaX,
        y: target.y + deltaY,
      },
    });

    const childIdsSet = new Set(target.childIds || []);
    elements.forEach((el) => {
      if (el.groupId === target.id || childIdsSet.has(el.id)) {
        updates.push(...calculateDeltaMoveForTarget(elements, el.id, deltaX, deltaY));
      }
    });
    return updates;
  }

  // Single element patches
  if (target.type === 'image') {
    if (target.specOverride) {
      updates.push({
        id: target.id,
        patch: {
          specOverride: {
            ...target.specOverride,
            x: target.specOverride.x + deltaX,
            y: target.specOverride.y + deltaY,
          },
        },
      });
    } else {
      updates.push({
        id: target.id,
        patch: {
          freeX: (target.freeX ?? 10) + deltaX,
          freeY: (target.freeY ?? 10) + deltaY,
          x: (target.x ?? 10) + deltaX,
          y: (target.y ?? 10) + deltaY,
        },
      });
    }
  } else if (target.type === 'text' || target.type === 'sticker') {
    updates.push({
      id: target.id,
      patch: {
        x: (target.x ?? 50) + deltaX,
        y: (target.y ?? 50) + deltaY,
      },
    });
  } else {
    updates.push({
      id: target.id,
      patch: {
        x: (target.x ?? 10) + deltaX,
        y: (target.y ?? 10) + deltaY,
      },
    });
  }

  return updates;
}

/**
 * Filter selected top-level items into eligible targets (unlocked, visible)
 */
export function getEligibleSelectedTargets(elements, selectedIds) {
  if (!elements || !selectedIds || selectedIds.length === 0) {
    return { targets: [], lockedCount: 0, hiddenCount: 0 };
  }

  // Filter out elements that are children of selected groups (avoid double processing)
  const selectedSet = new Set(selectedIds);
  const topLevelSelected = elements.filter((el) => {
    if (!selectedSet.has(el.id)) return false;
    if (el.groupId && selectedSet.has(el.groupId)) return false;
    return true;
  });

  let lockedCount = 0;
  let hiddenCount = 0;

  const targets = [];
  topLevelSelected.forEach((el) => {
    if (isElementHidden(elements, el)) {
      hiddenCount++;
      return;
    }
    if (isElementLocked(elements, el)) {
      lockedCount++;
      return;
    }
    targets.push(el);
  });

  return { targets, lockedCount, hiddenCount };
}

/**
 * Base alignment runner for direction
 */
function alignDirection(elements, selectedIds, direction) {
  const { targets, lockedCount } = getEligibleSelectedTargets(elements, selectedIds);
  if (targets.length < 1) {
    return { updates: [], lockedCount };
  }

  // If multi-selection, calculate combined selection bounds of all selected items
  // If single-selection, align to canvas bounds (0..100)
  let refBounds = null;
  if (targets.length >= 2) {
    refBounds = getCombinedSelectionBounds(
      elements,
      targets.map((t) => t.id)
    );
  } else {
    refBounds = { x: 0, y: 0, width: 100, height: 100, cx: 50, cy: 50 };
  }

  if (!refBounds) return { updates: [], lockedCount };

  const updates = [];

  targets.forEach((el) => {
    const b = getElementBounds(el);
    let deltaX = 0;
    let deltaY = 0;

    switch (direction) {
      case 'left':
        deltaX = refBounds.x - b.x;
        break;
      case 'center-h':
        deltaX = refBounds.cx - b.cx;
        break;
      case 'right':
        deltaX = refBounds.x + refBounds.width - (b.x + b.width);
        break;
      case 'top':
        deltaY = refBounds.y - b.y;
        break;
      case 'center-v':
        deltaY = refBounds.cy - b.cy;
        break;
      case 'bottom':
        deltaY = refBounds.y + refBounds.height - (b.y + b.height);
        break;
      default:
        break;
    }

    if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
      const elUpdates = calculateDeltaMoveForTarget(elements, el.id, deltaX, deltaY);
      updates.push(...elUpdates);
    }
  });

  return { updates, lockedCount };
}

export function alignLeft(elements, selectedIds) {
  return alignDirection(elements, selectedIds, 'left');
}

export function alignCenterHorizontal(elements, selectedIds) {
  return alignDirection(elements, selectedIds, 'center-h');
}

export function alignRight(elements, selectedIds) {
  return alignDirection(elements, selectedIds, 'right');
}

export function alignTop(elements, selectedIds) {
  return alignDirection(elements, selectedIds, 'top');
}

export function alignCenterVertical(elements, selectedIds) {
  return alignDirection(elements, selectedIds, 'center-v');
}

export function alignBottom(elements, selectedIds) {
  return alignDirection(elements, selectedIds, 'bottom');
}

export function alignToCanvas(elements, selectedId, direction) {
  return alignDirection(elements, [selectedId], direction);
}

/**
 * Distribute Horizontally
 */
export function distributeHorizontal(elements, selectedIds) {
  const { targets, lockedCount } = getEligibleSelectedTargets(elements, selectedIds);
  if (targets.length < 3) {
    return { updates: [], lockedCount, notEnoughTargets: true };
  }

  // Sort targets by left X position
  const sorted = [...targets]
    .map((el) => ({
      el,
      bounds: getElementBounds(el),
    }))
    .sort((a, b) => a.bounds.x - b.bounds.x);

  const n = sorted.length;
  const first = sorted[0];
  const last = sorted[n - 1];

  const firstRight = first.bounds.x + first.bounds.width;
  const lastLeft = last.bounds.x;

  const totalSpan = lastLeft - firstRight;

  let middleWidthSum = 0;
  for (let i = 1; i < n - 1; i++) {
    middleWidthSum += sorted[i].bounds.width;
  }

  const totalGapSpace = totalSpan - middleWidthSum;
  const gap = totalGapSpace / (n - 1);

  const updates = [];
  let currentRight = firstRight;

  for (let i = 1; i < n - 1; i++) {
    const item = sorted[i];
    const targetX = currentRight + gap;
    const deltaX = targetX - item.bounds.x;

    if (Math.abs(deltaX) > 0.001) {
      const elUpdates = calculateDeltaMoveForTarget(elements, item.el.id, deltaX, 0);
      updates.push(...elUpdates);
    }

    currentRight = targetX + item.bounds.width;
  }

  return { updates, lockedCount };
}

/**
 * Distribute Vertically
 */
export function distributeVertical(elements, selectedIds) {
  const { targets, lockedCount } = getEligibleSelectedTargets(elements, selectedIds);
  if (targets.length < 3) {
    return { updates: [], lockedCount, notEnoughTargets: true };
  }

  // Sort targets by top Y position
  const sorted = [...targets]
    .map((el) => ({
      el,
      bounds: getElementBounds(el),
    }))
    .sort((a, b) => a.bounds.y - b.bounds.y);

  const n = sorted.length;
  const first = sorted[0];
  const last = sorted[n - 1];

  const firstBottom = first.bounds.y + first.bounds.height;
  const lastTop = last.bounds.y;

  const totalSpan = lastTop - firstBottom;

  let middleHeightSum = 0;
  for (let i = 1; i < n - 1; i++) {
    middleHeightSum += sorted[i].bounds.height;
  }

  const totalGapSpace = totalSpan - middleHeightSum;
  const gap = totalGapSpace / (n - 1);

  const updates = [];
  let currentBottom = firstBottom;

  for (let i = 1; i < n - 1; i++) {
    const item = sorted[i];
    const targetY = currentBottom + gap;
    const deltaY = targetY - item.bounds.y;

    if (Math.abs(deltaY) > 0.001) {
      const elUpdates = calculateDeltaMoveForTarget(elements, item.el.id, 0, deltaY);
      updates.push(...elUpdates);
    }

    currentBottom = targetY + item.bounds.height;
  }

  return { updates, lockedCount };
}
