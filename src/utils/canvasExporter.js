import { getImageFilterStyle } from './imageUtils';
import { getShapeSvgPath, normalizeShapeElement } from './shapeUtils';
import { normalizeStickerElement } from './stickerUtils';
import { ASPECT_RATIOS, LAYOUT_PRESETS, getAutoGridLayout } from './layoutTemplates';
import { isElementHidden } from './groupUtils';
import { normalizeTextElement, getTextTransformedValue } from './textUtils';

/**
 * Loads an HTMLImageElement asynchronously from a URL or Data URI
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Renders the entire collage onto an offscreen canvas and returns the canvas object
 */
export async function renderCollageToCanvas(state, scaleMultiplier = 1) {
  const {
    aspectRatio = '1:1',
    layoutId = 'side-by-side',
    frameSettings = {},
    backgroundSettings = {},
    cells = [],
    assets = [],
    textOverlays = [],
    stickers = [],
    freestylePositions = {},
  } = state;

  const aspectSpec = ASPECT_RATIOS.find((a) => a.id === aspectRatio) || ASPECT_RATIOS[0];
  const targetWidth = aspectSpec.width * scaleMultiplier;
  const targetHeight = aspectSpec.height * scaleMultiplier;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas 2D context not available');

  const {
    padding = 16,
    gap = 12,
    cornerRadius = 16,
    cellShadow = false,
  } = frameSettings;

  // Scale frame settings to export resolution
  const scaledPadding = (padding / 100) * Math.min(targetWidth, targetHeight);
  const scaledGap = (gap / 100) * Math.min(targetWidth, targetHeight) * 0.5;
  const scaledRadius = (cornerRadius / 100) * Math.min(targetWidth, targetHeight) * 0.2;

  // 1. RENDER BACKGROUND
  ctx.save();
  if (backgroundSettings.type === 'color') {
    ctx.fillStyle = backgroundSettings.value || '#0f172a';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (backgroundSettings.type === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    const stops = backgroundSettings.stops || ['#4f46e5', '#9333ea'];
    stops.forEach((stop, idx) => {
      grad.addColorStop(idx / (stops.length - 1), stop);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (backgroundSettings.type === 'blur' && backgroundSettings.blurAssetUrl) {
    try {
      const bgImg = await loadImage(backgroundSettings.blurAssetUrl);
      ctx.save();
      ctx.filter = 'blur(30px) brightness(0.6)';
      // Draw image scaled to cover canvas
      const bgRatio = bgImg.width / bgImg.height;
      const canvasRatio = targetWidth / targetHeight;
      let drawW, drawH, drawX, drawY;
      if (bgRatio > canvasRatio) {
        drawH = targetHeight;
        drawW = targetHeight * bgRatio;
        drawX = (targetWidth - drawW) / 2;
        drawY = 0;
      } else {
        drawW = targetWidth;
        drawH = targetWidth / bgRatio;
        drawX = 0;
        drawY = (targetHeight - drawH) / 2;
      }
      ctx.drawImage(bgImg, drawX - 40, drawY - 40, drawW + 80, drawH + 80);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
  }
  ctx.restore();

  // Calculate inner workspace rectangle after outer padding
  const innerX = scaledPadding;
  const innerY = scaledPadding;
  const innerW = Math.max(10, targetWidth - scaledPadding * 2);
  const innerH = Math.max(10, targetHeight - scaledPadding * 2);

  // Pre-load asset images map
  const loadedImagesMap = new Map();
  await Promise.all(
    assets.map(async (asset) => {
      try {
        const img = await loadImage(asset.url);
        loadedImagesMap.set(asset.id, img);
      } catch (err) {
        console.warn(`Could not load asset ${asset.id}`, err);
      }
    })
  );

  // 2. RENDER PHOTO CELLS
  if (layoutId === 'freestyle') {
    // RENDER FREESTYLE / SCRAPBOOK MODE
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (isElementHidden(state.document?.elements, cell)) continue;
      const asset = assets.find((a) => a.id === cell.assetId);
      const img = asset ? loadedImagesMap.get(asset.id) : null;
      if (!img) continue;

      const freePos = freestylePositions[cell.id] || {
        x: 10 + (i * 15) % 60,
        y: 10 + (i * 15) % 60,
        width: 35,
        height: 35,
        rotation: (i % 2 === 0 ? 1 : -1) * (i * 4 + 3),
      };

      const cellX = innerX + (freePos.x / 100) * innerW;
      const cellY = innerY + (freePos.y / 100) * innerH;
      const cellW = (freePos.width / 100) * innerW;
      const cellH = (freePos.height / 100) * innerH;

      ctx.save();
      ctx.translate(cellX + cellW / 2, cellY + cellH / 2);
      ctx.rotate((freePos.rotation * Math.PI) / 180);

      // Cell Shadow
      if (cellShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 20 * scaleMultiplier;
        ctx.shadowOffsetY = 10 * scaleMultiplier;
      }

      // Cell opacity & blend mode
      ctx.globalAlpha = cell.opacity ?? 1;
      if (cell.blendMode && cell.blendMode !== 'normal') {
        ctx.globalCompositeOperation = cell.blendMode;
      }

      // Draw rounded clipped box
      ctx.beginPath();
      const radiusVal = cell.borderRadius ?? cornerRadius;
      const r = Math.min((radiusVal / 100) * Math.min(cellW, cellH), cellW / 2, cellH / 2);
      const halfW = cellW / 2;
      const halfH = cellH / 2;
      ctx.roundRect(-halfW, -halfH, cellW, cellH, r);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.clip();

      // Filter
      ctx.filter = getImageFilterStyle(cell);

      // Fit/Fill inside cell frame
      const zoom = cell.zoom || 1;
      const panX = ((cell.panX || 0) / 100) * cellW;
      const panY = ((cell.panY || 0) / 100) * cellH;

      drawSingleCellImage(ctx, img, -halfW, -halfH, cellW, cellH, zoom, panX, panY, cell);

      ctx.restore();
    }
  } else {
    // RENDER GRID LAYOUT
    let preset = LAYOUT_PRESETS.find((p) => p.id === layoutId);
    let cellSpecs = preset ? preset.cells : getAutoGridLayout(cells.length);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (isElementHidden(state.document?.elements, cell)) continue;
      const spec = cell?.specOverride || cellSpecs[i] || { x: 0, y: 0, width: 100, height: 100 };
      const asset = assets.find((a) => a.id === cell.assetId);
      const img = asset ? loadedImagesMap.get(asset.id) : null;

      // Calculate cell dimensions with inner gap offset
      const halfGap = scaledGap / 2;
      const rawCellX = innerX + (spec.x / 100) * innerW;
      const rawCellY = innerY + (spec.y / 100) * innerH;
      const rawCellW = (spec.width / 100) * innerW;
      const rawCellH = (spec.height / 100) * innerH;

      const cellX = rawCellX + halfGap;
      const cellY = rawCellY + halfGap;
      const cellW = Math.max(10, rawCellW - scaledGap);
      const cellH = Math.max(10, rawCellH - scaledGap);

      ctx.save();

      // Cell opacity & blend mode
      ctx.globalAlpha = cell.opacity ?? 1;
      if (cell.blendMode && cell.blendMode !== 'normal') {
        ctx.globalCompositeOperation = cell.blendMode;
      }

      if (cellShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 15 * scaleMultiplier;
        ctx.shadowOffsetY = 6 * scaleMultiplier;
      }

      // Draw cell rounded rect
      const radiusVal = cell.borderRadius ?? cornerRadius;
      const r = Math.min((radiusVal / 100) * Math.min(cellW, cellH), cellW / 2, cellH / 2);
      ctx.beginPath();
      ctx.roundRect(cellX, cellY, cellW, cellH, r);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // Clip inside cell
      ctx.clip();

      if (img) {
        ctx.filter = getImageFilterStyle(cell);

        const zoom = cell.zoom || 1;
        const panX = (cell.panX || 0) * scaleMultiplier;
        const panY = (cell.panY || 0) * scaleMultiplier;

        drawSingleCellImage(ctx, img, cellX, cellY, cellW, cellH, zoom, panX, panY, cell);
      }

      ctx.restore();
    }
  }

  // 3. RENDER TEXT OVERLAYS
  for (const rawTxt of textOverlays) {
    if (isElementHidden(state.document?.elements, rawTxt)) continue;
    const txt = normalizeTextElement(rawTxt);
    ctx.save();

    const txtX = (txt.x / 100) * targetWidth;
    const txtY = (txt.y / 100) * targetHeight;

    ctx.translate(txtX, txtY);
    if (txt.rotation) ctx.rotate((txt.rotation * Math.PI) / 180);

    const fontPx = (txt.fontSize || 48) * scaleMultiplier;
    ctx.font = `${txt.fontStyle || 'normal'} ${txt.fontWeight || 400} ${fontPx}px ${txt.fontFamily || 'Inter'}, sans-serif`;
    ctx.textAlign = txt.textAlign || 'center';
    ctx.textBaseline = 'middle';

    const displayVal = getTextTransformedValue(txt.text || '', txt.textTransform);
    const lines = (displayVal || '').split('\n');

    const lineHeightPx = fontPx * (txt.lineHeight || 1.2);
    const totalH = lines.length * lineHeightPx;

    // Measure maximum line width
    let maxLineW = 0;
    lines.forEach((line) => {
      const metrics = ctx.measureText(line);
      maxLineW = Math.max(maxLineW, metrics.width);
    });

    const paddingPx = (txt.padding || 0) * scaleMultiplier;
    const radiusPx = (txt.borderRadius || 0) * scaleMultiplier;
    const boxW = maxLineW + paddingPx * 2;
    const boxH = totalH + paddingPx * 2;

    // Render Background Box/Pill
    if (txt.backgroundColor && txt.backgroundColor !== 'transparent') {
      ctx.save();
      ctx.fillStyle = txt.backgroundColor;
      ctx.globalAlpha = txt.backgroundOpacity ?? 1;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, radiusPx);
      ctx.fill();

      // Border
      if (txt.borderWidth > 0) {
        ctx.lineWidth = txt.borderWidth * scaleMultiplier;
        ctx.strokeStyle = txt.borderColor || '#000000';
        ctx.stroke();
      }
      ctx.restore();
    }

    // Shadow
    if (txt.shadow?.enabled) {
      ctx.shadowColor = txt.shadow.color || '#000000';
      ctx.shadowBlur = (txt.shadow.blur || 4) * scaleMultiplier;
      ctx.shadowOffsetX = (txt.shadow.offsetX || 0) * scaleMultiplier;
      ctx.shadowOffsetY = (txt.shadow.offsetY || 2) * scaleMultiplier;
    }

    // Draw lines
    lines.forEach((line, idx) => {
      const lineY = -totalH / 2 + lineHeightPx / 2 + idx * lineHeightPx;
      let lineX = 0;
      if (txt.textAlign === 'left') lineX = -maxLineW / 2;
      if (txt.textAlign === 'right') lineX = maxLineW / 2;

      // Outline Stroke
      if (txt.outline?.enabled && txt.outline.width > 0) {
        ctx.strokeStyle = txt.outline.color || '#000000';
        ctx.lineWidth = txt.outline.width * scaleMultiplier * 2;
        ctx.strokeText(line, lineX, lineY);
      }

      // Fill Text
      ctx.fillStyle = txt.color || '#ffffff';
      ctx.fillText(line, lineX, lineY);

      // Underline / Strikethrough
      if (txt.textDecoration && txt.textDecoration !== 'none') {
        const lineW = ctx.measureText(line).width;
        let decX = lineX;
        if (txt.textAlign === 'center') decX = -lineW / 2;
        if (txt.textAlign === 'right') decX = maxLineW / 2 - lineW;

        ctx.strokeStyle = txt.color || '#ffffff';
        ctx.lineWidth = Math.max(1, fontPx * 0.06);
        ctx.beginPath();
        if (txt.textDecoration === 'underline') {
          ctx.moveTo(decX, lineY + fontPx * 0.35);
          ctx.lineTo(decX + lineW, lineY + fontPx * 0.35);
        } else if (txt.textDecoration === 'line-through') {
          ctx.moveTo(decX, lineY);
          ctx.lineTo(decX + lineW, lineY);
        }
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // 4. RENDER STICKER & ICON OVERLAYS
  const stickerElements = (state.document?.elements || []).filter((el) => el.type === 'sticker');
  for (const rawSticker of stickerElements) {
    if (isElementHidden(state.document?.elements, rawSticker)) continue;
    const st = normalizeStickerElement(rawSticker);
    ctx.save();

    const stX = (st.x / 100) * targetWidth;
    const stY = (st.y / 100) * targetHeight;
    const stW = (st.width || 64) * scaleMultiplier;
    const stH = (st.height || 64) * scaleMultiplier;

    ctx.translate(stX, stY);
    if (st.rotation) ctx.rotate((st.rotation * Math.PI) / 180);
    if (st.flipH || st.flipV) {
      ctx.scale(st.flipH ? -1 : 1, st.flipV ? -1 : 1);
    }

    ctx.globalAlpha = st.opacity ?? 1;
    if (st.blendMode && st.blendMode !== 'normal') {
      ctx.globalCompositeOperation = st.blendMode;
    }

    // Shadow
    if (st.shadow?.enabled) {
      ctx.shadowColor = st.shadow.color || '#000000';
      ctx.shadowBlur = (st.shadow.blur || 4) * scaleMultiplier;
      ctx.shadowOffsetX = (st.shadow.offsetX || 0) * scaleMultiplier;
      ctx.shadowOffsetY = (st.shadow.offsetY || 2) * scaleMultiplier;
    }

    if (st.stickerSource === 'emoji') {
      const stSize = Math.min(stW, stH);
      ctx.font = `${stSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.content || st.emoji || '✨', 0, 0);
    } else if (st.content && st.content.startsWith('M')) {
      // SVG path vector drawing
      const path2d = new Path2D(st.content);
      ctx.translate(-stW / 2, -stH / 2);
      ctx.scale(stW / 24, stH / 24);

      if (st.fill && st.fill !== 'transparent' && st.fill !== 'none') {
        ctx.fillStyle = st.fill;
        ctx.fill(path2d);
      }

      if (st.strokeWidth > 0 && st.stroke && st.stroke !== 'none') {
        ctx.lineWidth = st.strokeWidth;
        ctx.strokeStyle = st.stroke;
        ctx.stroke(path2d);
      }
    }

    ctx.restore();
  }

  // 5. RENDER VECTOR SHAPE ELEMENTS
  const shapeElements = (state.document?.elements || []).filter((el) => el.type === 'shape');
  for (const rawShape of shapeElements) {
    if (isElementHidden(state.document?.elements, rawShape)) continue;
    const shape = normalizeShapeElement(rawShape);
    ctx.save();

    const shapeX = (shape.x / 100) * targetWidth;
    const shapeY = (shape.y / 100) * targetHeight;
    const shapeW = (shape.width / 100) * targetWidth;
    const shapeH = (shape.height / 100) * targetHeight;

    ctx.translate(shapeX, shapeY);
    if (shape.rotation) ctx.rotate((shape.rotation * Math.PI) / 180);
    if (shape.flipH || shape.flipV) {
      ctx.scale(shape.flipH ? -1 : 1, shape.flipV ? -1 : 1);
    }

    ctx.globalAlpha = shape.opacity ?? 1;
    if (shape.blendMode && shape.blendMode !== 'normal') {
      ctx.globalCompositeOperation = shape.blendMode;
    }

    // Shadow
    if (shape.shadow?.enabled) {
      ctx.shadowColor = shape.shadow.color || '#000000';
      ctx.shadowBlur = (shape.shadow.blur || 4) * scaleMultiplier;
      ctx.shadowOffsetX = (shape.shadow.offsetX || 0) * scaleMultiplier;
      ctx.shadowOffsetY = (shape.shadow.offsetY || 3) * scaleMultiplier;
    }

    const svgPathD = getShapeSvgPath(shape.shapeType, shapeW, shapeH, {
      cornerRadius: (shape.cornerRadius || 0) * scaleMultiplier,
      sides: shape.sides,
      innerRadius: shape.innerRadius,
    });

    const path2d = new Path2D(svgPathD);

    // Fill
    if (shape.fill && shape.fill.type !== 'transparent') {
      if (typeof shape.fill === 'string') {
        ctx.fillStyle = shape.fill;
      } else if (shape.fill.type === 'solid') {
        ctx.fillStyle = shape.fill.color || '#3b82f6';
      } else if (shape.fill.gradient && shape.fill.type === 'linear') {
        const angleRad = ((shape.fill.gradient.angle || 0) * Math.PI) / 180;
        const grad = ctx.createLinearGradient(
          0,
          0,
          Math.cos(angleRad) * shapeW,
          Math.sin(angleRad) * shapeH
        );
        (shape.fill.gradient.stops || []).forEach((s) => {
          grad.addColorStop(s.offset, s.color);
        });
        ctx.fillStyle = grad;
      } else if (shape.fill.gradient && shape.fill.type === 'radial') {
        const grad = ctx.createRadialGradient(
          shapeW / 2,
          shapeH / 2,
          0,
          shapeW / 2,
          shapeH / 2,
          Math.max(shapeW, shapeH) / 2
        );
        (shape.fill.gradient.stops || []).forEach((s) => {
          grad.addColorStop(s.offset, s.color);
        });
        ctx.fillStyle = grad;
      }
      ctx.fill(path2d);
    }

    // Stroke
    if (shape.strokeWidth > 0) {
      ctx.lineWidth = shape.strokeWidth * scaleMultiplier;
      ctx.strokeStyle = shape.stroke || '#000000';
      const sw = ctx.lineWidth;

      if (shape.strokeStyle === 'dashed') {
        ctx.setLineDash([sw * 4, sw * 2]);
      } else if (shape.strokeStyle === 'dotted') {
        ctx.setLineDash([sw, sw * 2]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke(path2d);
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Helper to draw image inside bounding box with object-fit cover, pan, zoom, rotation, and flips
 */
function drawSingleCellImage(ctx, img, cellX, cellY, cellW, cellH, zoom, panX, panY, cell = {}) {
  ctx.save();

  const rotation = cell.rotation || 0;
  const flipH = cell.flipH || false;
  const flipV = cell.flipV || false;

  // Move origin to center of cell box
  const centerX = cellX + cellW / 2;
  const centerY = cellY + cellH / 2;
  ctx.translate(centerX + panX, centerY + panY);

  if (rotation) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  const scaleX = flipH ? -1 : 1;
  const scaleY = flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Crop clipping box if crop enabled
  if (cell.crop?.enabled) {
    const cropX = ((cell.crop.x || 0) / 100 - 0.5) * cellW;
    const cropY = ((cell.crop.y || 0) / 100 - 0.5) * cellH;
    const cropW = ((cell.crop.width || 100) / 100) * cellW;
    const cropH = ((cell.crop.height || 100) / 100) * cellH;

    ctx.beginPath();
    ctx.rect(cropX, cropY, cropW, cropH);
    ctx.clip();
  }

  // Compute cover dimensions
  const imgRatio = img.width / img.height;
  const cellRatio = cellW / cellH;

  let renderW, renderH;
  if (imgRatio > cellRatio) {
    renderH = cellH * zoom;
    renderW = renderH * imgRatio;
  } else {
    renderW = cellW * zoom;
    renderH = renderW / imgRatio;
  }

  ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);

  // Draw Vignette if enabled
  if (cell.vignette > 0) {
    const maxRadius = Math.sqrt(Math.pow(cellW / 2, 2) + Math.pow(cellH / 2, 2));
    const innerR = maxRadius * (1 - cell.vignette / 100);
    const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, maxRadius);
    const alpha = (cell.vignetteIntensity || 0.6) * (cell.vignette / 100);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${alpha.toFixed(2)})`);

    ctx.fillStyle = grad;
    ctx.fillRect(-renderW / 2, -renderH / 2, renderW, renderH);
  }

  ctx.restore();
}
