import React, { useState, useRef, useEffect } from 'react';
import { ASPECT_RATIOS } from '../../utils/layoutTemplates';
import GridCollageView from './GridCollageView';
import FreestyleCanvasView from './FreestyleCanvasView';
import TextOverlayEditor from './TextOverlayEditor';
import ImageEditingToolbar from './ImageEditingToolbar';
import ShapeFormattingToolbar from './ShapeFormattingToolbar';
import StickerFormattingToolbar from './StickerFormattingToolbar';
import AlignmentToolbar from './AlignmentToolbar';
import SnapGuides from './SnapGuides';
import ZoomControl from './ZoomControl';
import { Upload, Sparkles, ImagePlus, RotateCw, Maximize2, Trash2 } from 'lucide-react';
import {
  getCombinedSelectionBounds,
  calculateMultiMove,
  calculateMultiScale,
  calculateMultiRotation,
  getElementBounds,
} from '../../utils/selectionGeometry';
import { getSnapTargets, calculateSnapDelta } from '../../utils/snapping';
import { resolveTargetId } from '../../utils/groupUtils';
import {
  clampZoom,
  getNextZoomIn,
  getNextZoomOut,
  calculateFitToScreen,
  calculateFitToSelection,
  calculateWheelZoom,
} from '../../utils/viewportUtils';

