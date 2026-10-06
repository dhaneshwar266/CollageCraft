import { useState, useCallback, useRef, useEffect } from 'react';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import { LAYOUT_PRESETS, getAutoGridLayout, getDefaultLayoutForCount } from '../utils/layoutTemplates';
import {
  createImageElement,
  createTextElement,
  createStickerElement,
  createShapeElement,
  normalizeLegacyStateToDocument,
  applyLayoutToElements,
  getLegacyCells,
  getLegacyTextOverlays,
  getLegacyStickers,
  getSelectedCellId,
  getSelectedOverlayId,
} from '../utils/elementNormalizer';
import { calculateMultiMove } from '../utils/selectionGeometry';
import {
  createGroupElement,
  ungroupElement,
  duplicateGroup,
  deleteGroup,
} from '../utils/groupUtils';
import {
  alignLeft,
  alignCenterHorizontal,
  alignRight,
  alignTop,
  alignCenterVertical,
  alignBottom,
  alignToCanvas as alignToCanvasUtil,
  distributeHorizontal,
  distributeVertical,
} from '../utils/alignment';
import {
  generateProjectId,
  createProjectData,
  parseAndValidateProject,
  duplicateProjectData,
  exportProjectFile as exportProjectFileUtil,
  importProjectFile as importProjectFileUtil,
} from '../utils/projectPersistence';
import {
  saveProject,
  getProject,
  deleteProject as deleteProjectFromDb,
  listProjects,
  saveAsset,
  getAsset,
} from '../utils/indexedDbStorage';

