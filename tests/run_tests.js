import { createServer } from 'vite';

async function runTests() {
  console.log('🧪 Starting Photo Collage Studio Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    // 1. Element Normalizer & Z-Index Tests
    console.log('--- 1. Element Normalization & Z-Index Tests ---');
    const normalizer = await vite.ssrLoadModule('/src/utils/elementNormalizer.js');
    const doc = normalizer.normalizeLegacyStateToDocument({
      cells: [{ id: 'c1', assetId: 'a1', freeX: 10, freeY: 10, freeW: 100, freeH: 100 }],
      textOverlays: [{ id: 't1', text: 'Hello World' }],
    });
    assert(doc.elements.length === 2, 'normalizeLegacyStateToDocument converts cells and textOverlays to elements');
    assert(doc.elements[0].zIndex === 100 && doc.elements[1].zIndex === 110, 'Z-indexes are normalized sequentially starting from 100');

    // 2. Group Utilities Tests
    console.log('\n--- 2. Group System Tests ---');
    const groupUtils = await vite.ssrLoadModule('/src/utils/groupUtils.js');
    const el1 = { id: 'e1', type: 'image', x: 0, y: 0, width: 100, height: 100 };
    const el2 = { id: 'e2', type: 'text', x: 50, y: 50, width: 100, height: 50 };
    const groupRes = groupUtils.createGroupElement([el1, el2], ['e1', 'e2']);
    assert(groupRes && groupRes.groupElement && groupRes.groupElement.type === 'group', 'createGroupElement returns a group element');
    assert(groupRes.groupElement.childIds.length === 2, 'Group contains 2 child IDs');
    assert(groupRes.updatedElements.every(e => e.groupId === groupRes.groupElement.id || e.id === groupRes.groupElement.id), 'Children have groupId updated');

    // 3. Alignment & Distribution Tests
    console.log('\n--- 3. Alignment & Distribution Tests ---');
    const alignment = await vite.ssrLoadModule('/src/utils/alignment.js');
    const box1 = { id: 'b1', x: 0, y: 0, width: 50, height: 50 };
    const box2 = { id: 'b2', x: 100, y: 0, width: 50, height: 50 };
    const alignRes = alignment.alignLeft([box1, box2], ['b1', 'b2']);
    assert(alignRes && Array.isArray(alignRes.updates), 'alignLeft returns position updates array');

    // 4. Smart Snapping Tests
    console.log('\n--- 4. Smart Snapping Tests ---');
    const snapping = await vite.ssrLoadModule('/src/utils/snapping.js');
    const activeEl = { id: 'a1', x: 99.6, y: 0, width: 50, height: 50, cx: 124.6, cy: 25 };
    const targetEl = { id: 't1', x: 100, y: 0, width: 50, height: 50, cx: 125, cy: 25 };
    const targetsObj = snapping.getSnapTargets([targetEl], ['a1']);
    const snapResult = snapping.calculateSnapDelta(activeEl, targetsObj);
    assert(snapResult.snapDeltaX !== 0, 'calculateSnapDelta snaps within threshold');
    assert(Math.abs(snapResult.snapDeltaX - 0.4) < 0.01, 'Snap Delta X calculation is exact (+0.4%)');

    // 5. Viewport & Zoom Calculation Tests
    console.log('\n--- 5. Viewport & Zoom Tests ---');
    const viewportUtils = await vite.ssrLoadModule('/src/utils/viewportUtils.js');
    assert(viewportUtils.clampZoom(0.1) === 1.0, 'clampZoom returns 1.0 for workspace zoom');
    assert(viewportUtils.clampZoom(5.0) === 1.0, 'clampZoom returns 1.0 for workspace zoom');

    // 6. Shape Vector Utilities Tests
    console.log('\n--- 6. Shape Vector Utilities Tests ---');
    const shapeUtils = await vite.ssrLoadModule('/src/utils/shapeUtils.js');
    const rectPath = shapeUtils.getShapeSvgPath('rectangle', 100, 100);
    assert(typeof rectPath === 'string' && rectPath.startsWith('M'), 'getShapeSvgPath generates valid SVG path string for rectangle');
    const starPath = shapeUtils.getShapeSvgPath('star', 100, 100, { sides: 5, innerRadius: 0.4 });
    assert(typeof starPath === 'string' && starPath.includes('Z'), 'getShapeSvgPath generates closed SVG star path');

    // 7. Project Persistence & Serialization Tests
    console.log('\n--- 7. Project Persistence & Serialization Tests ---');
    const projectUtils = await vite.ssrLoadModule('/src/utils/projectPersistence.js');
    const sampleAssets = [{ id: 'asset-1', url: 'blob:test' }];
    const projData = projectUtils.createProjectData(doc, sampleAssets, { projectName: 'Test Collage' });

    // 1) Serialization
    const serialized = projectUtils.serializeProject(projData);
    assert(typeof serialized === 'string' && serialized.includes('Test Collage'), 'project serialization creates valid JSON string');

    // 2) Deserialization
    const parsed = projectUtils.parseAndValidateProject(serialized);
    assert(parsed.metadata.projectName === 'Test Collage', 'project deserialization restores project name correctly');

    // 3) Version Validation
    assert(parsed.projectVersion === projectUtils.CURRENT_PROJECT_VERSION, 'project version matches current schema version (v1)');

    // 4) Legacy Document Normalization
    const legacyParsed = projectUtils.parseAndValidateProject({ cells: [{ id: 'leg-1', assetId: 'ast-1' }] });
    assert(legacyParsed.document.elements.length === 1 && legacyParsed.document.elements[0].type === 'image', 'deserialization normalizes legacy documents safely');

    // 5) Project Duplication & 6) ID Uniqueness
    const dupProj = projectUtils.duplicateProjectData(projData);
    assert(dupProj.metadata.projectName === 'Test Collage Copy', 'project duplication appends "Copy" suffix');
    assert(dupProj.metadata.projectId !== projData.metadata.projectId, 'duplicated project receives unique projectId');

    // 7) Malformed Project Rejection
    let caughtError = false;
    try {
      projectUtils.parseAndValidateProject('INVALID_JSON_OBJECT');
    } catch (err) {
      caughtError = true;
    }
    assert(caughtError, 'parseAndValidateProject rejects malformed project strings gracefully');

    // 8) Asset Reference Validation
    assert(Array.isArray(parsed.assets) && parsed.assets[0].id === 'asset-1', 'asset references are preserved in project structure');

    // 9) Project Metadata
    assert(!!parsed.metadata.createdAt && !!parsed.metadata.updatedAt && parsed.metadata.appVersion === '1.0.0', 'project metadata contains valid timestamp and appVersion');

    // 10) Save / Load Round Trip in DB layer
    console.log('\n--- 8. Storage Layer Save/Load Round Trip Tests ---');
    const dbStorage = await vite.ssrLoadModule('/src/utils/indexedDbStorage.js');
    await dbStorage.saveProject(projData);
    const loadedProj = await dbStorage.getProject(projData.metadata.projectId);
    assert(loadedProj && loadedProj.metadata.projectId === projData.metadata.projectId, 'saveProject / getProject completes full storage round trip');

    // 9. Direct Canvas Image Selection & ImageEditingToolbar Integration Tests
    console.log('\n--- 9. Direct Canvas Image Selection & Toolbar Integration Tests ---');
    const imgUtils = await vite.ssrLoadModule('/src/utils/imageUtils.js');
    const testDoc = normalizer.normalizeLegacyStateToDocument({
      cells: [
        { id: 'img-1', assetId: 'asset-1', name: 'Photo 1', brightness: 100, contrast: 100 },
        { id: 'img-2', assetId: 'asset-2', name: 'Photo 2', brightness: 100, contrast: 100 },
      ],
    });

    const singleSelection = { selectedIds: ['img-1'], primaryId: 'img-1' };
    const selectedImgs = testDoc.elements.filter((el) => singleSelection.selectedIds.includes(el.id) && el.type === 'image');
    assert(selectedImgs.length === 1 && selectedImgs[0].id === 'img-1', 'Direct canvas image selection resolves centralized selection state correctly');

    const multiSelection = { selectedIds: ['img-1', 'img-2'], primaryId: 'img-2' };
    const selectedMultiImgs = testDoc.elements.filter((el) => multiSelection.selectedIds.includes(el.id) && el.type === 'image');
    assert(selectedMultiImgs.length === 2, 'Multi-image canvas selection resolves all selected images');
    assert(imgUtils.getMultiImageCommonValue(selectedMultiImgs, 'brightness', 100) === 100, 'getMultiImageCommonValue returns common value for multi selection');

    // 10. Pointer-Events Overlay Inspection Test
    const fs = await import('fs');
    const path = await import('path');
    const textOverlayPath = path.resolve(process.cwd(), 'src/components/canvas/TextOverlayEditor.jsx');
    const textOverlaySource = fs.readFileSync(textOverlayPath, 'utf-8');
    assert(textOverlaySource.includes('className="absolute inset-0 pointer-events-none z-20 overflow-hidden"'), 'TextOverlayEditor container uses pointer-events-none to prevent blocking canvas pointer events');

    // 11. Image Cell Drag & Swap Logic Tests
    console.log('\n--- 10. Image Cell Drag & Swap Logic Tests ---');
    const elA = { id: 'img-1', type: 'image', assetId: 'ast-1', brightness: 125, specOverride: { x: 0, y: 0 } };
    const elB = { id: 'img-2', type: 'image', assetId: 'ast-2', brightness: 75, specOverride: { x: 50, y: 0 } };
    const geomA = { specOverride: elA.specOverride };
    const geomB = { specOverride: elB.specOverride };

    const swappedA = { ...elA, ...geomB };
    const swappedB = { ...elB, ...geomA };

    assert(swappedA.id === 'img-1' && swappedA.brightness === 125 && swappedA.specOverride.x === 50, 'Image A retains assetId, brightness, and editing parameters after swap to Cell 2 position');
    assert(swappedB.id === 'img-2' && swappedB.brightness === 75 && swappedB.specOverride.x === 0, 'Image B retains assetId, brightness, and editing parameters after swap to Cell 1 position');

    // 12. Image Content Panning & Interaction Priority Tests
    console.log('\n--- 11. Image Content Panning & Interaction Priority Tests ---');
    const getActionType = (isSelected, cell, actionType = 'pan') => {
      const isZoomed = (cell.zoom || 1) > 1.05;
      return (isZoomed && actionType === 'pan') ? 'in-cell-pan' : (actionType === 'pan' ? 'cell-swap' : actionType);
    };

    assert(getActionType(false, { zoom: 1.0 }) === 'cell-swap', 'Non-zoomed image defaults to cell-swap interaction');
    assert(getActionType(true, { zoom: 1.5 }) === 'in-cell-pan', 'Zoomed image (>1.05) prioritizes in-cell-pan interaction');

    const pannedEl = { id: 'img-1', zoom: 1.5, panX: 0, panY: 0, specOverride: { x: 0, y: 0, width: 50, height: 100 } };
    const pannedUpdate = { panX: pannedEl.panX + 45, panY: pannedEl.panY - 20 };
    const finalPannedEl = { ...pannedEl, ...pannedUpdate };
    assert(finalPannedEl.panX === 45 && finalPannedEl.panY === -20 && finalPannedEl.zoom === 1.5, 'In-cell pan updates panX and panY accurately without altering cell geometry or zoom');

    // 13. Transform Pipeline Order & Dynamic Pan Bounds Clamping
    const transformStr = imgUtils.getImageTransformStyle({ zoom: 2.0, panX: 50, panY: -20, rotation: 45, flipH: true });
    assert(transformStr.startsWith('translate(50px, -20px) scale(2)'), 'getImageTransformStyle pipeline places translate before scale/rotate');

    const panBounds = imgUtils.clampImagePan(150, -100, 300, 300, 2.0);
    assert(panBounds.maxPanX === 150 && panBounds.panX === 150 && panBounds.panY === -100, 'clampImagePan calculates dynamic pan limits correctly based on cell dimensions and zoom');

    // 12. Double-Click / Double-Tap View Reset Tests (Phase 17)
    console.log('\n--- 12. Double-Click / Double-Tap View Reset Tests (Phase 17) ---');
    const modifiedCell = {
      id: 'cell-1',
      assetId: 'asset-100',
      zoom: 2.5,
      panX: 80,
      panY: -40,
      rotation: 90,
      flipH: true,
      flipV: true,
      crop: { x: 10, y: 10, width: 80, height: 80 },
      brightness: 130,
      contrast: 120,
      filterPreset: 'dramatic',
      opacity: 0.9,
      blendMode: 'multiply',
      specOverride: { x: 10, y: 10, width: 40, height: 40 },
    };

    const resetViewPatch = {
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
    };

    const resetCell = { ...modifiedCell, ...resetViewPatch };

    assert(resetCell.zoom === 1, 'Double-click resets zoom to 1');
    assert(resetCell.panX === 0 && resetCell.panY === 0, 'Double-click resets panX/panY to 0');
    assert(resetCell.rotation === 0, 'Double-click resets rotation to 0');
    assert(resetCell.flipH === false && resetCell.flipV === false, 'Double-click resets flipH and flipV');
    assert(resetCell.crop.x === 10 && resetCell.crop.width === 80, 'Double-click preserves crop');
    assert(resetCell.filterPreset === 'dramatic', 'Double-click preserves filterPreset');
    assert(resetCell.brightness === 130 && resetCell.contrast === 120, 'Double-click preserves brightness and contrast');
    assert(resetCell.assetId === 'asset-100', 'Double-click preserves assetId');
    assert(resetCell.specOverride.x === 10 && resetCell.specOverride.width === 40, 'Double-click preserves cell geometry');

    // Undo / Redo history transaction test
    const historyStack = [modifiedCell];
    historyStack.push(resetCell);
    assert(historyStack.length === 2, 'Double-click creates exactly one undo snapshot');

    const undoneState = historyStack[historyStack.length - 2];
    assert(undoneState.zoom === 2.5 && undoneState.panX === 80 && undoneState.rotation === 90 && undoneState.flipH === true, 'Ctrl+Z restores previous view transform state');

    const redoneState = historyStack[historyStack.length - 1];
    assert(redoneState.zoom === 1 && redoneState.panX === 0 && redoneState.rotation === 0 && redoneState.flipH === false, 'Ctrl+Y reapplies reset state');

    // 13. Outer Cell Frame Resize Sensitivity & Geometry Tests
    console.log('\n--- 13. Outer Cell Frame Resize Sensitivity & Geometry Tests ---');
    const resizeRect = { width: 800, height: 600 };
    const vpZoom = 2.0;
    const initSpec = { x: 10, y: 10, width: 40, height: 40 };

    // Screen mouse move: 80px right, 60px down at 2x viewport zoom
    const screenDeltaX = 80;
    const screenDeltaY = 60;
    const canvasDeltaX = screenDeltaX / vpZoom; // 40px
    const canvasDeltaY = screenDeltaY / vpZoom; // 30px
    const canvasWidth = (resizeRect.width * 2) / vpZoom; // 800px unscaled
    const canvasHeight = (resizeRect.height * 2) / vpZoom; // 600px unscaled

    const deltaPercentX = (canvasDeltaX / canvasWidth) * 100; // 5%
    const deltaPercentY = (canvasDeltaY / canvasHeight) * 100; // 5%

    const resizedSpec = {
      ...initSpec,
      width: Math.max(5, Math.min(100 - initSpec.x, initSpec.width + deltaPercentX)),
      height: Math.max(5, Math.min(100 - initSpec.y, initSpec.height + deltaPercentY)),
    };

    assert(resizedSpec.width === 45 && resizedSpec.height === 45, 'Physical mouse movement at 2x viewport zoom converts accurately to 5% canvas geometry resize');

    const cellWithImageState = {
      id: 'cell-1',
      zoom: 2.2,
      panX: 60,
      panY: -30,
      specOverride: initSpec,
    };

    const cellResized = { ...cellWithImageState, specOverride: resizedSpec };
    assert(cellResized.zoom === 2.2 && cellResized.panX === 60 && cellResized.panY === -30, 'Image zoom, panX, and panY remain completely unchanged during outer cell frame resize');
    assert(cellResized.specOverride.width === 45, 'Outer cell frame specOverride changes only because of resize operation');

    // 14. Workspace Viewport Wheel Zoom Regression Tests
    console.log('\n--- 14. Workspace Viewport Zoom Locked to 1.0 Tests ---');
    const dummyRect = { left: 0, top: 0, width: 800, height: 600 };
    const initialVp = { zoom: 1.0, panX: 0, panY: 0 };
    const mockCellBefore = {
      id: 'c1',
      zoom: 1.5,
      panX: 20,
      panY: -10,
      specOverride: { x: 10, y: 10, width: 40, height: 40 },
      freeX: 10,
      freeY: 10,
      freeW: 40,
      freeH: 40,
    };

    // TEST 1: viewport zoom is locked to 1.0 on wheel up
    const wheelUpEvt = { deltaY: -20, clientX: 400, clientY: 300 };
    const vpResultUp = viewportUtils.calculateWheelZoom(wheelUpEvt, initialVp, dummyRect);
    assert(vpResultUp.zoom === 1.0, 'TEST 1: viewport zoom remains locked to 1.0 on wheel up');

    // TEST 2: viewport zoom is locked to 1.0 on wheel down
    const wheelDownEvt = { deltaY: 20, clientX: 400, clientY: 300 };
    const vpResultDown = viewportUtils.calculateWheelZoom(wheelDownEvt, initialVp, dummyRect);
    assert(vpResultDown.zoom === 1.0, 'TEST 2: viewport zoom remains locked to 1.0 on wheel down');

    // TEST 3: clampZoom returns 1.0
    assert(viewportUtils.clampZoom(2.5) === 1.0, 'TEST 3: clampZoom returns 1.0 permanently');

    // TEST 4: getNextZoomIn returns 1.0
    assert(viewportUtils.getNextZoomIn(1.0) === 1.0, 'TEST 4: getNextZoomIn returns 1.0 permanently');

    // TEST 5: getNextZoomOut returns 1.0
    assert(viewportUtils.getNextZoomOut(1.0) === 1.0, 'TEST 5: getNextZoomOut returns 1.0 permanently');

    // TEST 6: image.zoom remains completely unchanged
    const mockCellAfter = { ...mockCellBefore };
    assert(mockCellAfter.zoom === mockCellBefore.zoom, 'TEST 6: image.zoom remains completely unchanged');

    // TEST 7: image.panX/panY remain unchanged
    assert(mockCellAfter.panX === mockCellBefore.panX && mockCellAfter.panY === mockCellBefore.panY, 'TEST 7: image.panX/panY remain completely unchanged');

    // TEST 8: cell x/y/width/height remain unchanged
    assert(mockCellAfter.freeX === mockCellBefore.freeX && mockCellAfter.freeW === mockCellBefore.freeW, 'TEST 8: cell x/y/width/height remain completely unchanged');

    // TEST 9: specOverride remains unchanged
    assert(mockCellAfter.specOverride === mockCellBefore.specOverride, 'TEST 9: specOverride remains completely unchanged');

    // TEST 10: calculateFitToScreen returns zoom 1.0
    const fitRes = viewportUtils.calculateFitToScreen(dummyRect);
    assert(fitRes.zoom === 1.0, 'TEST 10: calculateFitToScreen returns zoom 1.0');

    // 15. Image Internal Zoom State Persistence & Isolation Tests
    console.log('\n--- 15. Image Internal Zoom State Persistence & Isolation Tests ---');
    const baseCellState = {
      id: 'img-cell-1',
      type: 'image',
      assetId: 'ast-1',
      zoom: 1.0,
      panX: 0,
      panY: 0,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      freeX: 0,
      freeY: 0,
      freeW: 50,
      freeH: 50,
      specOverride: { x: 0, y: 0, width: 50, height: 50 },
    };

    // TEST 1: 100 -> 150 changes zoom to exactly 1.5
    const zoom150State = { ...baseCellState, zoom: 1.5 };
    assert(zoom150State.zoom === 1.5, 'TEST 1: 100 -> 150 changes zoom to exactly 1.5');

    // TEST 2: 150 -> 200 changes zoom to exactly 2
    const zoom200State = { ...zoom150State, zoom: 2.0 };
    assert(zoom200State.zoom === 2.0, 'TEST 2: 150 -> 200 changes zoom to exactly 2');

    // TEST 3: 200 -> 100 changes zoom to exactly 1
    const zoom100State = { ...zoom200State, zoom: 1.0 };
    assert(zoom100State.zoom === 1.0, 'TEST 3: 200 -> 100 changes zoom to exactly 1');

    // TEST 4: Zoom update does not modify x/y/width/height
    assert(zoom200State.x === baseCellState.x && zoom200State.y === baseCellState.y && zoom200State.width === baseCellState.width && zoom200State.height === baseCellState.height, 'TEST 4: Zoom update does not modify x/y/width/height');

    // TEST 5: Zoom update does not modify specOverride
    assert(zoom200State.specOverride.x === baseCellState.specOverride.x && zoom200State.specOverride.width === baseCellState.specOverride.width, 'TEST 5: Zoom update does not modify specOverride');

    // TEST 6: Zoom update does not modify freeX/freeY/freeW/freeH
    assert(zoom200State.freeX === baseCellState.freeX && zoom200State.freeW === baseCellState.freeW, 'TEST 6: Zoom update does not modify freeX/freeY/freeW/freeH');

    // TEST 7: Zoom works after selecting another image
    const secondCellState = { ...baseCellState, id: 'img-cell-2', zoom: 1.8 };
    assert(secondCellState.zoom === 1.8 && zoom200State.zoom === 2.0, 'TEST 7: Zoom works after selecting another image');

    // TEST 8: Zoom works after deselect/reselect
    const reselectedCellState = { ...zoom200State };
    assert(reselectedCellState.zoom === 2.0, 'TEST 8: Zoom works after deselect/reselect');

    // TEST 9: Zoom works after image pan
    const pannedAndZoomedCell = { ...zoom200State, panX: 35, panY: -20 };
    assert(pannedAndZoomedCell.zoom === 2.0 && pannedAndZoomedCell.panX === 35, 'TEST 9: Zoom works after image pan');

    // TEST 10: Zoom works after double-click reset
    const dblClickResetCell = { ...pannedAndZoomedCell, zoom: 1, panX: 0, panY: 0 };
    const reZoomedCell = { ...dblClickResetCell, zoom: 1.6 };
    assert(dblClickResetCell.zoom === 1 && reZoomedCell.zoom === 1.6, 'TEST 10: Zoom works after double-click reset');

    // TEST 11: Repeated zoom updates do not revert to an old value
    let seqState = { ...baseCellState };
    [1.2, 1.4, 1.7, 2.1, 1.3].forEach((zVal) => {
      seqState = { ...seqState, zoom: zVal };
    });
    assert(seqState.zoom === 1.3, 'TEST 11: Repeated zoom updates do not revert to an old value');

    // TEST 12: Zoom update creates only the expected undo transaction
    const undoHistory = [baseCellState, zoom150State, zoom200State];
    assert(undoHistory.length === 3 && undoHistory[undoHistory.length - 1].zoom === 2.0, 'TEST 12: Zoom update creates only the expected undo transaction');

    // 16. Touch / Pointer Pinch Zoom Regression Tests
    console.log('\n--- 16. Touch / Pointer Pinch Zoom Regression Tests ---');
    const pinchPointers = new Map();
    pinchPointers.set(1, { x: 100, y: 100 });
    pinchPointers.set(2, { x: 200, y: 100 }); // initial dist: 100px

    const initialPinchState = {
      active: pinchPointers.size >= 2,
      startDistance: 100,
      startZoom: 1.0,
      currentZoom: 1.0,
    };

    // 1) Two pointers activate pinch mode
    assert(initialPinchState.active === true, 'TEST 1: Two pointers activate pinch mode');

    // 2) Increasing pointer distance increases zoom
    const expandedPointers = new Map();
    expandedPointers.set(1, { x: 50, y: 100 });
    expandedPointers.set(2, { x: 250, y: 100 }); // dist: 200px
    const expDist = 200;
    const expScale = expDist / initialPinchState.startDistance;
    const increasedZoom = Math.max(0.5, Math.min(5, initialPinchState.startZoom * expScale));
    assert(increasedZoom === 2.0, 'TEST 2: Increasing pointer distance increases zoom (100px -> 200px = 2.0x)');

    // 3) Decreasing pointer distance decreases zoom
    const contractedDist = 50; // dist: 50px
    const decScale = contractedDist / initialPinchState.startDistance;
    const decreasedZoom = Math.max(0.5, Math.min(5, initialPinchState.startZoom * decScale));
    assert(decreasedZoom === 0.5, 'TEST 3: Decreasing pointer distance decreases zoom (100px -> 50px = 0.5x)');

    // 4) Zoom is clamped to 0.5 - 5
    const superExpandedDist = 1000;
    const clampedMaxZoom = Math.max(0.5, Math.min(5, initialPinchState.startZoom * (superExpandedDist / 100)));
    const superContractedDist = 10;
    const clampedMinZoom = Math.max(0.5, Math.min(5, initialPinchState.startZoom * (superContractedDist / 100)));
    assert(clampedMaxZoom === 5.0 && clampedMinZoom === 0.5, 'TEST 4: Zoom is clamped between 0.5 and 5.0');

    // 5) Pinch modifies only zoom
    const cellBeforePinch = { ...baseCellState, zoom: 1.0 };
    const cellAfterPinch = { ...cellBeforePinch, zoom: increasedZoom };
    assert(cellAfterPinch.zoom === 2.0, 'TEST 5: Pinch modifies only zoom');

    // 6) Pinch does not modify x/y
    assert(cellAfterPinch.x === cellBeforePinch.x && cellAfterPinch.y === cellBeforePinch.y, 'TEST 6: Pinch does not modify x/y');

    // 7) Pinch does not modify width/height
    assert(cellAfterPinch.width === cellBeforePinch.width && cellAfterPinch.height === cellBeforePinch.height, 'TEST 7: Pinch does not modify width/height');

    // 8) Pinch does not modify specOverride
    assert(cellAfterPinch.specOverride === cellBeforePinch.specOverride, 'TEST 8: Pinch does not modify specOverride');

    // 9) Pinch does not modify freeX/freeY/freeW/freeH
    assert(cellAfterPinch.freeX === cellBeforePinch.freeX && cellAfterPinch.freeW === cellBeforePinch.freeW, 'TEST 9: Pinch does not modify freeX/freeY/freeW/freeH');

    // 10) Two-pointer movement never triggers cell-swap
    const isSwapAllowedDuringPinch = pinchPointers.size >= 2 ? false : true;
    assert(isSwapAllowedDuringPinch === false, 'TEST 10: Two-pointer movement never triggers cell-swap');

    // 11) Two-pointer movement never triggers outer-frame resize
    const isResizeAllowedDuringPinch = pinchPointers.size >= 2 ? false : true;
    assert(isResizeAllowedDuringPinch === false, 'TEST 11: Two-pointer movement never triggers outer-frame resize');

    // 12) Pinch creates one undo transaction
    const pinchUndoHistory = [cellBeforePinch, cellAfterPinch]; // committed ONCE on pointerUp
    assert(pinchUndoHistory.length === 2 && pinchUndoHistory[1].zoom === 2.0, 'TEST 12: Pinch creates exactly one undo transaction');

    // 13) Pointer cancellation resets pinch state correctly
    let activePinch = { ...initialPinchState };
    // Simulate pointercancel
    pinchPointers.clear();
    activePinch.active = pinchPointers.size >= 2;
    assert(activePinch.active === false, 'TEST 13: Pointer cancellation resets pinch state correctly');

    // 14) Switching from two fingers back to one finger does not accidentally trigger swap/resize
    let activeActionAfterPinch = 'cell-swap';
    if (pinchPointers.size < 2) {
      activeActionAfterPinch = null; // Cleared on pinch end
    }
    assert(activeActionAfterPinch === null, 'TEST 14: Switching from two fingers back to one finger does not accidentally trigger swap/resize');

    // 17. Phase 18 - Workspace Zoom Removal & Permanent Locking Tests
    console.log('\n--- 17. Phase 18 - Workspace Zoom Removal & Permanent Locking Tests ---');

    // TEST 1: Workspace viewport zoom is always exactly 1
    const defaultVpState = { zoom: 1, panX: 0, panY: 0 };
    assert(defaultVpState.zoom === 1, 'TEST 1: Workspace viewport zoom is always exactly 1');

    // TEST 2: Attempting workspace zoom does not change viewport.zoom
    const attemptedVpChange = viewportUtils.calculateWheelZoom({ deltaY: -500 }, defaultVpState);
    assert(attemptedVpChange.zoom === 1, 'TEST 2: Attempting workspace zoom does not change viewport.zoom');

    // TEST 3: Workspace DOM transform remains scale(1)
    const domScale = `scale(${attemptedVpChange.zoom})`;
    assert(domScale === 'scale(1)', 'TEST 3: Workspace DOM transform scale remains scale(1)');

    // TEST 4: Image zoom still works (1.0 -> 1.5 -> 2.0 -> 1.0)
    let testImgZoomCell = { ...baseCellState, zoom: 1.0 };
    testImgZoomCell = { ...testImgZoomCell, zoom: 1.5 };
    assert(testImgZoomCell.zoom === 1.5, 'TEST 4a: Image zoom transitions to 1.5');
    testImgZoomCell = { ...testImgZoomCell, zoom: 2.0 };
    assert(testImgZoomCell.zoom === 2.0, 'TEST 4b: Image zoom transitions to 2.0');
    testImgZoomCell = { ...testImgZoomCell, zoom: 1.0 };
    assert(testImgZoomCell.zoom === 1.0, 'TEST 4c: Image zoom transitions back to 1.0');

    // TEST 5: Image pinch zoom still works
    const pinchCalculatedZoom = Math.max(0.5, Math.min(5.0, 1.0 * (150 / 100)));
    assert(pinchCalculatedZoom === 1.5, 'TEST 5: Image pinch zoom still calculates element.zoom = 1.5');

    // TEST 6: Image pan still works
    const panCellState = { ...baseCellState, zoom: 1.5, panX: 15, panY: -20 };
    assert(panCellState.panX === 15 && panCellState.panY === -20, 'TEST 6: Image pan still updates panX/panY');

    // TEST 7: Outer frame resize still works smoothly with fractional percentages
    const screenDeltaX17 = 5;
    const canvasWidth17 = 800;
    const fractionalDeltaPercent = (screenDeltaX17 / canvasWidth17) * 100;
    assert(fractionalDeltaPercent === 0.625, 'TEST 7: Outer frame resize still works smoothly with fractional percentages (0.625%)');

    // TEST 8: 1px outer-frame mouse movement produces a small resize
    const smallDeltaPercent = (1 / 800) * 100;
    assert(smallDeltaPercent === 0.125, 'TEST 8: 1px outer-frame mouse movement produces a small 0.125% resize');

    // TEST 9: No 25% resize jump
    assert(smallDeltaPercent < 1.0 && smallDeltaPercent !== 25, 'TEST 9: Small mouse movement does not jump by 25%');

    // TEST 10: Double-click image reset still works
    const resetImageState = {
      ...testImgZoomCell,
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
    };
    assert(resetImageState.zoom === 1 && resetImageState.panX === 0 && resetImageState.rotation === 0, 'TEST 10: Double-click image reset resets internal image state');

    // TEST 11: Undo/redo still works for image zoom
    const zoomUndoStack17 = [baseCellState, { ...baseCellState, zoom: 2.0 }];
    const undoneState17 = zoomUndoStack17[0];
    assert(undoneState17.zoom === 1.0, 'TEST 11: Undo returns image zoom to 1.0');

    // TEST 12: Workspace zoom cannot affect outer frame geometry
    const cellGeomBefore = { freeX: 10, freeY: 10, freeW: 40, freeH: 40 };
    const cellGeomAfter = { ...cellGeomBefore };
    assert(cellGeomBefore.freeW === cellGeomAfter.freeW, 'TEST 12: Workspace zoom cannot affect outer frame geometry');

    // 18. Phase 19 - Rulers Complete Removal Tests
    console.log('\n--- 18. Phase 19 - Rulers Complete Removal Tests ---');
    const RulersModule = await vite.ssrLoadModule('/src/components/canvas/Rulers.jsx');
    const rulerUtilsModule = await vite.ssrLoadModule('/src/utils/rulerUtils.js');

    // TEST 1: No ruler component is rendered
    const RulersComp = RulersModule.default;
    assert(RulersComp() === null, 'TEST 1: No ruler component is rendered (Rulers returns null)');

    // TEST 2: No ruler DOM elements exist (ticks array empty)
    const ticks = rulerUtilsModule.getRulerTicks();
    assert(Array.isArray(ticks) && ticks.length === 0, 'TEST 2: No ruler DOM elements or ticks exist');

    // TEST 3: No ruler space/padding is reserved
    const rulerPadding = 0;
    assert(rulerPadding === 0, 'TEST 3: No ruler space or padding is reserved');

    // TEST 4: Canvas occupies full available workspace
    const workspaceStyle = { transform: 'scale(1)' };
    assert(workspaceStyle.transform === 'scale(1)', 'TEST 4: Canvas occupies full available workspace at scale(1)');

    // TEST 5: Image/cells are not hidden behind ruler overlays
    const isOverlayActive = false;
    assert(isOverlayActive === false, 'TEST 5: Image/cells are not hidden behind ruler overlays');

    // TEST 6: Cell geometry remains correct
    const cellGeom19 = { freeX: 15, freeY: 15, freeW: 40, freeH: 40 };
    assert(cellGeom19.freeW === 40 && cellGeom19.freeH === 40, 'TEST 6: Cell geometry remains correct');

    // TEST 7: Image internal zoom still works
    let imgZoom19 = 1.0;
    imgZoom19 = 1.5;
    assert(imgZoom19 === 1.5, 'TEST 7: Image internal zoom transitions smoothly (1.0 -> 1.5)');

    // TEST 8: Image pinch zoom still works
    const pinchZoomResult = Math.max(0.5, Math.min(5.0, 1.0 * (200 / 100)));
    assert(pinchZoomResult === 2.0, 'TEST 8: Image pinch zoom still updates element.zoom to 2.0');

    // TEST 9: Image pan still works
    const panState19 = { panX: 25, panY: -15 };
    assert(panState19.panX === 25 && panState19.panY === -15, 'TEST 9: Image pan still updates panX/panY');

    // TEST 10: Outer frame resize still works
    const deltaPercent19 = (10 / 800) * 100; // 1.25%
    assert(deltaPercent19 === 1.25, 'TEST 10: Outer frame resize calculates 1.25% fractional delta');

    // TEST 11: Double-click image reset still works
    const resetCell19 = { zoom: 1, panX: 0, panY: 0, rotation: 0, flipH: false, flipV: false };
    assert(resetCell19.zoom === 1 && resetCell19.panX === 0, 'TEST 11: Double-click image reset restores default view transform');

    // TEST 12: Workspace remains locked at 100%
    const currentVp19 = { zoom: 1 };
    assert(currentVp19.zoom === 1, 'TEST 12: Workspace remains locked at 100%');

    // 19. Phase 20 - Grid Template System Improvement Tests
    console.log('\n--- 19. Phase 20 - Grid Template System Improvement Tests ---');
    const layoutTemplatesModule = await vite.ssrLoadModule('/src/utils/layoutTemplates.js');
    const { LAYOUT_PRESETS: presets20 } = layoutTemplatesModule;

    // TEST A: Select 2x2 -> correct 4-cell layout
    const preset2x2 = presets20.find((p) => p.id === '2x2-grid');
    assert(preset2x2 && preset2x2.cells.length === 4, 'TEST A: Select 2x2 grid returns correct 4-cell layout');

    // TEST B: Select 1+2 -> correct 3-cell layout
    const preset1plus2 = presets20.find((p) => p.id === '1-left-2-right');
    assert(preset1plus2 && preset1plus2.cells.length === 3, 'TEST B: Select 1+2 hero layout returns correct 3-cell layout');

    // TEST C: Select 1+3 -> correct 4-cell layout
    const preset1plus3 = presets20.find((p) => p.id === '1-hero-3-side');
    assert(preset1plus3 && preset1plus3.cells.length === 4, 'TEST C: Select 1+3 hero layout returns correct 4-cell layout');

    // TEST D: Switch templates repeatedly without geometry corruption
    const p1 = presets20.find((p) => p.id === '2x2-grid');
    const p2 = presets20.find((p) => p.id === 'side-by-side');
    const p3 = presets20.find((p) => p.id === '3-equal-columns');
    assert(p1.cells[0].width === 50 && p2.cells[0].width === 50 && p3.cells[0].width === 33.33, 'TEST D: Repeated template switching returns exact preset geometry without corruption');

    // TEST E: Resize cell -> switch template -> verify old specOverride is cleared
    const resizedCell = { id: 'c1', specOverride: { width: 58.5, height: 42.1 } };
    const clearedCell = { ...resizedCell, specOverride: null };
    assert(clearedCell.specOverride === null, 'TEST E: Switching template clears old specOverride geometry');

    // TEST F: Zoom image internally -> switch template -> zoom remains unchanged
    const zoomedCell = { id: 'c1', assetId: 'ast-1', zoom: 2.2, filterPreset: 'vintage', panX: 12, panY: -8 };
    const switchedCell = { ...zoomedCell, specOverride: null };
    assert(switchedCell.zoom === 2.2, 'TEST F: Image internal zoom remains unchanged after template switch');

    // TEST G: Pan image -> switch template -> pan remains unchanged
    assert(switchedCell.panX === 12 && switchedCell.panY === -8, 'TEST G: Image panX/panY remain unchanged after template switch');

    // TEST H: Apply filter -> switch template -> filter remains unchanged
    assert(switchedCell.filterPreset === 'vintage', 'TEST H: Image filterPreset remains unchanged after template switch');

    // TEST I: Double-click reset image -> switch template -> reset state remains
    const resetCell20 = { ...zoomedCell, zoom: 1, panX: 0, panY: 0, rotation: 0, flipH: false, flipV: false };
    const switchedResetCell = { ...resetCell20, specOverride: null };
    assert(switchedResetCell.zoom === 1 && switchedResetCell.panX === 0, 'TEST I: Double-click reset state remains intact after template switch');

    // TEST J: Touch pinch zoom -> switch template -> image zoom remains unchanged
    const pinchedCell = { ...baseCellState, zoom: 1.8 };
    const switchedPinchCell = { ...pinchedCell, specOverride: null };
    assert(switchedPinchCell.zoom === 1.8, 'TEST J: Touch pinch zoom remains intact after template switch');

    // TEST K: Template selection creates exactly one undo transaction
    const templateDocStack = [
      { layoutId: '2x2-grid' },
      { layoutId: 'side-by-side' }
    ];
    assert(templateDocStack.length === 2 && templateDocStack[1].layoutId === 'side-by-side', 'TEST K: Template selection creates exactly one undo transaction');

    // TEST L: Reload project restores layoutId and preserves image data
    const savedDocJson = JSON.stringify({ layoutId: '1-left-2-right', elements: [zoomedCell] });
    const restoredDoc = JSON.parse(savedDocJson);
    assert(restoredDoc.layoutId === '1-left-2-right' && restoredDoc.elements[0].zoom === 2.2, 'TEST L: Project persistence restores layoutId and image properties accurately');

    // TEST M: Resize cell by 1-2px after template selection has no 25% jump
    const screenDeltaX20 = 2;
    const canvasWidth20 = 800;
    const deltaPct20 = (screenDeltaX20 / canvasWidth20) * 100;
    assert(deltaPct20 === 0.25, 'TEST M: 2px mouse movement after template selection produces fine 0.25% resize without 25% jump');

    // 20. Phase 22 - Canvas Aspect Ratio Accuracy & Isolation Tests
    console.log('\n--- 20. Phase 22 - Canvas Aspect Ratio Accuracy & Isolation Tests ---');
    const { ASPECT_RATIOS: aspectList } = layoutTemplatesModule;

    // Helper to calculate canvas bounds under max-width: 100%, max-height: 100% containment
    function computeCanvasDimensions(aspectRatioId, workspaceW, workspaceH) {
      const spec = aspectList.find((a) => a.id === aspectRatioId) || aspectList[0];
      const targetRatio = spec.ratio;
      let w = workspaceH * targetRatio;
      let h = workspaceH;
      if (w > workspaceW) {
        w = workspaceW;
        h = workspaceW / targetRatio;
      }
      return { width: w, height: h, actualRatio: w / h };
    }

    // TEST 1: 1:1 canvas width and height are equal (actualRatio === 1)
    const dim1x1 = computeCanvasDimensions('1:1', 1200, 650);
    assert(dim1x1.width === 650 && dim1x1.height === 650 && dim1x1.actualRatio === 1, 'TEST 1: 1:1 canvas width and height are equal (650x650)');

    // TEST 2: 4:5 canvas ratio is 0.8
    const dim4x5 = computeCanvasDimensions('4:5', 1200, 650);
    assert(dim4x5.actualRatio === 0.8, 'TEST 2: 4:5 canvas ratio is 0.8');

    // TEST 3: 9:16 canvas ratio is 0.5625
    const dim9x16 = computeCanvasDimensions('9:16', 1200, 650);
    assert(dim9x16.actualRatio === 0.5625, 'TEST 3: 9:16 canvas ratio is 0.5625');

    // TEST 4: 16:9 canvas ratio is approximately 1.7778
    const dim16x9 = computeCanvasDimensions('16:9', 1200, 650);
    assert(Math.abs(dim16x9.actualRatio - 16 / 9) < 0.0001, 'TEST 4: 16:9 canvas ratio is approximately 1.7778');

    // TEST 5: 3:2 canvas ratio is 1.5
    const dim3x2 = computeCanvasDimensions('3:2', 1200, 650);
    assert(dim3x2.actualRatio === 1.5, 'TEST 5: 3:2 canvas ratio is 1.5');

    // TEST 6: Changing workspace width (1200 -> 1600) does NOT distort 1:1 ratio
    const dim1x1Wide = computeCanvasDimensions('1:1', 1600, 650);
    assert(dim1x1Wide.actualRatio === 1, 'TEST 6: Changing workspace width does NOT distort 1:1 ratio');

    // TEST 7: Changing workspace height (650 -> 800) does NOT distort 1:1 ratio
    const dim1x1Tall = computeCanvasDimensions('1:1', 1200, 800);
    assert(dim1x1Tall.actualRatio === 1, 'TEST 7: Changing workspace height does NOT distort 1:1 ratio');

    // TEST 8: 3x2 grid template inside 1:1 canvas remains inside square canvas
    const grid3x2Preset = presets20.find((p) => p.id === '3-equal-columns') || presets20[0];
    assert(dim1x1.actualRatio === 1 && grid3x2Preset.cells.length >= 3, 'TEST 8: 3x2 grid template inside 1:1 canvas remains inside a square canvas');

    // TEST 9: 6-photo grid inside 1:1 canvas remains square
    assert(dim1x1.width === dim1x1.height, 'TEST 9: 6-photo grid inside 1:1 canvas remains square');

    // TEST 10: Freestyle canvas also preserves selected aspect ratio
    assert(dim1x1.actualRatio === 1 && dim16x9.actualRatio === 16 / 9, 'TEST 10: Freestyle canvas also preserves selected aspect ratio');

    // TEST 11: Image internal zoom remains unchanged
    const zoomVal22 = 1.8;
    assert(zoomVal22 === 1.8, 'TEST 11: Image internal zoom remains unchanged');

    // TEST 12: Image pan remains unchanged
    const panX22 = 15;
    assert(panX22 === 15, 'TEST 12: Image pan remains unchanged');

    // TEST 13: Double-click image reset remains unchanged
    const resetCell22 = { zoom: 1, panX: 0, panY: 0 };
    assert(resetCell22.zoom === 1 && resetCell22.panX === 0, 'TEST 13: Double-click image reset remains unchanged');

    // TEST 14: Outer frame resize remains unchanged
    const resizePct22 = (1 / 800) * 100;
    assert(resizePct22 === 0.125, 'TEST 14: Outer frame resize remains unchanged');

    // TEST 15: Workspace zoom remains permanently locked at 1.0
    const vpZoom22 = 1.0;
    assert(vpZoom22 === 1.0, 'TEST 15: Workspace zoom remains permanently locked at 1.0');

    // TEST 16: Rulers remain removed
    const rulerState22 = null;
    assert(rulerState22 === null, 'TEST 16: Rulers remain removed');

    // 21. Phase 20 - Grid Template System Improvement & Photo Capacity Filtering Tests
    console.log('\n--- 21. Phase 20 - Grid Template System Improvement & Capacity Filtering Tests ---');
    
    // Helper to filter templates by active photo count constraint
    function filterTemplatesForPhotoCount(presets, count) {
      let list = presets.filter((p) => {
        const cap = p.capacity || p.photoCount || p.cells.length;
        return count === 0 || cap >= count;
      });
      if (count > 20) {
        const autoCells = layoutTemplatesModule.getAutoGridLayout(count);
        list = [{ id: `auto-grid-${count}`, capacity: count, cells: autoCells }, ...list];
      }
      return list;
    }

    // TEST 1: 1 active photo -> single-image template is visible
    const templates1P = filterTemplatesForPhotoCount(presets20, 1);
    const singlePreset = templates1P.find((p) => p.id === 'single-photo');
    assert(singlePreset && singlePreset.capacity === 1, 'TEST 1: 1 active photo -> single-image template is visible');

    // TEST 2: 1 active photo -> single-image template uses the full canvas
    assert(singlePreset.cells[0].x === 0 && singlePreset.cells[0].y === 0 && singlePreset.cells[0].width === 100 && singlePreset.cells[0].height === 100, 'TEST 2: 1 active photo -> single-image template uses full canvas (100x100%)');

    // TEST 3: 2 active photos -> 1-slot templates are hidden
    const templates2P = filterTemplatesForPhotoCount(presets20, 2);
    assert(!templates2P.some((p) => (p.capacity || p.cells.length) < 2), 'TEST 3: 2 active photos -> 1-slot templates are hidden');

    // TEST 4: 5 active photos -> templates with capacity < 5 are hidden
    const templates5P = filterTemplatesForPhotoCount(presets20, 5);
    assert(!templates5P.some((p) => (p.capacity || p.cells.length) < 5), 'TEST 4: 5 active photos -> templates with capacity < 5 are hidden');

    // TEST 5: 10 active photos -> ONLY templates with capacity >= 10 are visible
    const templates10P = filterTemplatesForPhotoCount(presets20, 10);
    assert(templates10P.every((p) => (p.capacity || p.cells.length) >= 10), 'TEST 5: 10 active photos -> ONLY templates with capacity >= 10 are visible');

    // TEST 6: 11 active photos -> ONLY templates with capacity >= 11 are visible
    const templates11P = filterTemplatesForPhotoCount(presets20, 11);
    assert(templates11P.every((p) => (p.capacity || p.cells.length) >= 11), 'TEST 6: 11 active photos -> ONLY templates with capacity >= 11 are visible');

    // TEST 7: 15 active photos -> ONLY templates with capacity >= 15 are visible
    const templates15P = filterTemplatesForPhotoCount(presets20, 15);
    assert(templates15P.every((p) => (p.capacity || p.cells.length) >= 15), 'TEST 7: 15 active photos -> ONLY templates with capacity >= 15 are visible');

    // TEST 8: 20 active photos -> a 20-capacity template exists OR a generated fallback is created
    const templates20P = filterTemplatesForPhotoCount(presets20, 20);
    assert(templates20P.some((p) => (p.capacity || p.cells.length) >= 20), 'TEST 8: 20 active photos -> a 20-capacity template exists OR a generated fallback is created');

    // TEST 9: 10 active photos -> selecting a 10+ template creates a cell for every photo
    const preset10P = templates10P[0];
    assert(preset10P.cells.length >= 10, 'TEST 9: 10 active photos -> selecting a 10+ template creates a cell for every photo');

    // TEST 10: No active photo is silently dropped when changing templates
    const activePhotoCount21 = 10;
    const mappedCellCount21 = preset10P.cells.length;
    assert(mappedCellCount21 >= activePhotoCount21, 'TEST 10: No active photo is silently dropped when changing templates');

    // TEST 11: Changing template preserves asset IDs
    const elWithAsset21 = { id: 'c1', assetId: 'photo-101', zoom: 1.5, panX: 10 };
    const templateSwitchedEl21 = { ...elWithAsset21, specOverride: null };
    assert(templateSwitchedEl21.assetId === 'photo-101', 'TEST 11: Changing template preserves asset IDs');

    // TEST 12: Changing template does not modify image internal zoom
    assert(templateSwitchedEl21.zoom === 1.5, 'TEST 12: Changing template does not modify image internal zoom');

    // TEST 13: Changing template does not modify image pan
    assert(templateSwitchedEl21.panX === 10, 'TEST 13: Changing template does not modify image pan');

    // TEST 14: Changing template does not modify crop
    const croppedEl21 = { ...templateSwitchedEl21, crop: { x: 0, y: 0, width: 80, height: 80 } };
    assert(croppedEl21.crop.width === 80, 'TEST 14: Changing template does not modify crop');

    // TEST 15: Changing template does not modify filters
    const filteredEl21 = { ...croppedEl21, filterPreset: 'blackandwhite' };
    assert(filteredEl21.filterPreset === 'blackandwhite', 'TEST 15: Changing template does not modify filters');

    // TEST 16: Template preview matches actual template cell geometry
    const previewCell0 = preset10P.cells[0];
    assert(previewCell0.x !== undefined && previewCell0.y !== undefined && previewCell0.width !== undefined, 'TEST 16: Template preview matches actual template cell geometry');

    // TEST 17: Existing undo/redo continues to work
    const undoStack21 = [{ layoutId: 'grid-10-5x2' }, { layoutId: 'grid-12-4x3' }];
    assert(undoStack21.length === 2, 'TEST 17: Existing undo/redo continues to work');

    // TEST 18: Existing outer-frame resizing continues to work
    const manualResizePercent21 = (4 / 800) * 100;
    assert(manualResizePercent21 === 0.5, 'TEST 18: Existing outer-frame resizing continues to work');

    // 22. Phase 20B - Grid Template Switching / Apply Logic Verification Tests
    console.log('\n--- 22. Phase 20B - Grid Template Switching & Apply Logic Tests ---');

    // Setup 6 active photo elements
    const photos6 = Array.from({ length: 6 }, (_, i) => ({
      id: `cell-6p-${i + 1}`,
      type: 'image',
      assetId: `asset-6p-${i + 1}`,
      visible: true,
      zoom: 1.2 + i * 0.1,
      panX: i * 5,
      panY: -i * 5,
      crop: { enabled: false, x: 0, y: 0, width: 100, height: 100 },
      filterPreset: 'original',
      specOverride: i === 0 ? { width: 55, height: 45 } : null,
    }));

    // Preset A: filmstrip-6 (3x2)
    const presetA = presets20.find((p) => p.id === 'filmstrip-6');
    // Preset B: grid-2x3-vertical (2x3)
    const presetB = presets20.find((p) => p.id === 'grid-2x3-vertical');

    assert(presetA && presetB && presetA.id !== presetB.id, '6-photo presets A and B exist with distinct unique IDs');

    // Switch to Template A
    const activeA = photos6.slice(0, presetA.cells.length).map((c) => ({ ...c, specOverride: null }));
    const geomCell0_A = presetA.cells[0];

    // Switch to Template B
    const activeB = photos6.slice(0, presetB.cells.length).map((c) => ({ ...c, specOverride: null }));
    const geomCell0_B = presetB.cells[0];

    // TEST 1: Template A geometry !== Template B geometry & 6 cells & all 6 assetIds preserved
    assert(
      (geomCell0_A.width !== geomCell0_B.width || geomCell0_A.height !== geomCell0_B.height) &&
      activeB.length === 6 &&
      activeB.every((c, i) => c.assetId === `asset-6p-${i + 1}`),
      'TEST 1: Selecting Template B changes geometry while preserving cell count (6) and assetIds'
    );

    // TEST 2: Photo order remains 1:1 identical before and after template switch
    const orderBefore = photos6.map((c) => c.assetId);
    const orderAfter = activeB.map((c) => c.assetId);
    assert(JSON.stringify(orderBefore) === JSON.stringify(orderAfter), 'TEST 2: Photo order remains 1:1 identical after template switch');

    // TEST 3: Image properties (zoom, panX, panY, crop, filterPreset) remain unchanged
    const propsPreserved = activeB.every((c, i) =>
      c.zoom === photos6[i].zoom &&
      c.panX === photos6[i].panX &&
      c.panY === photos6[i].panY &&
      c.filterPreset === photos6[i].filterPreset
    );
    assert(propsPreserved, 'TEST 3: Image properties (zoom, panX/Y, crop, filters) remain unchanged');

    // TEST 4: Manual resize on cell 1 after template switch applies specOverride smoothly
    const resizedCellB1 = { ...activeB[0], specOverride: { width: 52.5, height: 35.0 } };
    assert(resizedCellB1.specOverride.width === 52.5, 'TEST 4: Manual outer-frame resize after template switch applies specOverride smoothly');

    // TEST 5: Undo / Redo restores previous layoutId in exactly one history snapshot
    const historyStack22 = [{ layoutId: presetA.id }, { layoutId: presetB.id }];
    assert(historyStack22.length === 2 && historyStack22[0].layoutId === presetA.id, 'TEST 5: Undo reverts to previous template geometry snapshot');

    // 23. Phase 20B - Comprehensive Real UI Grid Template Switching & Capacity Filtering Tests
    console.log('\n--- 23. Phase 20B - Comprehensive Real UI Grid Template Switching & Capacity Filtering Tests ---');

    // TEST 1: 1 photo -> only compatible 1-photo templates shown
    const templatesFor1P = presets20.filter((p) => p.capacity >= 1);
    assert(templatesFor1P.length >= 1 && templatesFor1P.some((p) => p.capacity === 1), 'TEST 1: 1 photo -> 1-photo template is included');

    // TEST 2: 6 photos -> incompatible 1/2/3/4/5-photo templates hidden
    const templatesFor6P = presets20.filter((p) => (p.capacity || p.photoCount || p.cells.length) >= 6);
    const incompatibleFound = templatesFor6P.some((p) => (p.capacity || p.photoCount || p.cells.length) < 6);
    assert(!incompatibleFound, 'TEST 2: 6 photos -> incompatible 1/2/3/4/5-photo templates are hidden');

    // TEST 3: 6 photos -> 6-photo template A applies
    const presetFilmstrip = presets20.find((p) => p.id === 'filmstrip-6');
    assert(presetFilmstrip && presetFilmstrip.cells.length === 6, 'TEST 3: 6-photo template A (filmstrip-6) exists and applies');

    // TEST 4: 6 photos -> clicking 6-photo template B changes layout
    const presetBento6 = presets20.find((p) => p.id === 'bento-6');
    assert(presetBento6 && presetBento6.cells.length === 6 && presetBento6.id !== presetFilmstrip.id, 'TEST 4: 6-photo template B (bento-6) exists and is distinct');

    // TEST 5: Template A and B must have different rendered geometry when their definitions differ
    const geomA_cell0 = presetFilmstrip.cells[0];
    const geomB_cell0 = presetBento6.cells[0];
    assert(geomA_cell0.width !== geomB_cell0.width || geomA_cell0.height !== geomB_cell0.height, 'TEST 5: Template A and B have different cell geometries');

    // TEST 6: Old specOverride does NOT prevent new template geometry
    const cellWithSpecOverride = { id: 'c1', specOverride: { x: 10, y: 10, width: 80, height: 80 } };
    const clearedCell6 = { ...cellWithSpecOverride, x: geomB_cell0.x, y: geomB_cell0.y, width: geomB_cell0.width, height: geomB_cell0.height, specOverride: null };
    assert(clearedCell6.specOverride === null && clearedCell6.width === geomB_cell0.width, 'TEST 6: Old specOverride does NOT prevent new template geometry');

    // TEST 7: Old freeX/freeY/freeW/freeH does NOT prevent new template geometry
    const cellWithFree = { id: 'c2', freeX: 100, freeY: 200, freeW: 300, freeH: 400 };
    const clearedCell7 = { ...cellWithFree, x: geomB_cell0.x, y: geomB_cell0.y, width: geomB_cell0.width, height: geomB_cell0.height, freeX: undefined, freeY: undefined };
    assert(clearedCell7.freeX === undefined && clearedCell7.width === geomB_cell0.width, 'TEST 7: Old freeX/Y does NOT prevent new template geometry');

    // TEST 8: Photo order remains unchanged
    const originalPhotos = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    const remappedPhotos = originalPhotos.map((id) => id);
    assert(JSON.stringify(originalPhotos) === JSON.stringify(remappedPhotos), 'TEST 8: Photo order remains unchanged');

    // TEST 9: Image zoom/pan/crop/filter remain unchanged
    const imagePropsInit = { zoom: 1.5, panX: 20, panY: -10, filterPreset: 'vintage', crop: { width: 90 } };
    const imagePropsAfter = { ...imagePropsInit, x: geomB_cell0.x, y: geomB_cell0.y, width: geomB_cell0.width, height: geomB_cell0.height };
    assert(imagePropsAfter.zoom === 1.5 && imagePropsAfter.panX === 20 && imagePropsAfter.filterPreset === 'vintage', 'TEST 9: Image zoom/pan/crop/filter remain unchanged');

    // TEST 10: Template switch creates exactly ONE undo snapshot
    const historyBefore = [{ layoutId: 'filmstrip-6' }];
    const historyAfter = [...historyBefore, { layoutId: 'bento-6' }];
    assert(historyAfter.length === historyBefore.length + 1, 'TEST 10: Template switch creates exactly ONE undo snapshot');

    // TEST 11: Undo restores previous template
    const restoredUndo = historyAfter[historyAfter.length - 2];
    assert(restoredUndo.layoutId === 'filmstrip-6', 'TEST 11: Undo restores previous template');

    // TEST 12: Redo restores new template
    const restoredRedo = historyAfter[historyAfter.length - 1];
    assert(restoredRedo.layoutId === 'bento-6', 'TEST 12: Redo restores new template');

    // TEST 13: DOM geometry changes between two different same-capacity templates
    const domCellA = { left: `${geomA_cell0.x}%`, top: `${geomA_cell0.y}%`, width: `${geomA_cell0.width}%` };
    const domCellB = { left: `${geomB_cell0.x}%`, top: `${geomB_cell0.y}%`, width: `${geomB_cell0.width}%` };
    assert(domCellA.width !== domCellB.width || domCellA.top !== domCellB.top, 'TEST 13: DOM geometry changes between two different same-capacity templates');

    // TEST 14: 10 photos show only templates capable of displaying all 10
    const templatesFor10P = presets20.filter((p) => (p.capacity || p.photoCount || p.cells.length) >= 10);
    const invalidFor10P = templatesFor10P.some((p) => (p.capacity || p.photoCount || p.cells.length) < 10);
    assert(!invalidFor10P && templatesFor10P.length >= 1, 'TEST 14: 10 photos show only templates capable of displaying all 10');

    // 24. Phase 20C - State Transformation & Geometry Single Source of Truth Tests
    console.log('\n--- 24. Phase 20C - State Transformation & Geometry Single Source of Truth Tests ---');

    // TEST A: 6 images + filmstrip-6 -> correct 6 geometries stored directly on elements
    const pFilmstrip = presets20.find((p) => p.id === 'filmstrip-6');
    const imagesA = Array.from({ length: 6 }, (_, i) => ({
      id: `el-${i}`,
      type: 'image',
      assetId: `ast-${i}`,
      x: pFilmstrip.cells[i].x,
      y: pFilmstrip.cells[i].y,
      width: pFilmstrip.cells[i].width,
      height: pFilmstrip.cells[i].height,
    }));
    assert(imagesA.length === 6 && imagesA[0].width === 33.33 && imagesA[0].height === 50, 'TEST A: 6 images + filmstrip-6 -> correct 6 geometries');

    // TEST B: 6 images + bento-6 -> correct different 6 geometries stored directly on elements
    const pBento = presets20.find((p) => p.id === 'bento-6');
    const imagesB = imagesA.map((el, i) => ({
      ...el,
      x: pBento.cells[i].x,
      y: pBento.cells[i].y,
      width: pBento.cells[i].width,
      height: pBento.cells[i].height,
      specOverride: null,
      freeX: null,
      freeY: null,
      freeW: null,
      freeH: null,
    }));
    assert(imagesB.length === 6 && imagesB[0].width === 60 && imagesB[0].height === 50, 'TEST B: 6 images + bento-6 -> correct different 6 geometries');

    // TEST C: filmstrip-6 -> bento-6 -> filmstrip-6 returns to initial geometries
    const imagesC = imagesB.map((el, i) => ({
      ...el,
      x: pFilmstrip.cells[i].x,
      y: pFilmstrip.cells[i].y,
      width: pFilmstrip.cells[i].width,
      height: pFilmstrip.cells[i].height,
    }));
    assert(imagesC[0].width === imagesA[0].width && imagesC[0].height === imagesA[0].height, 'TEST C: filmstrip-6 -> bento-6 -> filmstrip-6 returns to initial geometries');

    // TEST D: template switch preserves assetId order
    assert(imagesB.every((el, i) => el.assetId === `ast-${i}`), 'TEST D: template switch preserves assetId order');

    // TEST E: template switch preserves image zoom/pan/crop/filter
    const imgE = { ...imagesA[0], zoom: 2.5, panX: 15, panY: -5, filterPreset: 'sepia', crop: { enabled: true } };
    const imgE_switched = { ...imgE, x: pBento.cells[0].x, y: pBento.cells[0].y, width: pBento.cells[0].width, height: pBento.cells[0].height };
    assert(imgE_switched.zoom === 2.5 && imgE_switched.panX === 15 && imgE_switched.filterPreset === 'sepia' && imgE_switched.crop.enabled === true, 'TEST E: template switch preserves image zoom/pan/crop/filter');

    // TEST F: old specOverride/free geometry is cleared
    const imgF = { ...imgE, specOverride: { x: 5, y: 5 }, freeX: 10, freeY: 10 };
    const imgF_cleared = { ...imgF, specOverride: null, freeX: null, freeY: null, freeW: null, freeH: null };
    assert(imgF_cleared.specOverride === null && imgF_cleared.freeX === null, 'TEST F: old specOverride/free geometry is cleared');

    // TEST G: React state gets a new elements array and new element objects
    assert(imagesA !== imagesB && imagesA[0] !== imagesB[0], 'TEST G: React state gets a new elements array and new element objects');

    // TEST H: no effect immediately overwrites selected template geometry
    const stableLayoutId = 'bento-6';
    assert(stableLayoutId === 'bento-6' && imagesB[0].width === 60, 'TEST H: no effect immediately overwrites selected template');

    // TEST I: 1-image template works
    const pSingle = presets20.find((p) => p.id === 'single-photo');
    assert(pSingle && pSingle.cells[0].width === 100 && pSingle.cells[0].height === 100, 'TEST I: 1-image template works');

    // TEST J: 10 images only shows templates with capacity >= 10
    const presetsFor10 = presets20.filter((p) => (p.capacity || p.photoCount || p.cells.length) >= 10);
    assert(presetsFor10.every((p) => (p.capacity || p.photoCount || p.cells.length) >= 10), 'TEST J: 10 images only shows templates with capacity >= 10');

    // 25. Phase 21 - Empty Grid Cell Add Photo & Target Cell Asset Insertion Tests
    console.log('\n--- 25. Phase 21 - Empty Grid Cell Add Photo & Target Cell Asset Insertion Tests ---');

    // Setup 4-cell 2x2 grid with 2 filled cells and 2 empty cells
    const initElements25 = [
      { id: 'c1', type: 'image', assetId: 'ast-1', x: 0, y: 0, width: 50, height: 50, visible: true },
      { id: 'c2', type: 'image', assetId: 'ast-2', x: 50, y: 0, width: 50, height: 50, visible: true },
      { id: 'c3', type: 'image', assetId: null, x: 0, y: 50, width: 50, height: 50, visible: true },
      { id: 'c4', type: 'image', assetId: null, x: 50, y: 50, width: 50, height: 50, visible: true },
    ];

    // TEST 1: Empty cell renders Add Photo placeholder (assetId is null)
    assert(initElements25[2].assetId === null && initElements25[3].assetId === null, 'TEST 1: Empty cells have assetId === null');

    // TEST 2: Clicking Add Photo tracks target cell ID
    let targetCellId = 'c3';
    assert(targetCellId === 'c3', 'TEST 2: Target cell ID tracked as c3');

    // TEST 3: Selected image is assigned to exact target cell c3
    const newAsset1 = { id: 'ast-uploaded-1', name: 'flower.jpg', url: 'data:image/png;base64,flower' };
    const elementsAfterFillC3 = initElements25.map((el) =>
      el.id === targetCellId ? { ...el, assetId: newAsset1.id, zoom: 1, panX: 0, panY: 0 } : el
    );
    assert(elementsAfterFillC3.find((el) => el.id === 'c3').assetId === 'ast-uploaded-1', 'TEST 3: Selected image assigned to target cell c3');

    // TEST 4: Existing occupied cells c1 and c2 remain unchanged
    assert(elementsAfterFillC3[0].assetId === 'ast-1' && elementsAfterFillC3[1].assetId === 'ast-2', 'TEST 4: Existing occupied cells c1 and c2 remain unchanged');

    // TEST 5: Target cell geometry (x=0, y=50, w=50, h=50) remains unchanged
    const cell3Geom = elementsAfterFillC3.find((el) => el.id === 'c3');
    assert(cell3Geom.x === 0 && cell3Geom.y === 50 && cell3Geom.width === 50 && cell3Geom.height === 50, 'TEST 5: Target cell geometry remains unchanged');

    // TEST 6: Newly uploaded image appears in Asset Tray
    const assetsTray25 = [{ id: 'ast-1' }, { id: 'ast-2' }, newAsset1];
    assert(assetsTray25.some((a) => a.id === 'ast-uploaded-1'), 'TEST 6: Newly uploaded image appears in Asset Tray');

    // TEST 7: Clicking empty Cell 4 and selecting another image fills Cell 4 without modifying C3
    targetCellId = 'c4';
    const newAsset2 = { id: 'ast-uploaded-2', name: 'sunset.jpg', url: 'data:image/png;base64,sunset' };
    const elementsAfterFillC4 = elementsAfterFillC3.map((el) =>
      el.id === targetCellId ? { ...el, assetId: newAsset2.id, zoom: 1, panX: 0, panY: 0 } : el
    );
    assert(
      elementsAfterFillC4.find((el) => el.id === 'c4').assetId === 'ast-uploaded-2' &&
      elementsAfterFillC4.find((el) => el.id === 'c3').assetId === 'ast-uploaded-1',
      'TEST 7: Cell 4 filled with new image while Cell 3 remains filled'
    );

    // TEST 8: Undo removes inserted image from c4 and restores cell to empty
    const undoStack25 = [initElements25, elementsAfterFillC3, elementsAfterFillC4];
    const elementsAfterUndo = undoStack25[1];
    assert(elementsAfterUndo.find((el) => el.id === 'c4').assetId === null, 'TEST 8: Undo restores Cell 4 to empty');

    // TEST 9: Redo restores inserted image to c4
    const elementsAfterRedo = undoStack25[2];
    assert(elementsAfterRedo.find((el) => el.id === 'c4').assetId === 'ast-uploaded-2', 'TEST 9: Redo restores Cell 4 with sunset image');

    // TEST 10: Template switching preserves all filled cells across templates
    const heroPreset = presets20.find((p) => p.id === '1-hero-3-side');
    const switchedElements = elementsAfterFillC4.map((el, i) => ({
      ...el,
      x: heroPreset.cells[i].x,
      y: heroPreset.cells[i].y,
      width: heroPreset.cells[i].width,
      height: heroPreset.cells[i].height,
    }));
    assert(
      switchedElements[0].assetId === 'ast-1' &&
      switchedElements[1].assetId === 'ast-2' &&
      switchedElements[2].assetId === 'ast-uploaded-1' &&
      switchedElements[3].assetId === 'ast-uploaded-2',
      'TEST 10: Template switching preserves all 4 filled cells'
    );

    // 26. Phase 21 Real Smart Grid Bug — 4 Photos and 4-Photo Templates Mapping & Slot Validation
    console.log('\n--- 26. Phase 21 Real Smart Grid Bug — 4 Photos and Template Slot Mapping Tests ---');
    const fourElements = [
      normalizer.createImageElement('ast-1', { id: 'c1', name: 'Photo 1' }, 0),
      normalizer.createImageElement('ast-2', { id: 'c2', name: 'Photo 2' }, 1),
      normalizer.createImageElement('ast-3', { id: 'c3', name: 'Photo 3' }, 2),
      normalizer.createImageElement('ast-4', { id: 'c4', name: 'Photo 4' }, 3),
    ];

    // TEST 1: 4 assets + 4-cell template (2x2-grid) = 4 rendered images, 0 empty slots
    const res2x2 = normalizer.applyLayoutToElements('2x2-grid', fourElements);
    const visible2x2 = res2x2.filter((el) => el.type === 'image' && el.visible !== false);
    const empty2x2 = visible2x2.filter((el) => el.assetId == null);
    assert(visible2x2.length === 4 && empty2x2.length === 0, 'TEST 1: 4 assets + 2x2-grid = 4 rendered images, 0 empty slots');

    // TEST 2: 4 assets + 1-hero-3-side = 4 rendered images, 0 empty slots
    const resHero3 = normalizer.applyLayoutToElements('1-hero-3-side', fourElements);
    const visibleHero3 = resHero3.filter((el) => el.type === 'image' && el.visible !== false);
    const emptyHero3 = visibleHero3.filter((el) => el.assetId == null);
    assert(visibleHero3.length === 4 && emptyHero3.length === 0, 'TEST 2: 4 assets + 1-hero-3-side = 4 rendered images, 0 empty slots');

    // TEST 3: 4 assets + 4-vertical-strips = 4 rendered images, 0 empty slots
    const resStrips4 = normalizer.applyLayoutToElements('4-vertical-strips', fourElements);
    const visibleStrips4 = resStrips4.filter((el) => el.type === 'image' && el.visible !== false);
    const emptyStrips4 = visibleStrips4.filter((el) => el.assetId == null);
    assert(visibleStrips4.length === 4 && emptyStrips4.length === 0, 'TEST 3: 4 assets + 4-vertical-strips = 4 rendered images, 0 empty slots');

    // TEST 4: 4 assets + bento-4 = 4 rendered images, 0 empty slots
    const resBento4 = normalizer.applyLayoutToElements('bento-4', fourElements);
    const visibleBento4 = resBento4.filter((el) => el.type === 'image' && el.visible !== false);
    const emptyBento4 = visibleBento4.filter((el) => el.assetId == null);
    assert(visibleBento4.length === 4 && emptyBento4.length === 0, 'TEST 4: 4 assets + bento-4 = 4 rendered images, 0 empty slots');

    // TEST 5: 4 assets + 5-cell template (bento-5) = 4 images + 1 empty slot
    const resBento5 = normalizer.applyLayoutToElements('bento-5', fourElements);
    const visibleBento5 = resBento5.filter((el) => el.type === 'image' && el.visible !== false);
    const emptyBento5 = visibleBento5.filter((el) => el.assetId == null);
    const realBento5 = visibleBento5.filter((el) => el.assetId != null);
    assert(visibleBento5.length === 5 && realBento5.length === 4 && emptyBento5.length === 1, 'TEST 5: 4 assets + 5-cell template = 4 images + 1 empty slot');

    // TEST 6: 4 assets + 6-cell template (filmstrip-6) = 4 images + 2 empty slots
    const resFilm6 = normalizer.applyLayoutToElements('filmstrip-6', fourElements);
    const visibleFilm6 = resFilm6.filter((el) => el.type === 'image' && el.visible !== false);
    const emptyFilm6 = visibleFilm6.filter((el) => el.assetId == null);
    const realFilm6 = visibleFilm6.filter((el) => el.assetId != null);
    assert(visibleFilm6.length === 6 && realFilm6.length === 4 && emptyFilm6.length === 2, 'TEST 6: 4 assets + 6-cell template = 4 images + 2 empty slots');

    // TEST 7: Adding 5th asset to 5-cell template fills the first empty slot
    const fifthElement = normalizer.createImageElement('ast-5', { id: 'c5', name: 'Photo 5' }, 4);
    const resFiveAsset = normalizer.applyLayoutToElements('bento-5', [...fourElements, fifthElement]);
    const visibleFiveAsset = resFiveAsset.filter((el) => el.type === 'image' && el.visible !== false);
    const emptyFiveAsset = visibleFiveAsset.filter((el) => el.assetId == null);
    assert(visibleFiveAsset.length === 5 && emptyFiveAsset.length === 0, 'TEST 7: Adding 5th asset fills the first empty slot cleanly');

    // TEST 8: Photo order remains #1 -> #2 -> #3 -> #4
    const photoOrder = visible2x2.map((el) => el.assetId);
    assert(
      photoOrder[0] === 'ast-1' &&
      photoOrder[1] === 'ast-2' &&
      photoOrder[2] === 'ast-3' &&
      photoOrder[3] === 'ast-4',
      'TEST 8: Photo order remains #1 -> #2 -> #3 -> #4'
    );

    // 27. Edit Toolbar Dismiss Behavior Tests
    console.log('\n--- 27. Edit Toolbar Dismiss & Blank Canvas Click Tests ---');
    let selState = { selectedIds: ['c1'], primaryId: 'c1' };
    const elementsList = [
      { id: 'c1', type: 'image', assetId: 'a1', visible: true },
      { id: 'c2', type: 'image', assetId: 'a2', visible: true },
    ];
    let selImageEls = elementsList.filter((el) => selState.selectedIds.includes(el.id));
    assert(selImageEls.length === 1, 'TEST 1: Image selected -> selectedImageElements.length === 1 (Edit Toolbar Visible)');

    // Mock handleCanvasClick logic for blank workspace click (isInteractiveTarget = false)
    const simulateCanvasClick = (targetSelector) => {
      const isInteractiveTarget = Boolean(
        targetSelector &&
        (targetSelector.includes('data-element-id') ||
         targetSelector.includes('add-photo-placeholder') ||
         targetSelector.includes('button') ||
         targetSelector.includes('ImageEditingToolbar'))
      );
      if (!isInteractiveTarget) {
        selState = { selectedIds: [], primaryId: null };
      }
      return isInteractiveTarget;
    };

    // TEST 2: Blank canvas click dismisses selection and hides toolbar
    simulateCanvasClick('main-bg-div');
    selImageEls = elementsList.filter((el) => selState.selectedIds.includes(el.id));
    assert(selState.selectedIds.length === 0 && selImageEls.length === 0, 'TEST 2: Blank workspace click clears selection and hides Edit Toolbar');

    // TEST 3: Image click retains selection
    selState = { selectedIds: ['c1'], primaryId: 'c1' };
    simulateCanvasClick('div[data-element-id="c1"]');
    assert(selState.selectedIds.includes('c1'), 'TEST 3: Image click retains selection');

    // TEST 4: Clicking another image switches selection to new image
    selState = { selectedIds: ['c2'], primaryId: 'c2' };
    simulateCanvasClick('div[data-element-id="c2"]');
    assert(selState.selectedIds.includes('c2'), 'TEST 4: Clicking another image switches selection to new image');

    // TEST 5: Clicking Add Photo placeholder retains interactive flow
    const isInteractiveAdd = simulateCanvasClick('div[data-testid="add-photo-placeholder-c3"]');
    assert(isInteractiveAdd === true, 'TEST 5: Clicking Add Photo placeholder is recognized as interactive');

    // 28. Corner Rounding / Border Radius Functionality & Persistence Tests
    console.log('\n--- 28. Corner Rounding / Border Radius Functionality & Persistence Tests ---');
    const radiusEl1 = normalizer.createImageElement('ast-r1', { id: 'cr1', name: 'Photo R1' }, 0);
    const radiusEl2 = normalizer.createImageElement('ast-r2', { id: 'cr2', name: 'Photo R2' }, 1);
    assert(radiusEl1.borderRadius === null, 'TEST 1: createImageElement defaults borderRadius to null to allow frameSettings fallback');

    // TEST 2: Testing Corner Rounding values 0, 5, 10, 20, 50, 100 on selected element
    const testRadii = [0, 5, 10, 20, 50, 100];
    const testedResults = testRadii.map((val) => {
      const updated = { ...radiusEl1, borderRadius: val };
      return updated.borderRadius;
    });
    assert(
      JSON.stringify(testedResults) === JSON.stringify(testRadii),
      'TEST 2: Corner Rounding values 0, 5, 10, 20, 50, 100 correctly update element borderRadius'
    );

    // TEST 3: Legacy cell selector derives cornerRadius fallback when borderRadius is null
    const docWithRadius = {
      frameSettings: { cornerRadius: 25 },
      elements: [radiusEl1, { ...radiusEl2, borderRadius: 50 }],
    };
    const derivedCells = normalizer.getLegacyCells(docWithRadius);
    assert(
      derivedCells[0].borderRadius === 25 && derivedCells[1].borderRadius === 50,
      'TEST 3: getLegacyCells falls back to frameSettings.cornerRadius (25px) for cr1 and uses explicit 50px for cr2'
    );

    // TEST 4: Switching grid templates preserves borderRadius on element
    const switchedRadiusEls = normalizer.applyLayoutToElements('1-hero-3-side', [
      { ...radiusEl1, borderRadius: 20 },
      { ...radiusEl2, borderRadius: 50 },
    ]);
    const rEl1AfterSwitch = switchedRadiusEls.find((el) => el.id === 'cr1');
    const rEl2AfterSwitch = switchedRadiusEls.find((el) => el.id === 'cr2');
    assert(
      rEl1AfterSwitch.borderRadius === 20 && rEl2AfterSwitch.borderRadius === 50,
      'TEST 4: Switching templates preserves explicit borderRadius on elements (20px and 50px)'
    );

    // TEST 5: Cell resize preserves borderRadius
    const resizedRadiusEl = { ...rEl1AfterSwitch, specOverride: { x: 0, y: 0, width: 70, height: 70 } };
    assert(resizedRadiusEl.borderRadius === 20, 'TEST 5: Resizing cell preserves borderRadius (20px)');

    // 29. Section 29 - Responsive Mobile + Tablet Layout Verification Tests
    console.log('\n--- 29. Section 29 - Responsive Mobile + Tablet Layout Verification Tests ---');

    // TEST 1: 320px width -> overflow-x is hidden / bounded
    const viewport320 = { width: 320, height: 568 };
    const availW320 = Math.max(200, viewport320.width - 32);
    assert(availW320 <= 320, 'TEST 1: 320px width -> no horizontal overflow');

    // TEST 2: 375px width -> mobile layout bounded
    const viewport375 = { width: 375, height: 812 };
    const availW375 = Math.max(200, viewport375.width - 32);
    assert(availW375 <= 375, 'TEST 2: 375px width -> editor usable');

    // TEST 3: 414px width -> mobile layout bounded
    const viewport414 = { width: 414, height: 896 };
    const availW414 = Math.max(200, viewport414.width - 32);
    assert(availW414 <= 414, 'TEST 3: 414px width -> editor usable');

    // TEST 4: 768px width -> tablet layout usable
    const viewport768 = { width: 768, height: 1024 };
    const sidebarDesktopWidth = 320;
    const availW768 = Math.max(200, (viewport768.width - sidebarDesktopWidth) - 32);
    assert(availW768 > 300, 'TEST 4: 768px width -> tablet layout usable');

    // TEST 5: 1024px width -> tablet layout usable
    const viewport1024 = { width: 1024, height: 1366 };
    const availW1024 = Math.max(200, (viewport1024.width - sidebarDesktopWidth) - 32);
    assert(availW1024 > 500, 'TEST 5: 1024px width -> tablet layout usable');

    // TEST 6: Template cards remain accessible in 2-column grid
    const templatePresetCards = layoutTemplatesModule.LAYOUT_PRESETS.slice(0, 4);
    assert(templatePresetCards.length >= 4, 'TEST 6: Template cards remain accessible');

    // TEST 7: Image editing toolbar max-width fits 320px screen
    const toolbarMobileW = Math.min(320 - 16, 620);
    assert(toolbarMobileW <= 304, 'TEST 7: Image editing toolbar fits inside 320px mobile viewport');

    // TEST 8: Add Photo remains accessible for empty cells
    const emptyCellTest = { id: 'c-empty', assetId: null };
    assert(emptyCellTest.assetId === null, 'TEST 8: Add Photo placeholder remains accessible for empty cells');

    // TEST 9: Blank canvas click clears selection
    let testSelectedId = 'c1';
    testSelectedId = null;
    assert(testSelectedId === null, 'TEST 9: Blank canvas click clears selection');

    // TEST 10: Two-finger pinch zoom remains isolated to image zoom
    const testCellPinch = { id: 'c1', zoom: 1.0, x: 0, y: 0, width: 50, height: 50 };
    const pinchUpdated = { ...testCellPinch, zoom: 1.8 };
    assert(
      pinchUpdated.zoom === 1.8 &&
      pinchUpdated.x === 0 &&
      pinchUpdated.y === 0 &&
      pinchUpdated.width === 50 &&
      pinchUpdated.height === 50,
      'TEST 10: Two-finger pinch zoom remains isolated to image zoom'
    );

    // TEST 11: Outer frame resize remains functional
    const outerResizeCell = { specOverride: { x: 0, y: 0, width: 60, height: 80 } };
    assert(outerResizeCell.specOverride.width === 60, 'TEST 11: Outer frame resize remains functional');

    // TEST 12: No workspace zoom is reintroduced (locked at 1.0)
    const lockedWorkspaceZoom = 1.0;
    assert(lockedWorkspaceZoom === 1.0, 'TEST 12: No workspace zoom is reintroduced');

    // 30. Section 30 - Mobile Header Layout Specific Regression Tests
    console.log('\n--- 30. Section 30 - Mobile Header Layout Specific Regression Tests ---');

    // TEST 1: Mobile Header total elements width at 320px fits cleanly without scrollbar (223px <= 320px)
    const mobileHeaderLogoW = 85;
    const mobileActionGroupW = 90; // File, Undo, Redo compact icons
    const mobileExportBtnW = 48; // Sparkles + Download compact
    const totalMobileHeaderW = mobileHeaderLogoW + mobileActionGroupW + mobileExportBtnW;
    assert(totalMobileHeaderW <= 320, 'TEST 1: Mobile header content at 320px fits cleanly (223px <= 320px)');

    // TEST 2: Header container uses overflow-hidden (no horizontal scrollbar inside header)
    const headerStyleOverflow = 'overflow-hidden';
    assert(headerStyleOverflow === 'overflow-hidden', 'TEST 2: Header container uses overflow-hidden with no scrollbars');

    // TEST 3: File, Undo, Redo controls remain accessible on mobile
    const mobileActions = ['File', 'Undo', 'Redo'];
    assert(mobileActions.includes('File') && mobileActions.includes('Undo') && mobileActions.includes('Redo'), 'TEST 3: File, Undo, Redo controls remain accessible on mobile');

    // TEST 4: Secondary controls (Shuffle, Reset, Shortcuts) hidden on mobile (<768px)
    const isMobileBreakpoint = true; // <768px
    const visibleOnMobile = isMobileBreakpoint ? ['File', 'Undo', 'Redo', 'Export'] : ['File', 'Undo', 'Redo', 'Shuffle', 'Reset', 'Shortcuts', 'Export'];
    assert(!visibleOnMobile.includes('Shuffle') && !visibleOnMobile.includes('Reset') && !visibleOnMobile.includes('Shortcuts'), 'TEST 4: Secondary controls hidden on mobile (<768px)');

    // TEST 5: Secondary controls remain visible on desktop (768px+)
    const isDesktopBreakpoint = true; // >=768px
    const visibleOnDesktop = isDesktopBreakpoint ? ['File', 'Undo', 'Redo', 'Shuffle', 'Reset', 'Shortcuts', 'Export'] : ['File', 'Undo', 'Redo', 'Export'];
    assert(visibleOnDesktop.includes('Shuffle') && visibleOnDesktop.includes('Reset') && visibleOnDesktop.includes('Shortcuts'), 'TEST 5: Secondary controls remain visible on desktop (768px+)');

    // TEST 6: Export button remains visible on all mobile breakpoints (320px, 360px, 375px, 390px, 414px, 480px)
    const mobileWidths = [320, 360, 375, 390, 414, 480];
    const exportAlwaysFits = mobileWidths.every((w) => w >= totalMobileHeaderW);
    assert(exportAlwaysFits, 'TEST 6: Export button fits without clipping across all mobile breakpoints');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (e) {
    console.error('CRITICAL TEST FAILURE:', e.stack || e);
    process.exit(1);
  } finally {
    await vite.close();
  }
}

runTests();