export default function WorkspaceCanvas({
  state,
  document,
  selection,
  editingGroupId,
  setEditingGroupId,
  selectedCellId,
  onSelectCell,
  onToggleSelection,
  onClearSelection,
  selectedOverlayId,
  onSelectOverlay,
  onSwapCells,
  onUpdateCell,
  onCommitCell,
  onUpdateTextOverlay,
  onRemoveTextOverlay,
  onRemoveSticker,
  onAddAsset,
  onReplaceAsset,
  onRemoveCellAsset,
  onLoadSamplePhotos,
  onOpenCropModal,
  onUpdateMultipleLive,
  onCommitMultipleChange,
  onAlignSelected,
  onDistributeSelected,
  viewport = { zoom: 1, panX: 0, panY: 0 },
  onSetViewport,
  onSetZoom,
  onAddGuide,
  onUpdateGuide,
  onRemoveGuide,
  onClearAllGuides,
}) {
  const {
    aspectRatio = '1:1',
    layoutId,
    backgroundSettings,
    cells,
    assets,
    textOverlays,
    stickers,
  } = state;

  const handleSelectElement = (id) => {
    if (!id) {
      onSelectCell(null);
      onSelectOverlay(null);
      return;
    }
    const resolvedId = resolveTargetId(document?.elements, id, editingGroupId);
    onSelectCell(resolvedId);
    onSelectOverlay(resolvedId);
  };

  const handleToggleElement = (id) => {
    if (!id) return;
    const resolvedId = resolveTargetId(document?.elements, id, editingGroupId);
    if (onToggleSelection) {
      onToggleSelection(resolvedId);
    } else {
      handleSelectElement(id);
    }
  };

  const mainRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [multiTransformState, setMultiTransformState] = useState(null);
  const [snapGuides, setSnapGuides] = useState([]);
  const snapStateRef = useRef({});

  const [showGuides, setShowGuides] = useState(true);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanningViewport, setIsPanningViewport] = useState(false);
  const [canvasRectState, setCanvasRectState] = useState(null);
  const [workspaceBounds, setWorkspaceBounds] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? Math.max(200, window.innerHeight - 200) : 600,
  });

  const aspectSpec = ASPECT_RATIOS.find((a) => a.id === aspectRatio) || ASPECT_RATIOS[0];
  const targetRatio = aspectSpec.ratio;

  // Measure workspace container bounds dynamically
  useEffect(() => {
    const updateWorkspaceBounds = () => {
      if (mainRef.current) {
        const rect = mainRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setWorkspaceBounds({
            width: rect.width,
            height: rect.height,
          });
        }
      }
    };
    updateWorkspaceBounds();
    window.addEventListener('resize', updateWorkspaceBounds);
    let observer;
    if (window.ResizeObserver && mainRef.current) {
      observer = new ResizeObserver(updateWorkspaceBounds);
      observer.observe(mainRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateWorkspaceBounds);
      if (observer) observer.disconnect();
    };
  }, []);

  // Reliable contain-style canvas sizing calculation based on available workspace
  const canvasDimensions = React.useMemo(() => {
    const isMobile = (workspaceBounds.width < 768);
    // Leave 12px breathing room on narrow mobile screens (<768px), 32px on larger screens
    const margin = isMobile ? 12 : 32;
    const availW = Math.max(120, (workspaceBounds.width || 800) - margin);
    const availH = Math.max(120, (workspaceBounds.height || 600) - margin);
    const ratio = targetRatio || 1;

    let w, h;
    if (availW / availH > ratio) {
      h = availH;
      w = h * ratio;
    } else {
      w = availW;
      h = w / ratio;
    }

    // On mobile (<768px), enforce strict contain-fit so height NEVER exceeds availH and width NEVER exceeds availW
    if (isMobile) {
      if (h > availH) {
        h = availH;
        w = h * ratio;
      }
      if (w > availW) {
        w = availW;
        h = w / ratio;
      }
    }

    w = Math.max(120, Math.round(w));
    h = Math.max(120, Math.round(h));

    console.log('[CANVAS DEBUG]', {
      selectedRatio: aspectRatio,
      targetRatio,
      availableWidth: availW,
      availableHeight: availH,
      canvasWidth: w,
      canvasHeight: h,
      actualRatio: Number((w / h).toFixed(4)),
    });

    return { width: w, height: h };
  }, [workspaceBounds, targetRatio, aspectRatio]);

  // Measure canvas rectangle dynamically for rulers & coordinate converters
  useEffect(() => {
    const updateCanvasRect = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasRectState(rect);
        if (rect.width > 0 && rect.height > 0) {
          console.log('[CANVAS DOM]', rect);
        }
      }
    };
    updateCanvasRect();
    window.addEventListener('resize', updateCanvasRect);
    return () => window.removeEventListener('resize', updateCanvasRect);
  }, [viewport, aspectRatio, targetRatio, canvasDimensions]);



  // Spacebar tracker for Space + Drag Viewport Pan
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase());
      if (isInput) return;

      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanningViewport(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Selected elements selectors
  const selectedElements = (selection?.selectedIds || [])
    .map((id) => document?.elements?.find((el) => el.id === id))
    .filter(Boolean);

  const selectedImageElements = selectedElements.filter((el) => el.type === 'image');
  const selectedShapeElements = selectedElements.filter((el) => el.type === 'shape');
  const selectedStickerElements = selectedElements.filter((el) => el.type === 'sticker');
  const primarySelectedElement = document?.elements?.find((el) => el.id === selection?.primaryId);

  const assetMap = React.useMemo(() => {
    const map = {};
    (assets || []).forEach((a) => {
      map[a.id] = a;
    });
    return map;
  }, [assets]);

  const isSingleSelection = (selection?.selectedIds?.length || 0) === 1;
  const selectedCell = isSingleSelection ? cells.find((c) => c.id === selectedCellId) : null;

  const [isResizingOuterFrame, setIsResizingOuterFrame] = useState(false);

  // Compute multi-selection bounding box if > 1 items selected
  const isMultiSelecting = !isResizingOuterFrame && (selection?.selectedIds?.length || 0) > 1;
  const selectionBounds = isMultiSelecting && document?.elements
    ? getCombinedSelectionBounds(document.elements, selection.selectedIds, layoutId)
    : null;

  // Fit navigation handlers
  const handleFitToScreen = () => {
    const rect = mainRef.current?.getBoundingClientRect();
    if (rect && onSetViewport) {
      const fit = calculateFitToScreen(rect, aspectSpec);
      onSetViewport(fit);
    }
  };

  const handleFitToSelection = () => {
    const rect = mainRef.current?.getBoundingClientRect();
    if (rect && onSetViewport) {
      const fit = calculateFitToSelection(selectionBounds, rect, aspectSpec);
      onSetViewport(fit);
    }
  };

  const handleActualSize = () => {
    if (onSetViewport) {
      onSetViewport({ zoom: 1, panX: 0, panY: 0 });
    }
  };

  // Keyboard navigation and Image Editing shortcuts (R, Shift+R, H, V, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase());
      if (isInput) return;

      if (!isMod && selectedImageElements.length > 0) {
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          const commitMap = {};
          selectedImageElements.forEach((el) => {
            const rotStep = e.shiftKey ? -90 : 90;
            commitMap[el.id] = { rotation: ((el.rotation || 0) + rotStep + 360) % 360 };
          });
          if (onCommitMultipleChange) onCommitMultipleChange(commitMap);
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          const commitMap = {};
          selectedImageElements.forEach((el) => {
            commitMap[el.id] = { flipH: !el.flipH };
          });
          if (onCommitMultipleChange) onCommitMultipleChange(commitMap);
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          const commitMap = {};
          selectedImageElements.forEach((el) => {
            commitMap[el.id] = { flipV: !el.flipV };
          });
          if (onCommitMultipleChange) onCommitMultipleChange(commitMap);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewport, onSetZoom, selectionBounds, selectedImageElements, onCommitMultipleChange]);

  // Mouse Down handler on <main> for Space + Drag or Middle Mouse Pan
  const handleMainMouseDown = (e) => {
    if (isSpacePressed || e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanningViewport(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const initialPanX = viewport?.panX || 0;
      const initialPanY = viewport?.panY || 0;

      const handlePanMove = (moveEvt) => {
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        if (onSetViewport) {
          onSetViewport({
            ...viewport,
            panX: Math.round(initialPanX + dx),
            panY: Math.round(initialPanY + dy),
          });
        }
      };

      const handlePanUp = () => {
        window.removeEventListener('mousemove', handlePanMove);
        window.removeEventListener('mouseup', handlePanUp);
        setIsPanningViewport(false);
      };

      window.addEventListener('mousemove', handlePanMove);
      window.addEventListener('mouseup', handlePanUp);
    }
  };

  // Handle Escape key during active dragging movement to cancel drag
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && multiTransformState) {
        setSnapGuides([]);
        snapStateRef.current = {};
        setMultiTransformState(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [multiTransformState]);

  // Window mousemove / mouseup during multi-transform drag
  useEffect(() => {
    if (!multiTransformState) return;

    const handleWindowMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      const rawDeltaX = ((e.clientX - multiTransformState.startX) / rect.width) * 100;
      const rawDeltaY = ((e.clientY - multiTransformState.startY) / rect.height) * 100;

      if (multiTransformState.action === 'move') {
        const init = multiTransformState.initialBounds;
        const trialBounds = {
          x: init.x + rawDeltaX,
          y: init.y + rawDeltaY,
          width: init.width,
          height: init.height,
          cx: init.cx + rawDeltaX,
          cy: init.cy + rawDeltaY,
        };

        const targets = getSnapTargets(document?.elements, selection.selectedIds, rect, document?.guides || []);
        const snapRes = calculateSnapDelta(trialBounds, targets, rect, snapStateRef.current);
        snapStateRef.current = snapRes.activeSnapState;
        setSnapGuides(snapRes.guides);

        const finalDeltaX = rawDeltaX + snapRes.snapDeltaX;
        const finalDeltaY = rawDeltaY + snapRes.snapDeltaY;

        const updates = calculateMultiMove(
          document.elements,
          selection.selectedIds,
          finalDeltaX,
          finalDeltaY
        );
        if (onUpdateMultipleLive) onUpdateMultipleLive(updates);
      } else if (multiTransformState.action === 'scale-corner') {
        setSnapGuides([]);
        const init = multiTransformState.initialBounds;
        const scaleX = Math.max(0.2, (init.width + rawDeltaX) / init.width);
        const scaleY = Math.max(0.2, (init.height + rawDeltaY) / init.height);
        const updates = calculateMultiScale(
          document.elements,
          selection.selectedIds,
          init,
          scaleX,
          scaleY
        );
        if (onUpdateMultipleLive) onUpdateMultipleLive(updates);
      } else if (multiTransformState.action === 'rotate') {
        setSnapGuides([]);
        const init = multiTransformState.initialBounds;
        const centerPx = {
          x: rect.left + (init.cx / 100) * rect.width,
          y: rect.top + (init.cy / 100) * rect.height,
        };
        const currentAngleRad = Math.atan2(e.clientY - centerPx.y, e.clientX - centerPx.x);
        const currentAngleDeg = (currentAngleRad * 180) / Math.PI;
        const deltaAngle = currentAngleDeg - multiTransformState.initialAngleDeg;

        const updates = calculateMultiRotation(
          document.elements,
          selection.selectedIds,
          init,
          Math.round(deltaAngle)
        );
        if (onUpdateMultipleLive) onUpdateMultipleLive(updates);
      }
    };

    const handleWindowMouseUp = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && multiTransformState) {
        const rawDeltaX = ((e.clientX - multiTransformState.startX) / rect.width) * 100;
        const rawDeltaY = ((e.clientY - multiTransformState.startY) / rect.height) * 100;

        let finalUpdates = [];
        if (multiTransformState.action === 'move') {
          const init = multiTransformState.initialBounds;
          const trialBounds = {
            x: init.x + rawDeltaX,
            y: init.y + rawDeltaY,
            width: init.width,
            height: init.height,
            cx: init.cx + rawDeltaX,
            cy: init.cy + rawDeltaY,
          };

          const targets = getSnapTargets(document?.elements, selection.selectedIds, rect, document?.guides || []);
          const snapRes = calculateSnapDelta(trialBounds, targets, rect, snapStateRef.current);
          const finalDeltaX = rawDeltaX + snapRes.snapDeltaX;
          const finalDeltaY = rawDeltaY + snapRes.snapDeltaY;

          finalUpdates = calculateMultiMove(
            document.elements,
            selection.selectedIds,
            finalDeltaX,
            finalDeltaY
          );
        } else if (multiTransformState.action === 'scale-corner') {
          const init = multiTransformState.initialBounds;
          const scaleX = Math.max(0.2, (init.width + rawDeltaX) / init.width);
          const scaleY = Math.max(0.2, (init.height + rawDeltaY) / init.height);
          finalUpdates = calculateMultiScale(
            document.elements,
            selection.selectedIds,
            init,
            scaleX,
            scaleY
          );
        } else if (multiTransformState.action === 'rotate') {
          const init = multiTransformState.initialBounds;
          const centerPx = {
            x: rect.left + (init.cx / 100) * rect.width,
            y: rect.top + (init.cy / 100) * rect.height,
          };
          const currentAngleRad = Math.atan2(e.clientY - centerPx.y, e.clientX - centerPx.x);
          const currentAngleDeg = (currentAngleRad * 180) / Math.PI;
          const deltaAngle = currentAngleDeg - multiTransformState.initialAngleDeg;

          finalUpdates = calculateMultiRotation(
            document.elements,
            selection.selectedIds,
            init,
            Math.round(deltaAngle)
          );
        }

        if (finalUpdates.length > 0 && onCommitMultipleChange) {
          onCommitMultipleChange(finalUpdates);
        }
      }
      setSnapGuides([]);
      snapStateRef.current = {};
      setMultiTransformState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    multiTransformState,
    document,
    selection,
    onUpdateMultipleLive,
    onCommitMultipleChange,
  ]);

  // Compute Background Inline Style
  const getBgStyle = () => {
    if (backgroundSettings.type === 'color') {
      return { backgroundColor: backgroundSettings.value || '#ffffff' };
    }
    if (backgroundSettings.type === 'gradient') {
      return { background: backgroundSettings.value || '#ffffff' };
    }
    return { backgroundColor: '#ffffff' };
  };

  const targetCellIdRef = useRef(null);

  const handleAddPhotoClick = (cellId) => {
    targetCellIdRef.current = cellId;
    console.log('[EMPTY CELL CLICK]', { cellId, layoutId: document?.layoutId });
    console.log('[FILE PICKER]', { targetCellId: cellId });
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const targetCellId = targetCellIdRef.current;
    targetCellIdRef.current = null;

    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAsset = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          url: event.target.result,
        };

        if (index === 0 && targetCellId && onReplaceAsset) {
          console.log('[IMAGE SELECTED]', {
            assetId: newAsset.id,
            targetCellId,
          });
          const targetEl = document?.elements?.find((el) => el.id === targetCellId);
          console.log('[EMPTY CELL FILLED]', {
            cellId: targetCellId,
            assetId: newAsset.id,
            x: targetEl?.x ?? 0,
            y: targetEl?.y ?? 0,
            width: targetEl?.width ?? 100,
            height: targetEl?.height ?? 100,
          });
          onReplaceAsset(targetCellId, newAsset);
        } else {
          onAddAsset(newAsset);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        onAddAsset({
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          url: event.target.result,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCanvasClick = (e) => {
    if (isSpacePressed || isPanningViewport) return;

    // Check if the click originated from an interactive element (cell, handle, toolbar, button, input, modal, etc.)
    const isInteractiveTarget = Boolean(
      e.target.closest(
        '[data-element-id], [data-testid^="image-cell"], [data-testid^="add-photo-placeholder"], button, input, select, textarea, [role="button"], .ImageEditingToolbar, [data-interactive], [data-editing-toolbar]'
      )
    );

    if (!isInteractiveTarget) {
      if (onClearSelection) {
        onClearSelection();
      } else {
        onSelectCell(null);
        onSelectOverlay(null);
      }
    }
  };

  return (
    <main
      data-layout="workspace-main"
      ref={mainRef}
      onMouseDown={handleMainMouseDown}
      onClick={handleCanvasClick}
      className={`flex-1 w-full max-w-full min-w-0 min-h-0 md:h-full bg-[#f8fafc] relative flex flex-col items-center justify-start md:justify-center pt-2 sm:pt-3 md:pt-0 overflow-hidden select-none box-border ${
        isSpacePressed ? (isPanningViewport ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
    >
      {/* Top Left Floating Alignment & Distribution Toolbar */}
      {(selection?.selectedIds?.length || 0) >= 1 && onAlignSelected && !isSpacePressed && (
        <div className="absolute top-8 left-8 z-40 animate-in fade-in duration-200">
          <AlignmentToolbar
            selectedCount={selection.selectedIds.length}
            onAlign={onAlignSelected}
            onDistribute={onDistributeSelected}
          />
        </div>
      )}



      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* VIEWPORT TRANSFORM CONTAINER (Workspace Scale 1.0 Locked) */}
      <div
        data-layout="workspace-transform"
        onClick={handleCanvasClick}
        className="absolute inset-0 md:relative md:w-full md:h-full flex items-center justify-center overflow-hidden"
        style={{
          transform: `translate(${viewport?.panX || 0}px, ${viewport?.panY || 0}px) scale(1)`,
          transformOrigin: 'center center',
          transition: 'none',
        }}
      >
        {/* Aspect Ratio Bounding Container */}
        <div
          ref={containerRef}
          onClick={handleCanvasClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative overflow-hidden transition-all duration-150 shrink-0"
          style={{
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
            aspectRatio: `${targetRatio}`,
            ...getBgStyle(),
          }}
        >
          {/* Visual Snap Guides Overlay */}
          <SnapGuides guides={snapGuides} />



        {/* Photo Blur Background Image if enabled */}
        {backgroundSettings.type === 'blur' && backgroundSettings.blurAssetUrl && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={backgroundSettings.blurAssetUrl}
              alt=""
              className="w-full h-full object-cover scale-125 blur-2xl opacity-60"
            />
          </div>
        )}

        {/* Empty Canvas Dropzone View */}
        {assets.length === 0 ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400 border border-slate-200 shadow-xs">
              <ImagePlus className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5 font-serif">
              Canvas is Blank
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              Drag & drop images anywhere here, upload local files, or load sample photos to begin.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-[#c25e40] hover:bg-[#a84d32] text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photos</span>
              </button>
              <button
                onClick={onLoadSamplePhotos}
                className="px-4 py-2.5 rounded-xl bg-amber-100/80 hover:bg-amber-100 text-amber-900 border border-amber-300/60 text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Load Sample Photos</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Group Edit Mode Canvas Banner */}
            {editingGroupId && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-amber-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 animate-in fade-in duration-200">
                <span>Editing Group Children</span>
                <button
                  onClick={() => setEditingGroupId(null)}
                  className="px-2 py-0.5 rounded-md bg-amber-950 hover:bg-black text-[10px] uppercase font-bold tracking-wider transition-colors"
                >
                  Exit (Esc)
                </button>
              </div>
            )}

            {/* Collaged Content View */}
            <div className="absolute inset-0 z-10">
              {layoutId === 'freestyle' ? (
                <FreestyleCanvasView
                  state={state}
                  document={document}
                  containerRef={containerRef}
                  setSnapGuides={setSnapGuides}
                  selectedCellId={selectedCellId}
                  onSelectCell={handleSelectElement}
                  onToggleSelection={handleToggleElement}
                  onUpdateCell={onUpdateCell}
                  onCommitCell={onCommitCell}
                />
              ) : (
                <GridCollageView
                  state={state}
                  selectedCellId={selectedCellId}
                  onSelectCell={handleSelectElement}
                  onToggleSelection={handleToggleElement}
                  onSwapCells={onSwapCells}
                  onUpdateCell={onUpdateCell}
                  onCommitCell={onCommitCell}
                  onResizingOuterFrameChange={setIsResizingOuterFrame}
                  onAddPhotoClick={handleAddPhotoClick}
                  onReplaceAsset={onReplaceAsset}
                  onAddAsset={onAddAsset}
                />
              )}
            </div>

            {/* Text & Sticker Overlay Layer */}
            <TextOverlayEditor
              textOverlays={textOverlays}
              stickers={stickers}
              document={document}
              containerRef={containerRef}
              setSnapGuides={setSnapGuides}
              selectedOverlayId={selectedOverlayId}
              onSelectOverlay={handleSelectElement}
              onToggleSelection={handleToggleElement}
              onUpdateTextOverlay={onUpdateTextOverlay}
              onRemoveTextOverlay={onRemoveTextOverlay}
              onRemoveSticker={onRemoveSticker}
            />

            {/* COMBINED MULTI-SELECTION TRANSFORM BOUNDING BOX */}
            {isMultiSelecting && selectionBounds && (
              <div
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  setMultiTransformState({
                    action: 'move',
                    startX: e.clientX,
                    startY: e.clientY,
                    initialBounds: { ...selectionBounds },
                  });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (selection?.primaryId && setEditingGroupId) {
                    const primaryEl = document?.elements?.find((el) => el.id === selection.primaryId);
                    if (primaryEl?.type === 'group') {
                      setEditingGroupId(primaryEl.id);
                    }
                  }
                }}
                className="absolute cursor-move border-2 border-dashed border-[#c25e40] bg-[#c25e40]/10 z-30 transition-shadow rounded-sm"
                style={{
                  left: `${selectionBounds.x}%`,
                  top: `${selectionBounds.y}%`,
                  width: `${selectionBounds.width}%`,
                  height: `${selectionBounds.height}%`,
                }}
              >
                {/* Rotate handle top center */}
                <div
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    const rect = containerRef.current?.getBoundingClientRect();
                    const centerPx = rect
                      ? {
                          x: rect.left + (selectionBounds.cx / 100) * rect.width,
                          y: rect.top + (selectionBounds.cy / 100) * rect.height,
                        }
                      : { x: e.clientX, y: e.clientY };
                    const initAngle =
                      Math.atan2(e.clientY - centerPx.y, e.clientX - centerPx.x) * (180 / Math.PI);
                    setMultiTransformState({
                      action: 'rotate',
                      startX: e.clientX,
                      startY: e.clientY,
                      initialAngleDeg: initAngle,
                      initialBounds: { ...selectionBounds },
                    });
                  }}
                  title="Drag to rotate selected objects together"
                  className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#c25e40] text-white flex items-center justify-center cursor-alias shadow-md hover:scale-125 transition-transform"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </div>

                {/* Bottom-Right Corner Resize Handle */}
                <div
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    setMultiTransformState({
                      action: 'scale-corner',
                      startX: e.clientX,
                      startY: e.clientY,
                      initialBounds: { ...selectionBounds },
                    });
                  }}
                  title="Drag to resize selected group"
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#c25e40] border-2 border-white rounded-sm cursor-nwse-resize shadow-md flex items-center justify-center hover:scale-125 transition-transform"
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </div>

                {/* Corner Handle Indicators */}
                <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#c25e40] rounded-sm pointer-events-none" />
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#c25e40] rounded-sm pointer-events-none" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#c25e40] rounded-sm pointer-events-none" />

                {/* Object count badge */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#c25e40] text-white text-[10px] font-bold shadow-md whitespace-nowrap pointer-events-none flex items-center gap-1">
                  <span>{selectionBounds.count} objects selected</span>
                  {selectionBounds.hasLocked && (
                    <span className="opacity-80 text-[9px]">(1+ locked skipped)</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Contextual Image Editing Toolbar (Single and Multi-selection) */}
      {selectedImageElements.length > 0 && (
        <ImageEditingToolbar
          selectedElements={selectedImageElements}
          primaryElement={primarySelectedElement}
          assetMap={assetMap}
          onLiveUpdate={(liveMap) => {
            if (onUpdateMultipleLive) onUpdateMultipleLive(liveMap);
          }}
          onCommitChange={(commitMap) => {
            if (onCommitMultipleChange) onCommitMultipleChange(commitMap);
            else if (onCommitCell && selectedCellId && commitMap[selectedCellId]) {
              onCommitCell(selectedCellId, commitMap[selectedCellId]);
            }
          }}
          onClose={() => handleSelectElement(null)}
          onOpenCropModal={onOpenCropModal}
          onReplaceAsset={onReplaceAsset}
          onRemoveAsset={onRemoveCellAsset}
        />
      )}
      {selectedShapeElements.length > 0 && (
        <ShapeFormattingToolbar
          selectedElements={selectedShapeElements}
          primaryElement={primarySelectedElement}
          onLiveUpdate={(liveMap) => {
            if (onUpdateMultipleLive) onUpdateMultipleLive(liveMap);
          }}
          onCommitChange={(commitMap) => {
            if (onCommitMultipleChange) onCommitMultipleChange(commitMap);
          }}
          onClose={() => handleSelectElement(null)}
        />
      )}
      {/* Contextual Sticker Formatting Toolbar (Single and Multi-selection) */}
      {selectedStickerElements.length > 0 && (
        <StickerFormattingToolbar
          selectedElements={selectedStickerElements}
          primaryElement={primarySelectedElement}
          onLiveUpdate={(liveMap) => {
            if (onUpdateMultipleLive) onUpdateMultipleLive(liveMap);
          }}
          onCommitChange={(commitMap) => {
            if (onCommitMultipleChange) onCommitMultipleChange(commitMap);
          }}
          onClose={() => handleSelectElement(null)}
        />
      )}
    </main>
  );
}
