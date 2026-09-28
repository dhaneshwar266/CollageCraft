/**
 * Viewport Navigation & Zoom Utilities (Workspace zoom locked permanently to 1.0)
 */

export const ZOOM_STEPS = [1.0];
export const MIN_ZOOM = 1.0;
export const MAX_ZOOM = 1.0;

/**
 * Workspace viewport zoom is locked to 1.0
 */
export function clampZoom() {
  return 1.0;
}

/**
 * Workspace viewport zoom is locked to 1.0
 */
export function getNextZoomIn() {
  return 1.0;
}

/**
 * Workspace viewport zoom is locked to 1.0
 */
export function getNextZoomOut() {
  return 1.0;
}

/**
 * Workspace viewport zoom is locked to 1.0
 */
export function calculateFitToScreen() {
  return { zoom: 1, panX: 0, panY: 0 };
}

/**
 * Workspace viewport zoom is locked to 1.0
 */
export function calculateFitToSelection() {
  return { zoom: 1, panX: 0, panY: 0 };
}

/**
 * Workspace viewport zoom is locked to 1.0
 */
export function calculateWheelZoom(e, currentViewport) {
  return { ...currentViewport, zoom: 1 };
}

