import { describe, it, expect } from 'vitest';

/**
 * Utility reproducing the frame resize calculation used in GridCollageView / FreestyleCanvasView
 */
function calculateNewFrameGeometry({
  actionType = 'resize-corner',
  initialSpec = { x: 0, y: 0, width: 50, height: 50 },
  startMouseX = 100,
  startMouseY = 100,
  currentMouseX = 150,
  currentMouseY = 150,
  containerRect = { width: 800, height: 600 },
  paddingPx = 0,
  viewportZoom = 1.0,
  minWidth = 5,
  minHeight = 5,
}) {
  const screenDeltaX = currentMouseX - startMouseX;
  const screenDeltaY = currentMouseY - startMouseY;

  const canvasDeltaX = screenDeltaX / viewportZoom;
  const canvasDeltaY = screenDeltaY / viewportZoom;

  const canvasWidth = Math.max(50, containerRect.width / viewportZoom - paddingPx * 2);
  const canvasHeight = Math.max(50, containerRect.height / viewportZoom - paddingPx * 2);

  const deltaPercentX = (canvasDeltaX / canvasWidth) * 100;
  const deltaPercentY = (canvasDeltaY / canvasHeight) * 100;

  const round2 = (val) => Math.round(val * 100) / 100;
  const init = { ...initialSpec };
  let newSpec = { ...init };

  if (actionType === 'resize-corner' || actionType === 'resize-bottom-right') {
    newSpec.width = round2(Math.max(minWidth, Math.min(100 - init.x, init.width + deltaPercentX)));
    newSpec.height = round2(Math.max(minHeight, Math.min(100 - init.y, init.height + deltaPercentY)));
  } else if (actionType === 'resize-right') {
    newSpec.width = round2(Math.max(minWidth, Math.min(100 - init.x, init.width + deltaPercentX)));
  } else if (actionType === 'resize-bottom') {
    newSpec.height = round2(Math.max(minHeight, Math.min(100 - init.y, init.height + deltaPercentY)));
  } else if (actionType === 'resize-top-right') {
    newSpec.width = round2(Math.max(minWidth, Math.min(100 - init.x, init.width + deltaPercentX)));
    const rawH = init.height - deltaPercentY;
    const clampedH = Math.max(minHeight, Math.min(init.y + init.height, rawH));
    newSpec.y = round2(init.y + (init.height - clampedH));
    newSpec.height = round2(clampedH);
  } else if (actionType === 'resize-bottom-left') {
    const rawW = init.width - deltaPercentX;
    const clampedW = Math.max(minWidth, Math.min(init.x + init.width, rawW));
    newSpec.x = round2(init.x + (init.width - clampedW));
    newSpec.width = round2(clampedW);
    newSpec.height = round2(Math.max(minHeight, Math.min(100 - init.y, init.height + deltaPercentY)));
  } else if (actionType === 'resize-top-left') {
    const rawW = init.width - deltaPercentX;
    const clampedW = Math.max(minWidth, Math.min(init.x + init.width, rawW));
    newSpec.x = round2(init.x + (init.width - clampedW));
    newSpec.width = round2(clampedW);

    const rawH = init.height - deltaPercentY;
    const clampedH = Math.max(minHeight, Math.min(init.y + init.height, rawH));
    newSpec.y = round2(init.y + (init.height - clampedH));
    newSpec.height = round2(clampedH);
  }

  return newSpec;
}

