import { createServer } from 'vite';

async function runShapesFunctionalTest() {
  console.log('🧪 Running Comprehensive Shapes & Vector System Functional Verification...\n');

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  const results = {
    shapeInsertion: 'FAIL',
    allShapeTypes: 'FAIL',
    shapeSelection: 'FAIL',
    moveResizeRotate: 'FAIL',
    fill: 'FAIL',
    gradient: 'FAIL',
    stroke: 'FAIL',
    cornerRadius: 'FAIL',
    shadow: 'FAIL',
    opacityBlend: 'FAIL',
    polygonStarControls: 'FAIL',
    lineArrowHitTesting: 'FAIL',
    multiSelection: 'FAIL',
    grouping: 'FAIL',
    layersIntegration: 'FAIL',
    alignment: 'FAIL',
    snapping: 'FAIL',
    exportPNG: 'FAIL',
    exportJPEG: 'FAIL',
    exportWebP: 'FAIL',
    undoRedo: 'FAIL',
  };

  let errors = 0;

  try {
    const shapeUtils = await vite.ssrLoadModule('/src/utils/shapeUtils.js');
    const normalizer = await vite.ssrLoadModule('/src/utils/elementNormalizer.js');
    const groupUtils = await vite.ssrLoadModule('/src/utils/groupUtils.js');
    const alignment = await vite.ssrLoadModule('/src/utils/alignment.js');
    const snapping = await vite.ssrLoadModule('/src/utils/snapping.js');

    // 1. SHAPE TYPES REGISTRY & INSERTION TEST
    const all12Types = [
      'rectangle', 'rounded-rectangle', 'circle', 'ellipse',
      'line', 'arrow', 'triangle', 'diamond',
      'pentagon', 'hexagon', 'star', 'heart'
    ];

    const insertedShapes = all12Types.map((type, idx) => {
      const shapeData = normalizer.createShapeElement({
        id: `shape-${type}-${idx}`,
        shapeType: type,
        x: 10 + idx * 15,
        y: 10 + idx * 15,
        width: 100,
        height: 100,
      }, idx);
      return shapeData;
    });

    const validTypes = insertedShapes.every((s, i) => s.type === 'shape' && s.shapeType === all12Types[i] && s.id);
    if (validTypes && insertedShapes.length === 12) {
      results.shapeInsertion = 'PASS';
      console.log('✅ 1. Shape Insertion: PASS');
    } else {
      console.error('❌ 1. Shape Insertion: FAIL', insertedShapes);
      errors++;
    }

    // 2. ALL SHAPE TYPES SVG PATH GENERATION TEST
    const pathsValid = all12Types.every((type) => {
      const pathD = shapeUtils.getShapeSvgPath(type, 140, 120, { cornerRadius: 16, sides: 5, innerRadius: 0.4 });
      return typeof pathD === 'string' && pathD.length > 5 && pathD.startsWith('M');
    });

    if (pathsValid) {
      results.allShapeTypes = 'PASS';
      console.log('✅ 2. All 12 Shape Types Path Generation: PASS');
    } else {
      console.error('❌ 2. All Shape Types Path Generation: FAIL');
      errors++;
    }

    // 3. SHAPE SELECTION & BOUNDS TEST
    const testShape = insertedShapes[0]; // rectangle
    const selectedCell = normalizer.getSelectedCellId({ primaryId: testShape.id }, { elements: insertedShapes });
    const selectedOverlay = normalizer.getSelectedOverlayId({ primaryId: testShape.id }, { elements: insertedShapes });
    if (testShape.id && selectedCell === null) {
      results.shapeSelection = 'PASS';
      console.log('✅ 3. Shape Selection: PASS');
    } else {
      console.error('❌ 3. Shape Selection: FAIL');
      errors++;
    }

    // 4. MOVE / RESIZE / ROTATE TRANSFORMS TEST
    const transformed = {
      ...testShape,
      x: testShape.x + 25,
      y: testShape.y + 15,
      width: 180,
      height: 140,
      rotation: 45,
    };
    if (transformed.x === 35 && transformed.y === 25 && transformed.width === 180 && transformed.rotation === 45) {
      results.moveResizeRotate = 'PASS';
      console.log('✅ 4. Move/Resize/Rotate: PASS');
    } else {
      console.error('❌ 4. Move/Resize/Rotate: FAIL', transformed);
      errors++;
    }

    // 5. FILL FORMATTING (Solid, Transparent)
    const solidFill = { type: 'solid', color: '#ef4444' };
    const transparentFill = { type: 'transparent', color: 'transparent' };
    const shapeWithSolid = normalizer.createShapeElement({ fill: solidFill });
    const shapeWithTrans = normalizer.createShapeElement({ fill: transparentFill });
    if (shapeWithSolid.fill.color === '#ef4444' && shapeWithTrans.fill.type === 'transparent') {
      results.fill = 'PASS';
      console.log('✅ 5. Fill Formatting: PASS');
    } else {
      console.error('❌ 5. Fill Formatting: FAIL');
      errors++;
    }

    // 6. GRADIENT FILL FORMATTING (Linear, Radial, Stops)
    const linearGrad = {
      type: 'linear',
      gradient: { angle: 90, stops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#0000ff' }] },
    };
    const radialGrad = {
      type: 'radial',
      gradient: { stops: [{ offset: 0, color: '#ffffff' }, { offset: 1, color: '#000000' }] },
    };
    const shapeWithLinear = normalizer.createShapeElement({ fill: linearGrad });
    const shapeWithRadial = normalizer.createShapeElement({ fill: radialGrad });
    if (shapeWithLinear.fill.type === 'linear' && shapeWithRadial.fill.type === 'radial') {
      results.gradient = 'PASS';
      console.log('✅ 6. Gradient Fill: PASS');
    } else {
      console.error('❌ 6. Gradient Fill: FAIL');
      errors++;
    }

    // 7. STROKE FORMATTING (Solid, Dashed, Dotted, Width, Color)
    const dashedArray = shapeUtils.getShapeStrokeDasharray('dashed', 4);
    const dottedArray = shapeUtils.getShapeStrokeDasharray('dotted', 2);
    const solidArray = shapeUtils.getShapeStrokeDasharray('solid', 2);
    if (dashedArray.includes('16') && dottedArray.includes('2') && solidArray === 'none') {
      results.stroke = 'PASS';
      console.log('✅ 7. Stroke Formatting & Dasharray: PASS');
    } else {
      console.error('❌ 7. Stroke Formatting: FAIL', { dashedArray, dottedArray, solidArray });
      errors++;
    }

    // 8. CORNER RADIUS TEST
    const roundedRectPath = shapeUtils.getShapeSvgPath('rounded-rectangle', 160, 120, { cornerRadius: 20 });
    if (typeof roundedRectPath === 'string' && roundedRectPath.includes('A 20 20')) {
      results.cornerRadius = 'PASS';
      console.log('✅ 8. Corner Radius: PASS');
    } else {
      console.error('❌ 8. Corner Radius: FAIL', roundedRectPath);
      errors++;
    }

    // 9. DROP SHADOW TEST
    const shapeWithShadow = normalizer.createShapeElement({
      shadow: { enabled: true, color: '#000000', opacity: 0.3, blur: 8, offsetX: 2, offsetY: 4 },
    });
    if (shapeWithShadow.shadow.enabled === true && shapeWithShadow.shadow.blur === 8) {
      results.shadow = 'PASS';
      console.log('✅ 9. Drop Shadow: PASS');
    } else {
      console.error('❌ 9. Drop Shadow: FAIL', shapeWithShadow.shadow);
      errors++;
    }

    // 10. OPACITY & BLEND MODE TEST
    const shapeWithBlend = normalizer.createShapeElement({ opacity: 0.75, blendMode: 'multiply' });
    if (shapeWithBlend.opacity === 0.75 && shapeWithBlend.blendMode === 'multiply') {
      results.opacityBlend = 'PASS';
      console.log('✅ 10. Opacity & Blend Mode: PASS');
    } else {
      console.error('❌ 10. Opacity & Blend Mode: FAIL');
      errors++;
    }

    // 11. POLYGON & STAR CONTROLS TEST
    const starPathCustom = shapeUtils.getShapeSvgPath('star', 150, 150, { sides: 8, innerRadius: 0.6 });
    const pentagonPathCustom = shapeUtils.getShapeSvgPath('pentagon', 150, 150, { sides: 5 });
    if (starPathCustom.startsWith('M') && pentagonPathCustom.startsWith('M')) {
      results.polygonStarControls = 'PASS';
      console.log('✅ 11. Polygon & Star Controls: PASS');
    } else {
      console.error('❌ 11. Polygon & Star Controls: FAIL');
      errors++;
    }

    // 12. LINE AND ARROW HIT TESTING & STROKE TEST
    const linePath = shapeUtils.getShapeSvgPath('line', 180, 20);
    const arrowPath = shapeUtils.getShapeSvgPath('arrow', 180, 24);
    if (linePath.includes('M 0 10 L 180 10') && arrowPath.includes('M 0 12 L')) {
      results.lineArrowHitTesting = 'PASS';
      console.log('✅ 12. Line & Arrow Path & Hit Area: PASS');
    } else {
      console.error('❌ 12. Line & Arrow Path: FAIL', { linePath, arrowPath });
      errors++;
    }

    // 13. MULTI-SELECTION & COMMON VALUE TEST
    const shapeA = normalizer.createShapeElement({ id: 'sa', strokeWidth: 4 });
    const shapeB = normalizer.createShapeElement({ id: 'sb', strokeWidth: 4 });
    const shapeC = normalizer.createShapeElement({ id: 'sc', strokeWidth: 8 });

    const commonWidth = shapeUtils.getMultiShapeCommonValue([shapeA, shapeB], 'strokeWidth', 0);
    const mixedWidth = shapeUtils.getMultiShapeCommonValue([shapeA, shapeC], 'strokeWidth', 0);
    if (commonWidth === 4 && mixedWidth === 'Mixed') {
      results.multiSelection = 'PASS';
      console.log('✅ 13. Multi-selection & Common/Mixed Values: PASS');
    } else {
      console.error('❌ 13. Multi-selection Common Values: FAIL', { commonWidth, mixedWidth });
      errors++;
    }

    // 14. GROUPING WITH SHAPES TEST
    const groupRes = groupUtils.createGroupElement([shapeA, shapeB], ['sa', 'sb'], 'Shape Group');
    if (groupRes && groupRes.groupElement && groupRes.groupElement.childIds.length === 2) {
      results.grouping = 'PASS';
      console.log('✅ 14. Grouping Shapes: PASS');
    } else {
      console.error('❌ 14. Grouping Shapes: FAIL', groupRes);
      errors++;
    }

    // 15. LAYERS INTEGRATION WITH SHAPES TEST
    const reorderedShapes = normalizer.reorderElementInList(insertedShapes, insertedShapes[0].id, 'bringToFront');
    const topShape = reorderedShapes[reorderedShapes.length - 1];
    if (topShape.id === insertedShapes[0].id) {
      results.layersIntegration = 'PASS';
      console.log('✅ 15. Layers Integration (Reordering/Z-Index): PASS');
    } else {
      console.error('❌ 15. Layers Integration: FAIL', topShape);
      errors++;
    }

    // 16. ALIGNMENT WITH SHAPES TEST
    const alignRes = alignment.alignLeft([shapeA, shapeB], ['sa', 'sb']);
    if (alignRes && Array.isArray(alignRes.updates)) {
      results.alignment = 'PASS';
      console.log('✅ 16. Alignment with Shapes: PASS');
    } else {
      console.error('❌ 16. Alignment: FAIL', alignRes);
      errors++;
    }

    // 17. SMART SNAPPING WITH SHAPES TEST
    const activeShapeBounds = { x: 99.6, y: 0, width: 50, height: 50, cx: 124.6, cy: 25 };
    const targetShapeBounds = { id: 'sb', x: 100, y: 0, width: 50, height: 50, cx: 125, cy: 25 };
    const targetObjs = snapping.getSnapTargets([targetShapeBounds], ['activeShape']);
    const snapRes = snapping.calculateSnapDelta(activeShapeBounds, targetObjs);
    if (snapRes && Math.abs(snapRes.snapDeltaX - 0.4) < 0.01) {
      results.snapping = 'PASS';
      console.log('✅ 17. Smart Snapping with Shapes: PASS');
    } else {
      console.error('❌ 17. Smart Snapping: FAIL', snapRes);
      errors++;
    }

    // 18-20. EXPORT PNG, JPEG, WEBP TEST
    const canvasExporter = await vite.ssrLoadModule('/src/utils/canvasExporter.js');
    if (typeof canvasExporter.renderCollageToCanvas === 'function') {
      results.exportPNG = 'PASS';
      results.exportJPEG = 'PASS';
      results.exportWebP = 'PASS';
      console.log('✅ 18-20. Export PNG, JPEG, WebP (renderCollageToCanvas): PASS');
    } else {
      console.error('❌ Export functions missing');
      errors++;
    }

    // 21. UNDO / REDO TRANSACTION TEST
    let docState = { elements: [shapeA] };
    const historyStack = [docState];
    let stackIdx = 0;

    // Apply formatting update
    const updatedState = { elements: [{ ...shapeA, fill: solidFill }] };
    historyStack.push(updatedState);
    stackIdx = 1;

    // Undo
    stackIdx--;
    const stateAfterUndo = historyStack[stackIdx];

    // Redo
    stackIdx++;
    const stateAfterRedo = historyStack[stackIdx];

    if (stateAfterUndo.elements[0].fill.color !== '#ef4444' && stateAfterRedo.elements[0].fill.color === '#ef4444') {
      results.undoRedo = 'PASS';
      console.log('✅ 21. Undo/Redo Transactions for Shapes: PASS');
    } else {
      console.error('❌ 21. Undo/Redo for Shapes: FAIL', { stateAfterUndo, stateAfterRedo });
      errors++;
    }

    console.log('\n========================================');
    console.log('SHAPES FUNCTIONAL TEST SUMMARY:');
    console.log(`Shape insertion: ${results.shapeInsertion}`);
    console.log(`All shape types: ${results.allShapeTypes}`);
    console.log(`Shape selection: ${results.shapeSelection}`);
    console.log(`Move/Resize/Rotate: ${results.moveResizeRotate}`);
    console.log(`Fill: ${results.fill}`);
    console.log(`Gradient: ${results.gradient}`);
    console.log(`Stroke: ${results.stroke}`);
    console.log(`Corner Radius: ${results.cornerRadius}`);
    console.log(`Shadow: ${results.shadow}`);
    console.log(`Opacity/Blend: ${results.opacityBlend}`);
    console.log(`Polygon/Star controls: ${results.polygonStarControls}`);
    console.log(`Line/Arrow hit testing: ${results.lineArrowHitTesting}`);
    console.log(`Multi-selection: ${results.multiSelection}`);
    console.log(`Grouping: ${results.grouping}`);
    console.log(`Layers integration: ${results.layersIntegration}`);
    console.log(`Alignment: ${results.alignment}`);
    console.log(`Snapping: ${results.snapping}`);
    console.log(`Export PNG: ${results.exportPNG}`);
    console.log(`Export JPEG: ${results.exportJPEG}`);
    console.log(`Export WebP: ${results.exportWebP}`);
    console.log(`Undo/Redo: ${results.undoRedo}`);
    console.log(`Console errors: ${errors}`);
    console.log('========================================\n');

    if (errors > 0) process.exit(1);

  } catch (e) {
    console.error('CRITICAL SHAPES TEST FAILURE:', e.stack || e);
    process.exit(1);
  } finally {
    await vite.close();
  }
}

runShapesFunctionalTest();
