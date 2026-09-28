/**
 * Smart Snapping & Visual Guide Utilities
 */
import { getElementBounds } from './selectionGeometry';
import { isElementHidden } from './groupUtils';

export const SNAP_THRESHOLD_PX = 6;
export const RELEASE_THRESHOLD_PX = 10;

/**
 * Computes all available canvas and object snap targets for X and Y axes
 */
export function getSnapTargets(elements, movingIds, canvasRect = null, persistentGuides = []) {
  const movingSet = new Set(movingIds || []);

  const xTargets = [
    { position: 0, type: 'canvas-edge', label: 'Canvas Left', priority: 4 },
    { position: 50, type: 'canvas-center', label: 'Canvas Center', priority: 3 },
    { position: 100, type: 'canvas-edge', label: 'Canvas Right', priority: 4 },
  ];

  const yTargets = [
    { position: 0, type: 'canvas-edge', label: 'Canvas Top', priority: 4 },
    { position: 50, type: 'canvas-center', label: 'Canvas Center', priority: 3 },
    { position: 100, type: 'canvas-edge', label: 'Canvas Bottom', priority: 4 },
  ];

  // Include user persistent guides
  if (Array.isArray(persistentGuides)) {
    persistentGuides.forEach((g) => {
      if (g.visible === false) return;
      if (g.type === 'vertical') {
        xTargets.push({
          position: g.position,
          type: 'persistent-guide',
          label: `Guide X: ${Math.round(g.position)}%`,
          priority: 1,
        });
      } else if (g.type === 'horizontal') {
        yTargets.push({
          position: g.position,
          type: 'persistent-guide',
          label: `Guide Y: ${Math.round(g.position)}%`,
          priority: 1,
        });
      }
    });
  }

  if (!elements) {
    return { xTargets, yTargets };
  }

  // Filter valid candidate elements that are not moving and not hidden
  const nonMovingElements = elements.filter((el) => {
    if (movingSet.has(el.id)) return false;
    if (el.groupId && movingSet.has(el.groupId)) return false;
    if (isElementHidden(elements, el)) return false;
    return true;
  });

  // Filter out children whose parent group is also in nonMovingElements to avoid duplicate targets
  const nonMovingSet = new Set(nonMovingElements.map((el) => el.id));
  const topCandidateElements = nonMovingElements.filter((el) => {
    if (el.groupId && nonMovingSet.has(el.groupId)) return false;
    return true;
  });

  topCandidateElements.forEach((el) => {
    const b = getElementBounds(el);

    // X targets (vertical lines)
    xTargets.push({ position: b.x, type: 'object-edge', label: 'Object Left', priority: 1, elementId: el.id });
    xTargets.push({ position: b.cx, type: 'object-center', label: 'Object Center', priority: 2, elementId: el.id });
    xTargets.push({ position: b.x + b.width, type: 'object-edge', label: 'Object Right', priority: 1, elementId: el.id });

    // Y targets (horizontal lines)
    yTargets.push({ position: b.y, type: 'object-edge', label: 'Object Top', priority: 1, elementId: el.id });
    yTargets.push({ position: b.cy, type: 'object-center', label: 'Object Center', priority: 2, elementId: el.id });
    yTargets.push({ position: b.y + b.height, type: 'object-edge', label: 'Object Bottom', priority: 1, elementId: el.id });
  });

  return { xTargets, yTargets };
}

/**
 * Calculates snap delta and active visual guides for moving bounds
 */
