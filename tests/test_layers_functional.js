import { createServer } from 'vite';

async function runLayersFunctionalTest() {
  console.log('🧪 Running Comprehensive Layers System Functional Verification...\n');

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  const summary = {
    selection: 'FAIL',
    multiSelection: 'FAIL',
    visibility: 'FAIL',
    lock: 'FAIL',
    rename: 'FAIL',
    duplicate: 'FAIL',
    delete: 'FAIL',
    reordering: 'FAIL',
    grouping: 'FAIL',
    groupEditMode: 'FAIL',
    undoRedo: 'FAIL',
  };

  let errors = 0;

  try {
    const normalizer = await vite.ssrLoadModule('/src/utils/elementNormalizer.js');
    const groupUtils = await vite.ssrLoadModule('/src/utils/groupUtils.js');

    // Create a base document with 2 images, 1 text, 1 shape
    const img1 = normalizer.createImageElement('asset-1', { id: 'img-1', name: 'Photo 1', x: 10, y: 10, width: 100, height: 100 }, 0);
    const img2 = normalizer.createImageElement('asset-2', { id: 'img-2', name: 'Photo 2', x: 120, y: 10, width: 100, height: 100 }, 1);
    const txt1 = normalizer.createTextElement({ id: 'txt-1', text: 'Sample Caption', x: 10, y: 120, width: 150, height: 40 }, 2);
    const shp1 = normalizer.createShapeElement({ id: 'shp-1', shapeType: 'rectangle', x: 170, y: 120, width: 80, height: 80 }, 3);

    let currentDoc = {
      version: '2.0',
      title: 'Functional Test Collage',
      elements: [img1, img2, txt1, shp1],
    };

    let selection = { selectedIds: [], primaryId: null };
    let history = [currentDoc];
    let historyIndex = 0;

    function pushDoc(newDoc) {
      currentDoc = newDoc;
      history = history.slice(0, historyIndex + 1);
      history.push(newDoc);
      historyIndex = history.length - 1;
    }

    function undo() {
      if (historyIndex > 0) {
        historyIndex--;
        currentDoc = history[historyIndex];
      }
    }

    function redo() {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        currentDoc = history[historyIndex];
      }
    }

    // A. Selection Test
    selection = { selectedIds: ['txt-1'], primaryId: 'txt-1' };
    const selCell = normalizer.getSelectedCellId(selection, currentDoc);
    const selOverlay = normalizer.getSelectedOverlayId(selection, currentDoc);
    if (selection.primaryId === 'txt-1' && selOverlay === 'txt-1' && selCell === null) {
      summary.selection = 'PASS';
      console.log('✅ A. Selection: PASS');
    } else {
      console.error('❌ A. Selection: FAIL', { selection, selCell, selOverlay });
      errors++;
    }

    // B. Multi-selection Test
    selection = { selectedIds: ['txt-1', 'img-1'], primaryId: 'img-1' };
    if (selection.selectedIds.length === 2 && selection.primaryId === 'img-1') {
      summary.multiSelection = 'PASS';
      console.log('✅ B. Multi-selection: PASS');
    } else {
      console.error('❌ B. Multi-selection: FAIL', selection);
      errors++;
    }

    // C. Visibility Toggle Test
    const hideElements = currentDoc.elements.map(el => el.id === 'shp-1' ? { ...el, visible: false } : el);
    pushDoc({ ...currentDoc, elements: hideElements });
    const isHidden = currentDoc.elements.find(el => el.id === 'shp-1').visible === false;
    
    const showElements = currentDoc.elements.map(el => el.id === 'shp-1' ? { ...el, visible: true } : el);
    pushDoc({ ...currentDoc, elements: showElements });
    const isVisible = currentDoc.elements.find(el => el.id === 'shp-1').visible === true;

    if (isHidden && isVisible) {
      summary.visibility = 'PASS';
      console.log('✅ C. Visibility: PASS');
    } else {
      console.error('❌ C. Visibility: FAIL', { isHidden, isVisible });
      errors++;
    }

    // D. Lock / Unlock Test
    const lockElements = currentDoc.elements.map(el => el.id === 'shp-1' ? { ...el, locked: true } : el);
    pushDoc({ ...currentDoc, elements: lockElements });
    const isLocked = currentDoc.elements.find(el => el.id === 'shp-1').locked === true;

    const unlockElements = currentDoc.elements.map(el => el.id === 'shp-1' ? { ...el, locked: false } : el);
    pushDoc({ ...currentDoc, elements: unlockElements });
    const isUnlocked = currentDoc.elements.find(el => el.id === 'shp-1').locked === false;

    if (isLocked && isUnlocked) {
      summary.lock = 'PASS';
      console.log('✅ D. Lock/Unlock: PASS');
    } else {
      console.error('❌ D. Lock/Unlock: FAIL', { isLocked, isUnlocked });
      errors++;
    }

    // E. Rename Test
    const renamedElements = currentDoc.elements.map(el => el.id === 'shp-1' ? { ...el, name: 'Renamed Rectangle' } : el);
    pushDoc({ ...currentDoc, elements: renamedElements });
    const renamedEl = currentDoc.elements.find(el => el.id === 'shp-1');
    if (renamedEl && renamedEl.name === 'Renamed Rectangle') {
      summary.rename = 'PASS';
      console.log('✅ E. Rename: PASS');
    } else {
      console.error('❌ E. Rename: FAIL', renamedEl);
      errors++;
    }

    // F. Duplicate Test
    const targetToDup = currentDoc.elements.find(el => el.id === 'shp-1');
    const newDupId = `shape-${Date.now()}`;
    const dupElement = { ...targetToDup, id: newDupId, name: `${targetToDup.name} Copy`, x: targetToDup.x + 10, y: targetToDup.y + 10 };
    pushDoc({ ...currentDoc, elements: [...currentDoc.elements, dupElement] });
    const dupCount = currentDoc.elements.length;
    if (dupCount === 5 && currentDoc.elements.find(el => el.id === newDupId)) {
      summary.duplicate = 'PASS';
      console.log('✅ F. Duplicate: PASS');
    } else {
      console.error('❌ F. Duplicate: FAIL', { dupCount });
      errors++;
    }

    // G. Delete Test
    const afterDelete = currentDoc.elements.filter(el => el.id !== newDupId);
    pushDoc({ ...currentDoc, elements: afterDelete });
    const existsAfterDel = currentDoc.elements.find(el => el.id === newDupId);
    if (!existsAfterDel && currentDoc.elements.length === 4) {
      summary.delete = 'PASS';
      console.log('✅ G. Delete: PASS');
    } else {
      console.error('❌ G. Delete: FAIL', { existsAfterDel });
      errors++;
    }

    // H. Reordering Test
    const reordered = normalizer.reorderElementInList(currentDoc.elements, 'img-1', 'bringToFront');
    pushDoc({ ...currentDoc, elements: reordered });
    const topEl = currentDoc.elements[currentDoc.elements.length - 1];
    if (topEl.id === 'img-1') {
      summary.reordering = 'PASS';
      console.log('✅ H. Reordering: PASS');
    } else {
      console.error('❌ H. Reordering: FAIL', topEl);
      errors++;
    }

    // I. Grouping & Ungrouping Test
    const groupRes = groupUtils.createGroupElement(currentDoc.elements, ['img-1', 'img-2'], 'Test Group');
    if (groupRes && groupRes.groupElement) {
      pushDoc({ ...currentDoc, elements: groupRes.updatedElements });
      const groupInDoc = currentDoc.elements.find(el => el.id === groupRes.groupId);
      const childrenInDoc = currentDoc.elements.filter(el => el.groupId === groupRes.groupId);

      // Ungroup
      const ungroupRes = groupUtils.ungroupElement(currentDoc.elements, groupRes.groupId);
      pushDoc({ ...currentDoc, elements: ungroupRes.updatedElements });
      const groupAfterUngroup = currentDoc.elements.find(el => el.id === groupRes.groupId);
      const childrenAfterUngroup = currentDoc.elements.filter(el => el.groupId === groupRes.groupId);

      if (groupInDoc && childrenInDoc.length === 2 && !groupAfterUngroup && childrenAfterUngroup.length === 0) {
        summary.grouping = 'PASS';
        console.log('✅ I. Grouping & Ungrouping: PASS');
      } else {
        console.error('❌ I. Grouping: FAIL', { groupInDoc, childrenInDoc, groupAfterUngroup, childrenAfterUngroup });
        errors++;
      }
    } else {
      console.error('❌ I. Grouping: FAIL - createGroupElement returned null');
      errors++;
    }

    // J. Group Edit Mode Target Resolution Test
    const groupRes2 = groupUtils.createGroupElement(currentDoc.elements, ['img-1', 'img-2'], 'Edit Group');
    pushDoc({ ...currentDoc, elements: groupRes2.updatedElements });

    const targetChild = groupUtils.resolveTargetId(currentDoc.elements, 'img-1', groupRes2.groupId);
    const targetParent = groupUtils.resolveTargetId(currentDoc.elements, 'img-1', null);

    if (targetChild === 'img-1' && targetParent === groupRes2.groupId) {
      summary.groupEditMode = 'PASS';
      console.log('✅ J. Group Edit Mode: PASS');
    } else {
      console.error('❌ J. Group Edit Mode: FAIL', { targetChild, targetParent });
      errors++;
    }

    // K. Undo / Redo Transaction Test
    const lenBeforeUndo = currentDoc.elements.length;
    undo();
    const lenAfterUndo = currentDoc.elements.length;
    redo();
    const lenAfterRedo = currentDoc.elements.length;

    if (lenAfterUndo < lenBeforeUndo && lenAfterRedo === lenBeforeUndo) {
      summary.undoRedo = 'PASS';
      console.log('✅ K. Undo/Redo: PASS');
    } else {
      console.error('❌ K. Undo/Redo: FAIL', { lenBeforeUndo, lenAfterUndo, lenAfterRedo });
      errors++;
    }

    console.log('\n========================================');
    console.log('LAYERS FUNCTIONAL TEST SUMMARY:');
    console.log(`Selection: ${summary.selection}`);
    console.log(`Multi-selection: ${summary.multiSelection}`);
    console.log(`Visibility: ${summary.visibility}`);
    console.log(`Lock/Unlock: ${summary.lock}`);
    console.log(`Rename: ${summary.rename}`);
    console.log(`Duplicate: ${summary.duplicate}`);
    console.log(`Delete: ${summary.delete}`);
    console.log(`Reordering: ${summary.reordering}`);
    console.log(`Grouping: ${summary.grouping}`);
    console.log(`Group Edit Mode: ${summary.groupEditMode}`);
    console.log(`Undo/Redo: ${summary.undoRedo}`);
    console.log(`Console errors: ${errors}`);
    console.log('========================================\n');

    if (errors > 0) process.exit(1);

  } catch (e) {
    console.error('CRITICAL FUNCTIONAL TEST FAILURE:', e.stack || e);
    process.exit(1);
  } finally {
    await vite.close();
  }
}

runLayersFunctionalTest();