export function useCollageState() {
  // 1. PRIMARY UNIFIED DOCUMENT STATE
  const [document, setDocument] = useState(() =>
    normalizeLegacyStateToDocument({
      assets: [],
      cells: [],
      layoutId: '2x2-grid',
      aspectRatio: '1:1',
      frameSettings: {
        padding: 0,
        gap: 0,
        cornerRadius: 0,
        borderWidth: 0,
        borderColor: '#ffffff',
        cellShadow: false,
      },
      backgroundSettings: {
        type: 'color',
        value: '#ffffff',
      },
      textOverlays: [],
      stickers: [],
    })
  );

  // 2. UNIFIED SELECTION STATE
  const [selection, setSelectionState] = useState({
    selectedIds: [],
    primaryId: null,
  });

  // 3. GROUP EDIT MODE STATE
  const [editingGroupId, setEditingGroupId] = useState(null);

  // 4. VIEWPORT STATE
  const [viewport, setViewportState] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  // 5. ASSETS COLLECTION
  const [assets, setAssets] = useState([]);

  // 6. UI DIALOG FLAGS & ACTIVE TABS
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('layouts'); // 'layouts' | 'frame' | 'background' | 'filters' | 'text'

  // 7. PROJECT PERSISTENCE & METADATA STATE
  const [projectId, setProjectId] = useState(() => generateProjectId());
  const [projectName, setProjectNameState] = useState('Untitled Collage');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);

  // 8. HISTORY STACK FOR UNDO / REDO (Document Snapshots)
  const historyRef = useRef([document]);
  const historyIndexRef = useRef(0);
  const [, forceRender] = useState({});

  /**
   * Pushes a new document snapshot onto the history stack
   */
  const pushDocument = useCallback((newDoc) => {
    setDocument(newDoc);
    setSaveStatus('unsaved');
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(newDoc);
    if (newHistory.length > 30) {
      newHistory.shift();
    }
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    forceRender({});
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevDoc = historyRef.current[historyIndexRef.current];
      setDocument(prevDoc);
      forceRender({});
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextDoc = historyRef.current[historyIndexRef.current];
      setDocument(nextDoc);
      forceRender({});
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // --- UNIFIED ELEMENT ACTION HELPERS ---

  const getElement = useCallback(
    (id) => {
      return document.elements.find((el) => el.id === id) || null;
    },
    [document]
  );

  const setSelection = useCallback((ids) => {
    const idArray = Array.isArray(ids) ? ids : ids ? [ids] : [];
    setSelectionState({
      selectedIds: idArray,
      primaryId: idArray.length > 0 ? idArray[idArray.length - 1] : null,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState({ selectedIds: [], primaryId: null });
  }, []);

  const setPrimarySelection = useCallback((id) => {
    setSelectionState({
      selectedIds: id ? [id] : [],
      primaryId: id || null,
    });
  }, []);

  const toggleSelection = useCallback(
    (id) => {
      if (!id) return;
      setSelectionState((prev) => {
        const isSelected = prev.selectedIds.includes(id);
        if (isSelected) {
          const nextSelected = prev.selectedIds.filter((i) => i !== id);
          let nextPrimary = prev.primaryId;
          if (prev.primaryId === id) {
            nextPrimary = nextSelected.length > 0 ? nextSelected[nextSelected.length - 1] : null;
          }
          return { selectedIds: nextSelected, primaryId: nextPrimary };
        } else {
          return {
            selectedIds: [...prev.selectedIds, id],
            primaryId: id,
          };
        }
      });
    },
    []
  );

  const selectAll = useCallback(() => {
    const visibleIds = document.elements
      .filter((el) => el.visible !== false)
      .map((el) => el.id);
    setSelectionState({
      selectedIds: visibleIds,
      primaryId: visibleIds.length > 0 ? visibleIds[visibleIds.length - 1] : null,
    });
  }, [document.elements]);

  const addElement = useCallback(
    (element) => {
      const newElements = [...document.elements, element];
      const newDoc = { ...document, elements: newElements };
      pushDocument(newDoc);
      setPrimarySelection(element.id);
    },
    [document, pushDocument, setPrimarySelection]
  );

  /**
   * Live update without pushing to history (used for smooth dragging)
   */
  const updateElementLive = useCallback(
    (id, patch) => {
      const newElements = document.elements.map((el) =>
        el.id === id ? { ...el, ...patch } : el
      );
      setDocument({ ...document, elements: newElements });
    },
    [document]
  );

  /**
   * Commit update and push snapshot to history (used on drag end)
   */
  const commitElementChange = useCallback(
    (id, patch) => {
      const newElements = document.elements.map((el) =>
        el.id === id ? { ...el, ...patch } : el
      );
      const newDoc = { ...document, elements: newElements };
      pushDocument(newDoc);
    },
    [document, pushDocument]
  );

  /**
   * Live update multiple elements without pushing to history
   */
  const updateMultipleElementsLive = useCallback(
    (input) => {
      if (!input) return;
      const patchMap = new Map();
      if (Array.isArray(input)) {
        if (input.length === 0) return;
        input.forEach(({ id, patch }) => {
          if (id && patch) patchMap.set(id, patch);
        });
      } else if (typeof input === 'object') {
        Object.entries(input).forEach(([id, patch]) => {
          if (id && patch) patchMap.set(id, patch);
        });
      }
      if (patchMap.size === 0) return;

      const newElements = document.elements.map((el) => {
        const patch = patchMap.get(el.id);
        return patch ? { ...el, ...patch } : el;
      });
      setDocument({ ...document, elements: newElements });
    },
    [document]
  );

  /**
   * Commit updates to multiple elements in ONE single history snapshot
   */
  const commitMultipleElementsChange = useCallback(
    (input) => {
      if (!input) return;
      const patchMap = new Map();
      if (Array.isArray(input)) {
        if (input.length === 0) return;
        input.forEach(({ id, patch }) => {
          if (id && patch) patchMap.set(id, patch);
        });
      } else if (typeof input === 'object') {
        Object.entries(input).forEach(([id, patch]) => {
          if (id && patch) patchMap.set(id, patch);
        });
      }
      if (patchMap.size === 0) return;

      const newElements = document.elements.map((el) => {
        const patch = patchMap.get(el.id);
        return patch ? { ...el, ...patch } : el;
      });
      pushDocument({ ...document, elements: newElements });
    },
    [document, pushDocument]
  );

  const deleteSelectedElements = useCallback(() => {
    if (selection.selectedIds.length === 0) return;
    const toDelete = new Set(
      document.elements
        .filter((el) => selection.selectedIds.includes(el.id) && !el.locked)
        .map((el) => el.id)
    );

    if (toDelete.size === 0) return;

    const newElements = document.elements.filter((el) => !toDelete.has(el.id));
    const newDoc = { ...document, elements: newElements };
    pushDocument(newDoc);

    const remainingSelected = selection.selectedIds.filter((id) => !toDelete.has(id));
    setSelectionState({
      selectedIds: remainingSelected,
      primaryId: remainingSelected.length > 0 ? remainingSelected[remainingSelected.length - 1] : null,
    });
  }, [document, pushDocument, selection.selectedIds]);

  const duplicateSelectedElements = useCallback(() => {
    if (selection.selectedIds.length === 0) return;
    const targets = document.elements.filter(
      (el) => selection.selectedIds.includes(el.id) && !el.locked
    );
    if (targets.length === 0) return;

    const duplicates = [];
    const newSelectedIds = [];
    const maxZ = Math.max(...document.elements.map((el) => el.zIndex ?? 0), 100);

    targets.forEach((target, idx) => {
      const dupId = `${target.type}-${Date.now()}-${idx}`;
      newSelectedIds.push(dupId);

      let offsetPatch = {};
      if (target.type === 'image') {
        if (target.specOverride) {
          offsetPatch = {
            specOverride: {
              ...target.specOverride,
              x: target.specOverride.x + 4,
              y: target.specOverride.y + 4,
            },
          };
        } else {
          offsetPatch = {
            freeX: (target.freeX ?? 10) + 4,
            freeY: (target.freeY ?? 10) + 4,
            x: (target.x ?? 10) + 4,
            y: (target.y ?? 10) + 4,
          };
        }
      } else {
        offsetPatch = {
          x: (target.x ?? 50) + 4,
          y: (target.y ?? 50) + 4,
        };
      }

      duplicates.push({
        ...target,
        ...offsetPatch,
        id: dupId,
        name: `${target.name || 'Layer'} Copy`,
        zIndex: maxZ + (idx + 1) * 10,
      });
    });

    const newElements = [...document.elements, ...duplicates];
    pushDocument({ ...document, elements: newElements });

    setSelectionState({
      selectedIds: newSelectedIds,
      primaryId: newSelectedIds[newSelectedIds.length - 1] || null,
    });
  }, [document, pushDocument, selection.selectedIds]);

  const moveSelectedElements = useCallback(
    (deltaX, deltaY) => {
      if (selection.selectedIds.length === 0) return;
      const updates = calculateMultiMove(document.elements, selection.selectedIds, deltaX, deltaY);
      if (updates.length > 0) {
        commitMultipleElementsChange(updates);
      }
    },
    [commitMultipleElementsChange, document.elements, selection.selectedIds]
  );

  const groupSelectedElements = useCallback(() => {
    if (selection.selectedIds.length < 2) return;
    const result = createGroupElement(document.elements, selection.selectedIds);
    if (!result) return;

    pushDocument({ ...document, elements: result.updatedElements });
    setSelectionState({
      selectedIds: [result.groupId],
      primaryId: result.groupId,
    });
  }, [document, pushDocument, selection.selectedIds]);

  const ungroupSelectedElement = useCallback(
    (targetId) => {
      const groupId = targetId || selection.primaryId;
      if (!groupId) return;

      const result = ungroupElement(document.elements, groupId);
      if (!result) return;

      pushDocument({ ...document, elements: result.updatedElements });
      setSelectionState({
        selectedIds: result.childIds,
        primaryId: result.childIds[0] || null,
      });
      if (editingGroupId === groupId) {
        setEditingGroupId(null);
      }
    },
    [document, editingGroupId, pushDocument, selection.primaryId]
  );

  const removeElement = useCallback(
    (id) => {
      const target = document.elements.find((el) => el.id === id);
      if (!target) return;

      let newElements;
      if (target.type === 'group') {
        newElements = deleteGroup(document.elements, id);
      } else {
        newElements = document.elements.filter((el) => el.id !== id);
      }

      pushDocument({ ...document, elements: newElements });
      if (selection.primaryId === id || selection.selectedIds.includes(id)) {
        clearSelection();
      }
    },
    [clearSelection, document, pushDocument, selection]
  );

  const duplicateElement = useCallback(
    (id) => {
      const target = document.elements.find((el) => el.id === id);
      if (!target) return;

      if (target.type === 'group') {
        const result = duplicateGroup(document.elements, id);
        if (result) {
          pushDocument({ ...document, elements: result.updatedElements });
          setSelectionState({
            selectedIds: [result.newGroupId],
            primaryId: result.newGroupId,
          });
        }
        return;
      }

      const dupId = `${target.type}-${Date.now()}`;
      const duplicate = {
        ...target,
        id: dupId,
        name: `${target.name} (Copy)`,
        x: (target.x ?? 10) + 5,
        y: (target.y ?? 10) + 5,
        zIndex: (target.zIndex ?? 100) + 1,
      };
      addElement(duplicate);
    },
    [addElement, document.elements, pushDocument]
  );

  const moveElement = useCallback(
    (id, delta) => {
      const target = document.elements.find((el) => el.id === id);
      if (!target) return;
      commitElementChange(id, {
        x: target.x + (delta.x || 0),
        y: target.y + (delta.y || 0),
      });
    },
    [commitElementChange, document.elements]
  );

  const reorderElement = useCallback(
    (id, newZIndex) => {
      commitElementChange(id, { zIndex: newZIndex });
    },
    [commitElementChange]
  );

  const toggleVisibility = useCallback(
    (id) => {
      const target = document.elements.find((el) => el.id === id);
      if (!target) return;
      commitElementChange(id, { visible: !target.visible });
    },
    [commitElementChange, document.elements]
  );

  const toggleLock = useCallback(
    (id) => {
      const target = document.elements.find((el) => el.id === id);
      if (!target) return;
      commitElementChange(id, { locked: !target.locked });
    },
    [commitElementChange, document.elements]
  );

  const renameElement = useCallback(
    (id, newName) => {
      const trimmed = (newName || '').trim();
      if (!trimmed) return;
      commitElementChange(id, { name: trimmed });
    },
    [commitElementChange]
  );

  const reorderLayer = useCallback(
    (id, action) => {
      const newElements = reorderElementInList(document.elements, id, action);
      pushDocument({
        ...document,
        elements: newElements,
      });
    },
    [document, pushDocument]
  );

  const bringForward = useCallback((id) => reorderLayer(id, 'bringForward'), [reorderLayer]);
  const sendBackward = useCallback((id) => reorderLayer(id, 'sendBackward'), [reorderLayer]);
  const bringToFront = useCallback((id) => reorderLayer(id, 'bringToFront'), [reorderLayer]);
  const sendToBack = useCallback((id) => reorderLayer(id, 'sendToBack'), [reorderLayer]);

  // --- LEGACY ACTIONS (BACKWARD COMPATIBILITY LAYER) ---

  const loadSamplePhotos = useCallback(() => {
    const samples = SAMPLE_IMAGES.slice(0, 6);
    setAssets(samples);

    const rawImageElements = samples.map((asset, index) =>
      createImageElement(asset.id, { id: `cell-sample-${index + 1}` }, index)
    );

    const nonImageElements = document.elements.filter((el) => el.type !== 'image');
    const allElements = [...rawImageElements, ...nonImageElements];
    const newElements = applyLayoutToElements('filmstrip-6', allElements);

    const newDoc = {
      ...document,
      layoutId: 'filmstrip-6',
      elements: newElements,
    };

    pushDocument(newDoc);
  }, [document, pushDocument]);

  const addAsset = useCallback(
    (newAsset) => {
      const updatedAssets = [...assets, newAsset];
      setAssets(updatedAssets);

      const existingImageCount = document.elements.filter((el) => el.type === 'image').length;
      const newCellElement = createImageElement(newAsset.id, {}, existingImageCount);

      const autoLayout = getDefaultLayoutForCount(updatedAssets.length);
      const elementsWithNew = [...document.elements, newCellElement];
      const newElements = applyLayoutToElements(autoLayout, elementsWithNew);

      const newDoc = {
        ...document,
        layoutId: autoLayout,
        elements: newElements,
      };

      pushDocument(newDoc);
    },
    [assets, document, pushDocument]
  );

  const replaceCellAsset = useCallback(
    (cellId, newAsset) => {
      const updatedAssets = [...assets.filter((a) => a.id !== newAsset.id), newAsset];
      setAssets(updatedAssets);

      const newElements = document.elements.map((el) =>
        el.id === cellId ? { ...el, assetId: newAsset.id, panX: 0, panY: 0, zoom: 1, objectFit: "contain" } : el
      );

      pushDocument({
        ...document,
        elements: newElements,
      });
    },
    [assets, document, pushDocument]
  );

  const removeAsset = useCallback(
    (assetId) => {
      const updatedAssets = assets.filter((a) => a.id !== assetId);
      setAssets(updatedAssets);

      const remainingElements = document.elements.filter(
        (el) => el.type !== 'image' || el.assetId !== assetId
      );

      const autoLayout = getDefaultLayoutForCount(updatedAssets.length);
      const newElements = applyLayoutToElements(autoLayout, remainingElements);

      pushDocument({
        ...document,
        layoutId: autoLayout,
        elements: newElements,
      });
    },
    [assets, document, pushDocument]
  );

  const swapCells = useCallback(
    (cellIdA, cellIdB) => {
      if (!cellIdA || !cellIdB || cellIdA === cellIdB) return;
      const elA = document.elements.find((el) => el.id === cellIdA);
      const elB = document.elements.find((el) => el.id === cellIdB);
      if (!elA || !elB) return;

      // Respect locking rules: if either cell/element is locked, do not allow swap
      if (elA.locked || elB.locked) return;

      const idxA = document.elements.findIndex((el) => el.id === cellIdA);
      const idxB = document.elements.findIndex((el) => el.id === cellIdB);
      if (idxA === -1 || idxB === -1) return;

      // Extract placement geometry for each cell slot
      const geomA = {
        specOverride: elA.specOverride,
        freeX: elA.freeX,
        freeY: elA.freeY,
        freeW: elA.freeW,
        freeH: elA.freeH,
        x: elA.x,
        y: elA.y,
        width: elA.width,
        height: elA.height,
        zIndex: elA.zIndex,
      };

      const geomB = {
        specOverride: elB.specOverride,
        freeX: elB.freeX,
        freeY: elB.freeY,
        freeW: elB.freeW,
        freeH: elB.freeH,
        x: elB.x,
        y: elB.y,
        width: elB.width,
        height: elB.height,
        zIndex: elB.zIndex,
      };

      // Image A gets Cell B's slot geometry; Image B gets Cell A's slot geometry.
      // All image editing properties (assetId, brightness, contrast, crop, filters, zoom, pan, rotation, flipH, flipV, opacity, blendMode) stay on their image element.
      const newElA = { ...elA, ...geomB };
      const newElB = { ...elB, ...geomA };

      const newElements = [...document.elements];
      newElements[idxA] = newElB;
      newElements[idxB] = newElA;

      pushDocument({
        ...document,
        elements: newElements,
      });

      // Maintain selection on the dragged image element
      setPrimarySelection(cellIdA);
    },
    [document, pushDocument, setPrimarySelection]
  );

  const shuffleOrder = useCallback(() => {
    const imageElements = document.elements.filter((el) => el.type === 'image');
    if (imageElements.length === 0) return;

    const shuffledAssetIds = imageElements.map((el) => el.assetId).sort(() => Math.random() - 0.5);

    const newElements = document.elements.map((el) => {
      if (el.type === 'image') {
        const idx = imageElements.indexOf(el);
        return { ...el, assetId: shuffledAssetIds[idx % shuffledAssetIds.length] };
      }
      return el;
    });

    pushDocument({
      ...document,
      elements: newElements,
    });
  }, [document, pushDocument]);

  const updateCellParams = useCallback(
    (cellId, params) => {
      updateElementLive(cellId, params);
    },
    [updateElementLive]
  );

  const commitCellParams = useCallback(
    (cellId, params) => {
      commitElementChange(cellId, params);
    },
    [commitElementChange]
  );

  const updateFrameSettings = useCallback(
    (settings) => {
      let newElements = document.elements;
      if (settings.cornerRadius !== undefined && selection?.primaryId) {
        const primaryEl = document.elements.find((el) => el.id === selection.primaryId);
        if (primaryEl && primaryEl.type === 'image') {
          newElements = document.elements.map((el) =>
            el.id === selection.primaryId ? { ...el, borderRadius: settings.cornerRadius } : el
          );
        }
      }
      pushDocument({
        ...document,
        frameSettings: { ...document.frameSettings, ...settings },
        elements: newElements,
      });
    },
    [document, pushDocument, selection.primaryId]
  );

  const updateBackgroundSettings = useCallback(
    (bgSettings) => {
      pushDocument({
        ...document,
        background: { ...document.background, ...bgSettings },
      });
    },
    [document, pushDocument]
  );

  const setLayoutId = useCallback(
    (newLayoutId) => {
      if (!newLayoutId) return;

      const imageElements = document.elements.filter((el) => el.type === 'image');

      console.log('[TEMPLATE-4-SETLAYOUT]', {
        newLayoutId,
        currentLayoutId: document.layoutId,
        activeImageCount: imageElements.length,
      });

      const newElements = applyLayoutToElements(newLayoutId, document.elements);
      const visibleCells = newElements.filter((el) => el.type === 'image' && el.visible !== false);

      console.log('[TEMPLATE-5-STATE-AFTER]', {
        layoutId: newLayoutId,
        elements: visibleCells.map((cell) => ({
          id: cell.id,
          assetId: cell.assetId,
          x: cell.x,
          y: cell.y,
          width: cell.width,
          height: cell.height,
          specOverride: cell.specOverride,
          freeX: cell.freeX,
          freeY: cell.freeY,
          freeW: cell.freeW,
          freeH: cell.freeH,
        })),
      });

      pushDocument({
        ...document,
        layoutId: newLayoutId,
        elements: newElements,
      });
    },
    [document, pushDocument]
  );

  const setAspectRatio = useCallback(
    (aspectRatio) => {
      pushDocument({
        ...document,
        aspectRatio,
      });
    },
    [document, pushDocument]
  );

  const addTextOverlay = useCallback(
    (textObj) => {
      const existingTextCount = document.elements.filter((el) => el.type === 'text').length;
      const textEl = createTextElement(textObj, existingTextCount);
      addElement(textEl);
    },
    [addElement, document.elements]
  );

  const updateTextOverlay = useCallback(
    (id, params) => {
      commitElementChange(id, params);
    },
    [commitElementChange]
  );

  const removeTextOverlay = useCallback(
    (id) => {
      removeElement(id);
    },
    [removeElement]
  );

  const addSticker = useCallback(
    (stickerInput) => {
      if (typeof stickerInput === 'object' && stickerInput.type === 'sticker') {
        addElement(stickerInput);
      } else {
        const existingStickerCount = document.elements.filter((el) => el.type === 'sticker').length;
        const stickerEl = createStickerElement(stickerInput, existingStickerCount);
        addElement(stickerEl);
      }
    },
    [addElement, document.elements]
  );

  const removeSticker = useCallback(
    (id) => {
      removeElement(id);
    },
    [removeElement]
  );

  const addShapeElement = useCallback(
    (shapeType = 'rectangle') => {
      const existingShapeCount = document.elements.filter((el) => el.type === 'shape').length;
      const shapeEl = createShapeElement({ shapeType }, existingShapeCount);
      addElement(shapeEl);
    },
    [addElement, document.elements]
  );

  const resetDesign = useCallback(() => {
    setAssets([]);
    clearSelection();
    pushDocument(
      normalizeLegacyStateToDocument({
        assets: [],
        cells: [],
        layoutId: '2x2-grid',
        aspectRatio: '1:1',
        frameSettings: {
          padding: 0,
          gap: 0,
          cornerRadius: 0,
          borderWidth: 0,
          borderColor: '#ffffff',
          cellShadow: false,
        },
        backgroundSettings: {
          type: 'color',
          value: '#ffffff',
        },
        textOverlays: [],
        stickers: [],
      })
    );
  }, [clearSelection, pushDocument]);

  // --- DERIVED LEGACY COMPATIBILITY STATE OBJECT ---
  const legacyState = {
    assets,
    cells: getLegacyCells(document),
    textOverlays: getLegacyTextOverlays(document),
    stickers: getLegacyStickers(document),
    layoutId: document.layoutId,
    aspectRatio: document.aspectRatio,
    frameSettings: document.frameSettings,
    backgroundSettings: document.background,
  };

  // --- ALIGNMENT & DISTRIBUTION HELPERS ---
  const alignSelected = useCallback(
    (direction) => {
      if (selection.selectedIds.length === 0) return null;
      let result = null;
      if (selection.selectedIds.length === 1) {
        result = alignToCanvasUtil(document.elements, selection.selectedIds[0], direction);
      } else {
        switch (direction) {
          case 'left':
            result = alignLeft(document.elements, selection.selectedIds);
            break;
          case 'center-h':
            result = alignCenterHorizontal(document.elements, selection.selectedIds);
            break;
          case 'right':
            result = alignRight(document.elements, selection.selectedIds);
            break;
          case 'top':
            result = alignTop(document.elements, selection.selectedIds);
            break;
          case 'center-v':
            result = alignCenterVertical(document.elements, selection.selectedIds);
            break;
          case 'bottom':
            result = alignBottom(document.elements, selection.selectedIds);
            break;
          default:
            break;
        }
      }

      if (result && result.updates && result.updates.length > 0) {
        commitMultipleElementsChange(result.updates);
      }
      return result;
    },
    [commitMultipleElementsChange, document.elements, selection.selectedIds]
  );

  const distributeSelected = useCallback(
    (axis) => {
      if (selection.selectedIds.length < 3) return null;
      let result = null;
      if (axis === 'horizontal') {
        result = distributeHorizontal(document.elements, selection.selectedIds);
      } else if (axis === 'vertical') {
        result = distributeVertical(document.elements, selection.selectedIds);
      }

      if (result && result.updates && result.updates.length > 0) {
        commitMultipleElementsChange(result.updates);
      }
      return result;
    },
    [commitMultipleElementsChange, document.elements, selection.selectedIds]
  );

  // --- PERSISTENT GUIDES MANAGEMENT ---
  const addGuide = useCallback(
    (guide) => {
      const currentGuides = document.guides || [];
      const newGuides = [...currentGuides, guide];
      pushDocument({
        ...document,
        guides: newGuides,
      });
    },
    [document, pushDocument]
  );

  const updateGuide = useCallback(
    (id, patch) => {
      const currentGuides = document.guides || [];
      const newGuides = currentGuides.map((g) => (g.id === id ? { ...g, ...patch } : g));
      pushDocument({
        ...document,
        guides: newGuides,
      });
    },
    [document, pushDocument]
  );

  const removeGuide = useCallback(
    (id) => {
      const currentGuides = document.guides || [];
      const newGuides = currentGuides.filter((g) => g.id !== id);
      pushDocument({
        ...document,
        guides: newGuides,
      });
    },
    [document, pushDocument]
  );

  const clearAllGuides = useCallback(() => {
    pushDocument({
      ...document,
      guides: [],
    });
  }, [document, pushDocument]);

  // --- VIEWPORT NAVIGATION API ---
  const setViewport = useCallback((newViewport) => {
    setViewportState((prev) => {
      const next = typeof newViewport === 'function' ? newViewport(prev) : { ...prev, ...newViewport };
      return { ...next, zoom: 1 };
    });
  }, []);

  const setZoom = useCallback(() => {
    setViewportState((prev) => ({
      ...prev,
      zoom: 1,
    }));
  }, []);

  // --- PROJECT PERSISTENCE & AUTOSAVE LOGIC ---

  const setProjectName = useCallback((newName) => {
    if (!newName || !newName.trim()) return;
    setProjectNameState(newName.trim());
    setSaveStatus('unsaved');
  }, []);

  const saveCurrentProject = useCallback(async () => {
    setSaveStatus('saving');
    const projData = createProjectData(document, assets, { projectId, projectName });
    await saveProject(projData);
    setSaveStatus('saved');
  }, [document, assets, projectId, projectName]);

  // Debounced Autosave (750ms)
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const projData = createProjectData(document, assets, { projectId, projectName });
      await saveProject(projData);

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('photo-collage-unsaved-session', JSON.stringify(projData));
        }
      } catch (e) {}

      setSaveStatus('saved');
    }, 750);

    return () => clearTimeout(timer);
  }, [document, assets, projectId, projectName, saveStatus]);

  // Check unsaved session recovery on mount
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const unsaved = localStorage.getItem('photo-collage-unsaved-session');
        if (unsaved) {
          setRecoveryAvailable(true);
        }
      }
    } catch (e) {}
  }, []);

  const recoverSession = useCallback(() => {
    try {
      const unsavedStr = localStorage.getItem('photo-collage-unsaved-session');
      if (unsavedStr) {
        const parsed = parseAndValidateProject(unsavedStr);
        setDocument(parsed.document);
        setAssets(parsed.assets || []);
        setProjectId(parsed.metadata.projectId || generateProjectId());
        setProjectNameState(parsed.metadata.projectName || 'Untitled Collage');
        historyRef.current = [parsed.document];
        historyIndexRef.current = 0;
        setSelectionState({ selectedIds: [], primaryId: null });
        setSaveStatus('saved');
      }
    } catch (e) {
      console.error('Failed to recover session:', e);
    } finally {
      setRecoveryAvailable(false);
    }
  }, []);

  const discardSession = useCallback(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('photo-collage-unsaved-session');
      }
    } catch (e) {}
    setRecoveryAvailable(false);
  }, []);

  const startNewProject = useCallback((skipConfirm = false) => {
    if (!skipConfirm && saveStatus === 'unsaved') {
      setConfirmModalData({
        title: 'Start a new project?',
        message: 'Any unsaved changes in your current project will be replaced.',
        confirmText: 'Start New Project',
        onConfirm: () => {
          setConfirmModalData(null);
          startNewProject(true);
        },
      });
      return;
    }

    const freshDoc = normalizeLegacyStateToDocument({});
    const newId = generateProjectId();
    setDocument(freshDoc);
    setAssets([]);
    setProjectId(newId);
    setProjectNameState('Untitled Collage');
    setSelectionState({ selectedIds: [], primaryId: null });
    setEditingGroupId(null);
    historyRef.current = [freshDoc];
    historyIndexRef.current = 0;
    setViewportState({ zoom: 1, panX: 0, panY: 0 });
    setSaveStatus('saved');
  }, [saveStatus]);

  const loadProject = useCallback(async (targetProjectId) => {
    try {
      const proj = await getProject(targetProjectId);
      if (!proj) throw new Error('Project not found');

      const validated = parseAndValidateProject(proj);
      setDocument(validated.document);
      setAssets(validated.assets || []);
      setProjectId(validated.metadata.projectId);
      setProjectNameState(validated.metadata.projectName || 'Untitled Collage');
      historyRef.current = [validated.document];
      historyIndexRef.current = 0;
      setSelectionState({ selectedIds: [], primaryId: null });
      setEditingGroupId(null);
      setSaveStatus('saved');
      setIsProjectManagerOpen(false);
    } catch (e) {
      console.error('Failed to load project:', e);
      alert('Unable to open this project because its data is invalid.');
    }
  }, []);

  const duplicateCurrentProject = useCallback(async (targetId) => {
    try {
      const targetProj = targetId ? await getProject(targetId) : createProjectData(document, assets, { projectId, projectName });
      if (!targetProj) return;

      const duplicated = duplicateProjectData(targetProj);
      await saveProject(duplicated);
      return duplicated;
    } catch (e) {
      console.error('Failed to duplicate project:', e);
    }
  }, [document, assets, projectId, projectName]);

  const deleteProjectAction = useCallback(async (targetProjectId) => {
    await deleteProjectFromDb(targetProjectId);
    if (targetProjectId === projectId) {
      startNewProject(true);
    }
  }, [projectId, startNewProject]);

  const exportProjectFileAction = useCallback(() => {
    const projData = createProjectData(document, assets, { projectId, projectName });
    exportProjectFileUtil(projData, projectName);
  }, [document, assets, projectId, projectName]);

  const importProjectFileAction = useCallback(async (file) => {
    try {
      const imported = await importProjectFileUtil(file);
      await saveProject(imported);
      setDocument(imported.document);
      setAssets(imported.assets || []);
      setProjectId(imported.metadata.projectId);
      setProjectNameState(imported.metadata.projectName || 'Untitled Collage');
      historyRef.current = [imported.document];
      historyIndexRef.current = 0;
      setSelectionState({ selectedIds: [], primaryId: null });
      setEditingGroupId(null);
      setSaveStatus('saved');
    } catch (e) {
      alert(`Failed to import project: ${e.message}`);
    }
  }, []);

  const legacySelectedCellId = getSelectedCellId(selection, document);
  const legacySelectedOverlayId = getSelectedOverlayId(selection, document);

  return {
    // New Unified Model Properties
    document,
    selection,
    viewport,
    setViewport,
    setZoom,

    // Project Persistence API
    projectId,
    projectName,
    setProjectName,
    saveStatus,
    saveCurrentProject,
    startNewProject,
    loadProject,
    duplicateCurrentProject,
    deleteProject: deleteProjectAction,
    exportProjectFile: exportProjectFileAction,
    importProjectFile: importProjectFileAction,
    recoveryAvailable,
    recoverSession,
    discardSession,
    isProjectManagerOpen,
    setIsProjectManagerOpen,
    confirmModalData,
    setConfirmModalData,

    // Guide API
    addGuide,
    updateGuide,
    removeGuide,
    clearAllGuides,
    // Alignment & Distribution API
    alignSelected,
    distributeSelected,
    // Group System Properties & API
    editingGroupId,
    setEditingGroupId,
    groupSelectedElements,
    ungroupSelectedElement,

    // Element Action API
    getElement,
    addElement,
    updateElement: commitElementChange,
    updateElementLive,
    commitElementChange,
    updateMultipleElementsLive,
    commitMultipleElementsChange,
    removeElement,
    duplicateElement,
    setSelection,
    clearSelection,
    setPrimarySelection,
    toggleSelection,
    selectAll,
    deleteSelectedElements,
    duplicateSelectedElements,
    moveSelectedElements,
    moveElement,
    reorderElement,
    toggleVisibility,
    toggleLock,
    renameElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,

    // Backward Compatible State Properties for Legacy Components
    state: legacyState,
    selectedCellId: legacySelectedCellId,
    setSelectedCellId: setPrimarySelection,
    selectedOverlayId: legacySelectedOverlayId,
    setSelectedOverlayId: setPrimarySelection,
    isExportOpen,
    setIsExportOpen,
    activeTab,
    setActiveTab,
    canUndo,
    canRedo,
    undo,
    redo,
    loadSamplePhotos,
    addAsset,
    replaceCellAsset,
    removeAsset,
    swapCells,
    shuffleOrder,
    updateCellParams,
    commitCellParams,
    updateFrameSettings,
    updateBackgroundSettings,
    setLayoutId,
    setAspectRatio,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    addSticker,
    removeSticker,
    addShapeElement,
    resetDesign,
  };
}