export function calculateSnapDelta(
  movingBounds,
  targets,
  canvasRect = null,
  previousSnapState = {}
) {
  if (!movingBounds || !targets) {
    return { snapDeltaX: 0, snapDeltaY: 0, guides: [], activeSnapState: {} };
  }

  const xTargetsList = Array.isArray(targets?.xTargets) ? targets.xTargets : (Array.isArray(targets) ? targets : []);
  const yTargetsList = Array.isArray(targets?.yTargets) ? targets.yTargets : (Array.isArray(targets) ? targets : []);

  const canvasWidth = canvasRect?.width || 800;
  const canvasHeight = canvasRect?.height || 600;

  const thresholdPctX = (SNAP_THRESHOLD_PX / canvasWidth) * 100;
  const thresholdPctY = (SNAP_THRESHOLD_PX / canvasHeight) * 100;

  const releasePctX = (RELEASE_THRESHOLD_PX / canvasWidth) * 100;
  const releasePctY = (RELEASE_THRESHOLD_PX / canvasHeight) * 100;

  let snapDeltaX = 0;
  let snapDeltaY = 0;
  let activeGuideX = null;
  let activeGuideY = null;
  let nextSnapX = null;
  let nextSnapY = null;

  // Moving X reference points
  const movingXPoints = [
    { offset: 0, name: 'left', val: movingBounds.x },
    { offset: movingBounds.width / 2, name: 'center', val: movingBounds.cx },
    { offset: movingBounds.width, name: 'right', val: movingBounds.x + movingBounds.width },
  ];

  // Moving Y reference points
  const movingYPoints = [
    { offset: 0, name: 'top', val: movingBounds.y },
    { offset: movingBounds.height / 2, name: 'center', val: movingBounds.cy },
    { offset: movingBounds.height, name: 'bottom', val: movingBounds.y + movingBounds.height },
  ];

  // 1. X-AXIS SNAPPING
  let bestMatchX = null;
  let minDiffX = Infinity;

  // Check hysteresis first if previously snapped
  const prevSnapX = previousSnapState?.targetX;

  movingXPoints.forEach((mPoint) => {
    xTargetsList.forEach((target) => {
      const diff = Math.abs(mPoint.val - target.position);
      const isPrev = prevSnapX !== undefined && prevSnapX !== null && Math.abs(target.position - prevSnapX) < 0.001;
      const limit = isPrev ? releasePctX : thresholdPctX;

      if (diff <= limit) {
        // Evaluate priority (lower priority number = higher preference, then smaller diff)
        const score = target.priority * 1000 + diff;
        if (score < minDiffX) {
          minDiffX = score;
          bestMatchX = {
            mPoint,
            target,
            diff: target.position - mPoint.val,
          };
        }
      }
    });
  });

  if (bestMatchX) {
    snapDeltaX = bestMatchX.diff;
    nextSnapX = bestMatchX.target.position;
    activeGuideX = {
      axis: 'x',
      position: bestMatchX.target.position,
      label: bestMatchX.target.label,
      type: bestMatchX.target.type,
    };
  }

  // 2. Y-AXIS SNAPPING
  let bestMatchY = null;
  let minDiffY = Infinity;

  const prevSnapY = previousSnapState?.targetY;

  movingYPoints.forEach((mPoint) => {
    yTargetsList.forEach((target) => {
      const diff = Math.abs(mPoint.val - target.position);
      const isPrev = prevSnapY !== undefined && prevSnapY !== null && Math.abs(target.position - prevSnapY) < 0.001;
      const limit = isPrev ? releasePctY : thresholdPctY;

      if (diff <= limit) {
        const score = target.priority * 1000 + diff;
        if (score < minDiffY) {
          minDiffY = score;
          bestMatchY = {
            mPoint,
            target,
            diff: target.position - mPoint.val,
          };
        }
      }
    });
  });

  if (bestMatchY) {
    snapDeltaY = bestMatchY.diff;
    nextSnapY = bestMatchY.target.position;
    activeGuideY = {
      axis: 'y',
      position: bestMatchY.target.position,
      label: bestMatchY.target.label,
      type: bestMatchY.target.type,
    };
  }

  const guides = [];
  if (activeGuideX) guides.push(activeGuideX);
  if (activeGuideY) guides.push(activeGuideY);

  return {
    snapDeltaX,
    snapDeltaY,
    guides,
    activeSnapState: {
      targetX: nextSnapX,
      targetY: nextSnapY,
    },
  };
}
