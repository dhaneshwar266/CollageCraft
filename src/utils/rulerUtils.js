/**
 * Ruler Utilities (Deprecated: Rulers removed)
 */

export function getRulerTicks() {
  return [];
}

export function screenToDocPct(screenPx, canvasRect, isHorizontal = true) {
  if (!canvasRect || canvasRect.width === 0 || canvasRect.height === 0) {
    return 50;
  }
  const offset = isHorizontal ? screenPx - canvasRect.left : screenPx - canvasRect.top;
  const totalLength = isHorizontal ? canvasRect.width : canvasRect.height;
  const pct = (offset / totalLength) * 100;
  return Math.max(-20, Math.min(120, parseFloat(pct.toFixed(2))));
}

export function docPctToCanvasPx(docPct, canvasRect, isHorizontal = true) {
  if (!canvasRect) return 0;
  const totalLength = isHorizontal ? canvasRect.width : canvasRect.height;
  return (docPct / 100) * totalLength;
}