describe('Outer Cell Frame Continuous Fine Resize Tests', () => {
  const containerRect1x = { width: 800, height: 600 };
  const containerRect2x = { width: 1600, height: 1200 };

  it('TEST 1: A 1px mouse movement causes a very small resize (0.125% delta)', () => {
    const initSpec = { x: 0, y: 0, width: 50, height: 50 };
    const res = calculateNewFrameGeometry({
      initialSpec: initSpec,
      startMouseX: 100,
      startMouseY: 100,
      currentMouseX: 101, // 1px mouse move
      currentMouseY: 101, // 1px mouse move
      containerRect: containerRect1x,
      viewportZoom: 1.0,
    });

    // 1px on 800px = 0.125% -> 50.13%
    // 1px on 600px = 0.1667% -> 50.17%
    expect(res.width).toBe(50.13);
    expect(res.height).toBe(50.17);
  });

  it('TEST 2: A 10px mouse movement does NOT cause a 25% jump', () => {
    const initSpec = { x: 0, y: 0, width: 50, height: 50 };
    const res = calculateNewFrameGeometry({
      initialSpec: initSpec,
      startMouseX: 100,
      startMouseY: 100,
      currentMouseX: 110, // 10px mouse move
      currentMouseY: 110, // 10px mouse move
      containerRect: containerRect1x,
      viewportZoom: 1.0,
    });

    // 10px on 800px is 1.25% -> 51.25%
    expect(res.width).toBe(51.25);
    expect(res.width).not.toBe(75);
    expect(res.width).not.toBe(25);
  });

  it('TEST 3: Resize values contain fractional percentages (e.g. 50.12%, 50.37%, 51.04%)', () => {
    const initSpec = { x: 0, y: 0, width: 50, height: 50 };
    
    const res1 = calculateNewFrameGeometry({
      initialSpec: initSpec, startMouseX: 100, startMouseY: 100,
      currentMouseX: 101, currentMouseY: 101, containerRect: containerRect1x,
    });
    expect(res1.width).toBe(50.13);

    const res2 = calculateNewFrameGeometry({
      initialSpec: initSpec, startMouseX: 100, startMouseY: 100,
      currentMouseX: 103, currentMouseY: 103, containerRect: containerRect1x,
    });
    expect(res2.width).toBe(50.38);

    const res3 = calculateNewFrameGeometry({
      initialSpec: initSpec, startMouseX: 100, startMouseY: 100,
      currentMouseX: 108, currentMouseY: 108, containerRect: containerRect1x,
    });
    expect(res3.width).toBe(51.0);
  });

  it('TEST 4: No 25% quantization exists (continuous resolution)', () => {
    const initSpec = { x: 0, y: 0, width: 50, height: 50 };
    const widths = [];
    for (let px = 0; px <= 20; px += 2) {
      const res = calculateNewFrameGeometry({
        initialSpec: initSpec, startMouseX: 100, startMouseY: 100,
        currentMouseX: 100 + px, currentMouseY: 100, containerRect: containerRect1x,
      });
      widths.push(res.width);
    }

    // Check that every step produces distinct fractional values
    const uniqueWidths = new Set(widths);
    expect(uniqueWidths.size).toBe(widths.length);
    expect(widths).toEqual([50, 50.25, 50.5, 50.75, 51, 51.25, 51.5, 51.75, 52, 52.25, 52.5]);
  });

  it('TEST 5: Minimum 5% constraint still works', () => {
    const initSpec = { x: 10, y: 10, width: 20, height: 20 };
    const res = calculateNewFrameGeometry({
      initialSpec: initSpec, startMouseX: 300, startMouseY: 300,
      currentMouseX: 50, currentMouseY: 50, containerRect: containerRect1x,
    });

    expect(res.width).toBe(5);
    expect(res.height).toBe(5);
  });

  it('TEST 6: Canvas boundary constraint still works (x + width <= 100%)', () => {
    const initSpec = { x: 40, y: 40, width: 40, height: 40 };
    const res = calculateNewFrameGeometry({
      initialSpec: initSpec, startMouseX: 100, startMouseY: 100,
      currentMouseX: 900, currentMouseY: 900, containerRect: containerRect1x,
    });

    expect(res.x + res.width).toBeLessThanOrEqual(100);
    expect(res.y + res.height).toBeLessThanOrEqual(100);
    expect(res.width).toBe(60);
    expect(res.height).toBe(60);
  });

  it('TEST 7: Viewport zoom 1x and 2x produce proportional resize behavior', () => {
    const initSpec = { x: 0, y: 0, width: 50, height: 50 };

    const res1x = calculateNewFrameGeometry({
      initialSpec: initSpec, startMouseX: 100, startMouseY: 100,
      currentMouseX: 180, currentMouseY: 160, containerRect: containerRect1x, viewportZoom: 1.0,
    });

    const res2x = calculateNewFrameGeometry({
      initialSpec: initSpec, startMouseX: 200, startMouseY: 200,
      currentMouseX: 360, currentMouseY: 320, containerRect: containerRect2x, viewportZoom: 2.0,
    });

    expect(res1x.width).toBe(60);
    expect(res2x.width).toBe(60);
    expect(res1x.height).toBe(60);
    expect(res2x.height).toBe(60);
  });
});
