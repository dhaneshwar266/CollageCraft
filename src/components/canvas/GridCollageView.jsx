import React, { useState, useRef, useEffect } from 'react';
import { LAYOUT_PRESETS, getAutoGridLayout } from '../../utils/layoutTemplates';
import { getImageFilterStyle, getImageTransformStyle, clampImagePan } from '../../utils/imageUtils';
import { Move, Maximize2, SlidersHorizontal, RefreshCw, ImagePlus } from 'lucide-react';

export default function GridCollageView({
  state,
  selectedCellId,
  onSelectCell,
  onToggleSelection,
  onSwapCells,
  onUpdateCell,
  onCommitCell,
  onResizingOuterFrameChange,
  onAddPhotoClick,
  onReplaceAsset,
  onAddAsset,
}) {
  const {
    layoutId,
    frameSettings,
    cells,
    assets,
  } = state;

  const containerRef = useRef(null);
  const cellRefs = useRef({});
  const [hoveredCellId, setHoveredCellId] = useState(null);
  const [swapTargetCellId, setSwapTargetCellId] = useState(null);

  // Interaction State: { cellId, type, startX, startY, isDragging, initialPanX, initialPanY, currentPanX, currentPanY, initialSpec, currentSpec }
  const [activeAction, setActiveAction] = useState(null);

  const visibleCells = React.useMemo(() => (cells || []).filter((c) => c.visible !== false), [cells]);

  useEffect(() => {
    console.log('[TEMPLATE-6-RENDER]', {
      layoutId,
      visibleCellsLength: visibleCells.length,
      cells: visibleCells.map((cell) => {
        const spec = cell.specOverride || {
          x: cell.x ?? 0,
          y: cell.y ?? 0,
          width: cell.width ?? 100,
          height: cell.height ?? 100,
        };
        return {
          id: cell.id,
          assetId: cell.assetId,
          x: spec.x,
          y: spec.y,
          width: spec.width,
          height: spec.height,
        };
      }),
    });
  }, [layoutId, visibleCells]);

  const {
    padding = 0,
    gap = 0,
    cornerRadius = 0,
    cellShadow = false,
  } = frameSettings;

  // Global Window Mouse Events during active dragging/resizing/panning/splitting/swapping
  useEffect(() => {
    if (!activeAction) return;

    const handleWindowMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - activeAction.startX, e.clientY - activeAction.startY);

      if (activeAction.type === 'in-cell-pan') {
        if (dist < 4 && !activeAction.isDragging) return;
        const vpZoom = 1;
        const deltaX = Math.round((e.clientX - activeAction.startX) / vpZoom);
        const deltaY = Math.round((e.clientY - activeAction.startY) / vpZoom);

        const rawPanX = activeAction.initialPanX + deltaX;
        const rawPanY = activeAction.initialPanY + deltaY;

        const { panX: newPanX, panY: newPanY } = clampImagePan(
          rawPanX,
          rawPanY,
          activeAction.cellW,
          activeAction.cellH,
          activeAction.zoom,
          activeAction.asset
        );

        setActiveAction((prev) => (prev ? { ...prev, isDragging: true, currentPanX: newPanX, currentPanY: newPanY } : null));
        onUpdateCell(activeAction.cellId, { panX: newPanX, panY: newPanY });
      } else if (activeAction.type === 'cell-swap') {
        // Evaluate drag threshold (6px)
        if (!activeAction.isDragging && dist > 6) {
          setActiveAction((prev) => (prev ? { ...prev, isDragging: true } : null));
        }

        if (dist > 6) {
          // Hit test cursor against grid cells to detect target cell for swapping
          let foundTargetId = null;
          for (const c of cells) {
            if (c.id === activeAction.cellId || c.visible === false) continue;
            const el = cellRefs.current[c.id];
            if (el) {
              const cellRect = el.getBoundingClientRect();
              if (
                e.clientX >= cellRect.left &&
                e.clientX <= cellRect.right &&
                e.clientY >= cellRect.top &&
                e.clientY <= cellRect.bottom
              ) {
                // If destination cell is not locked, mark as valid swap target
                if (!c.locked) {
                  foundTargetId = c.id;
                }
                break;
              }
            }
          }
          setSwapTargetCellId(foundTargetId);
        }
      } else if (activeAction.type === 'split-horizontal' && rect && cells.length >= 2) {
        // 2-Photo Side-by-Side Splitter Dragging
        const vpZoom = 1;
        const screenDeltaX = e.clientX - activeAction.startX;
        const canvasDeltaX = screenDeltaX / vpZoom;
        const paddingOffset = (padding || 0) * 2;
        const canvasWidth = Math.max(50, (rect.width / vpZoom) - paddingOffset);
        const deltaPercentX = (canvasDeltaX / canvasWidth) * 100;
        const newSplitX = Math.max(15, Math.min(85, activeAction.initialSplitX + deltaPercentX));

        const spec0 = { x: 0, y: 0, width: newSplitX, height: 100 };
        const spec1 = { x: newSplitX, y: 0, width: 100 - newSplitX, height: 100 };

        onUpdateCell(cells[0].id, { specOverride: spec0 });
        onUpdateCell(cells[1].id, { specOverride: spec1 });
      } else if (activeAction.type === 'split-vertical' && rect && cells.length >= 2) {
        // 2-Photo Top/Bottom Splitter Dragging
        const vpZoom = 1;
        const screenDeltaY = e.clientY - activeAction.startY;
        const canvasDeltaY = screenDeltaY / vpZoom;
        const paddingOffset = (padding || 0) * 2;
        const canvasHeight = Math.max(50, (rect.height / vpZoom) - paddingOffset);
        const deltaPercentY = (canvasDeltaY / canvasHeight) * 100;
        const newSplitY = Math.max(15, Math.min(85, activeAction.initialSplitY + deltaPercentY));

        const spec0 = { x: 0, y: 0, width: 100, height: newSplitY };
        const spec1 = { x: 0, y: newSplitY, width: 100, height: 100 - newSplitY };

        onUpdateCell(cells[0].id, { specOverride: spec0 });
        onUpdateCell(cells[1].id, { specOverride: spec1 });
      } else if (rect && rect.width > 0 && rect.height > 0) {
        const vpZoom = 1;
        const screenDeltaX = e.clientX - activeAction.startX;
        const screenDeltaY = e.clientY - activeAction.startY;

        const canvasDeltaX = screenDeltaX / vpZoom;
        const canvasDeltaY = screenDeltaY / vpZoom;

        const paddingOffset = (padding || 0) * 2;
        const canvasWidth = Math.max(50, (rect.width / vpZoom) - paddingOffset);
        const canvasHeight = Math.max(50, (rect.height / vpZoom) - paddingOffset);

        const deltaPercentX = (canvasDeltaX / canvasWidth) * 100;
        const deltaPercentY = (canvasDeltaY / canvasHeight) * 100;
        const init = activeAction.initialSpec;
        const MIN_W = 5;
        const MIN_H = 5;

        const round2 = (val) => Math.round(val * 100) / 100;
        let newSpec = { ...init };

        if (activeAction.type === 'resize-corner' || activeAction.type === 'resize-bottom-right') {
          newSpec.width = round2(Math.max(MIN_W, Math.min(100 - init.x, init.width + deltaPercentX)));
          newSpec.height = round2(Math.max(MIN_H, Math.min(100 - init.y, init.height + deltaPercentY)));
        } else if (activeAction.type === 'resize-right') {
          newSpec.width = round2(Math.max(MIN_W, Math.min(100 - init.x, init.width + deltaPercentX)));
        } else if (activeAction.type === 'resize-bottom') {
          newSpec.height = round2(Math.max(MIN_H, Math.min(100 - init.y, init.height + deltaPercentY)));
        } else if (activeAction.type === 'resize-top-right') {
          newSpec.width = round2(Math.max(MIN_W, Math.min(100 - init.x, init.width + deltaPercentX)));
          const rawH = init.height - deltaPercentY;
          const clampedH = Math.max(MIN_H, Math.min(init.y + init.height, rawH));
          newSpec.y = round2(init.y + (init.height - clampedH));
          newSpec.height = round2(clampedH);
        } else if (activeAction.type === 'resize-bottom-left') {
          const rawW = init.width - deltaPercentX;
          const clampedW = Math.max(MIN_W, Math.min(init.x + init.width, rawW));
          newSpec.x = round2(init.x + (init.width - clampedW));
          newSpec.width = round2(clampedW);
          newSpec.height = round2(Math.max(MIN_H, Math.min(100 - init.y, init.height + deltaPercentY)));
        } else if (activeAction.type === 'resize-top-left') {
          const rawW = init.width - deltaPercentX;
          const clampedW = Math.max(MIN_W, Math.min(init.x + init.width, rawW));
          newSpec.x = round2(init.x + (init.width - clampedW));
          newSpec.width = round2(clampedW);

          const rawH = init.height - deltaPercentY;
          const clampedH = Math.max(MIN_H, Math.min(init.y + init.height, rawH));
          newSpec.y = round2(init.y + (init.height - clampedH));
          newSpec.height = round2(clampedH);
        } else if (activeAction.type === 'move-grid') {
          newSpec.x = round2(Math.max(0, Math.min(100 - init.width, init.x + deltaPercentX)));
          newSpec.y = round2(Math.max(0, Math.min(100 - init.height, init.y + deltaPercentY)));
        }

        setActiveAction((prev) => (prev ? { ...prev, currentSpec: newSpec } : null));

        const rawW = init.width + deltaPercentX;
        const rawH = init.height + deltaPercentY;

        window.__resizeMoveCounter = (window.__resizeMoveCounter || 0) + 1;

        console.log(`[OUTER RESIZE DEBUG #${window.__resizeMoveCounter}]`, {
          mouseX: e.clientX,
          mouseY: e.clientY,
          startWidth: init.width,
          startHeight: init.height,
          calculatedWidth: newSpec.width,
          calculatedHeight: newSpec.height,
          specOverride: newSpec,
          rectWidth: cellRefs.current[activeAction.cellId]?.getBoundingClientRect().width,
          rectHeight: cellRefs.current[activeAction.cellId]?.getBoundingClientRect().height,
          viewportZoom: vpZoom,
          canvasWidth,
          canvasHeight,
          screenDeltaX,
          screenDeltaY,
          deltaPercentX,
          deltaPercentY
        });

        onUpdateCell(activeAction.cellId, { specOverride: newSpec });
      }
    };

    const handleWindowMouseUp = () => {
      if (activeAction) {
        if (
          activeAction.type?.startsWith('resize-') ||
          activeAction.type === 'move-grid'
        ) {
          onResizingOuterFrameChange?.(false);
        }

        if (activeAction.type === 'in-cell-pan') {
          if (activeAction.isDragging) {
            onCommitCell(activeAction.cellId, {
              panX: activeAction.currentPanX,
              panY: activeAction.currentPanY,
            });
          }
        } else if (activeAction.type === 'cell-swap') {
          if (activeAction.isDragging && swapTargetCellId && swapTargetCellId !== activeAction.cellId) {
            // Perform Cell Swap on Drop
            onSwapCells(activeAction.cellId, swapTargetCellId);
          }
        } else if (
          activeAction.type === 'resize-corner' ||
          activeAction.type === 'resize-bottom-right' ||
          activeAction.type === 'resize-right' ||
          activeAction.type === 'resize-bottom' ||
          activeAction.type === 'resize-top-right' ||
          activeAction.type === 'resize-bottom-left' ||
          activeAction.type === 'resize-top-left' ||
          activeAction.type === 'move-grid'
        ) {
          onCommitCell(activeAction.cellId, {
            specOverride: activeAction.currentSpec,
          });
        }
      }
      setActiveAction(null);
      setSwapTargetCellId(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [activeAction, cells, swapTargetCellId, onSwapCells, onUpdateCell, onCommitCell, state, onResizingOuterFrameChange]);

  // Handle HTML5 Drag & Drop Asset Replacement (from AssetTray)
  const handleDragOver = (e, cellId) => {
    e.preventDefault();
    setHoveredCellId(cellId);
  };

  const handleDragLeave = () => {
    setHoveredCellId(null);
  };

  const handleDrop = (e, targetCellId) => {
    e.preventDefault();
    setHoveredCellId(null);

    const assetJson = e.dataTransfer.getData('application/json');
    if (assetJson) {
      try {
        const { assetId } = JSON.parse(assetJson);
        if (assetId) {
          onCommitCell(targetCellId, { assetId });
          return;
        }
      } catch {}
    }

    const plainTextId = e.dataTransfer.getData('text/plain');
    if (plainTextId) {
      onCommitCell(targetCellId, { assetId: plainTextId });
      return;
    }

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAsset = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          url: event.target.result,
        };
        console.log('[EMPTY CELL FILLED]', {
          cellId: targetCellId,
          assetId: newAsset.id,
        });
        if (onReplaceAsset) {
          onReplaceAsset(targetCellId, newAsset);
        } else if (onAddAsset) {
          onAddAsset(newAsset);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activePointersRef = useRef(new Map());
  const pinchStateRef = useRef({
    active: false,
    cellId: null,
    startDistance: 0,
    startZoom: 1,
    currentZoom: 1,
  });

  // MOUSE DOWN: Start Drag-to-Swap, In-Cell Pan, or Transformation
  const handleMouseDownCell = (e, cell, defaultSpec, actionType = 'pan') => {
    if (e.button !== 0) return;

    // Block single-finger drag/swap/resize if 2+ pointers or pinch is active
    if (activePointersRef.current.size >= 2 || pinchStateRef.current.active) {
      console.warn('[PINCH BLOCKED DRAG]', { actionType });
      return;
    }

    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (onToggleSelection) onToggleSelection(cell.id);
      return;
    }
    onSelectCell(cell.id);

    // If locked, do not allow drag, resize, or move transformations
    if (cell.locked) return;

    const currentSpec = cell.specOverride || defaultSpec;
    const isZoomed = (cell.zoom || 1) > 1.05;

    const el = cellRefs.current[cell.id];
    let cellW = 300;
    let cellH = 300;
    if (el) {
      const rect = el.getBoundingClientRect();
      cellW = rect.width;
      cellH = rect.height;
    }
    const asset = assets.find((a) => a.id === cell.assetId);

    // Priority logic:
    // When cell zoom > 1.05, dragging inside image operates IN-CELL PANNING
    // Otherwise, dragging operates CELL SWAPPING
    const effectiveActionType = (isZoomed && actionType === 'pan') ? 'in-cell-pan' : (actionType === 'pan' ? 'cell-swap' : actionType);

    if (effectiveActionType.startsWith('resize-') || effectiveActionType === 'move-grid') {
      window.__resizeMoveCounter = 0;
      onResizingOuterFrameChange?.(true);
    }

    setActiveAction({
      cellId: cell.id,
      type: effectiveActionType,
      startX: e.clientX,
      startY: e.clientY,
      cellW,
      cellH,
      asset,
      zoom: cell.zoom || 1,
      isDragging: false,
      initialPanX: cell.panX || 0,
      initialPanY: cell.panY || 0,
      currentPanX: cell.panX || 0,
      currentPanY: cell.panY || 0,
      initialSpec: { ...currentSpec },
      currentSpec: { ...currentSpec },
    });
  };

  // POINTER PINCH ZOOM HANDLERS
  const handlePointerDownCell = (e, cell, defaultSpec) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size >= 2) {
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);

      setActiveAction(null);
      setSwapTargetCellId(null);

      pinchStateRef.current = {
        active: true,
        cellId: cell.id,
        startDistance: dist,
        startZoom: cell.zoom || 1.0,
        currentZoom: cell.zoom || 1.0,
      };

      console.log('[PINCH START]', {
        pointerCount: activePointersRef.current.size,
        cellId: cell.id,
        distance: dist,
        zoom: cell.zoom || 1.0,
      });

      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePointerMoveCell = (e, cell) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pinchStateRef.current.active && activePointersRef.current.size >= 2 && pinchStateRef.current.cellId === cell.id) {
      e.preventDefault();
      e.stopPropagation();

      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const startDist = pinchStateRef.current.startDistance;

      if (!startDist || startDist <= 0) return;

      const scale = dist / startDist;
      const rawNextZoom = pinchStateRef.current.startZoom * scale;
      const nextZoom = Math.max(0.5, Math.min(5, Math.round(rawNextZoom * 100) / 100));

      pinchStateRef.current.currentZoom = nextZoom;

      console.log('[PINCH MOVE]', {
        pointerCount: activePointersRef.current.size,
        distance: dist,
        startDistance: startDist,
        zoom: nextZoom,
      });

      onUpdateCell(cell.id, { zoom: nextZoom });
    }
  };

  const handlePointerUpCell = (e, cell) => {
    activePointersRef.current.delete(e.pointerId);

    if (pinchStateRef.current.active && activePointersRef.current.size < 2) {
      const finalZoom = pinchStateRef.current.currentZoom;
      console.log('[PINCH END]', { cellId: cell.id, finalZoom });

      pinchStateRef.current.active = false;
      onCommitCell(cell.id, { zoom: finalZoom });

      setActiveAction(null);
      setSwapTargetCellId(null);
    }
  };

  // MOUSE DOWN ON SPLITTER BAR
  const handleMouseDownSplitter = (e, type) => {
    if (e.button !== 0 || cells.length < 2) return;
    e.stopPropagation();

    const spec0 = cells[0].specOverride || cellSpecs[0] || { x: 0, y: 0, width: 50, height: 100 };

    setActiveAction({
      type, // 'split-horizontal' | 'split-vertical'
      startX: e.clientX,
      startY: e.clientY,
      initialSplitX: spec0.width,
      initialSplitY: spec0.height,
    });
  };

  // Touch double-tap tracking ref
  const lastTapRef = useRef({});

  // DOUBLE-CLICK / DOUBLE-TAP: Reset Image View Transform
  const handleDoubleClickCell = (e, cell) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveAction(null);
    setSwapTargetCellId(null);
    if (onCommitCell) {
      onCommitCell(cell.id, {
        zoom: 1,
        panX: 0,
        panY: 0,
        rotation: 0,
        flipH: false,
        flipV: false,
      });
    }
  };

  const handleTouchStartCell = (e, cell) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[cell.id] || 0;
    if (now - lastTap < 300) {
      e.stopPropagation();
      handleDoubleClickCell(e, cell);
      lastTapRef.current[cell.id] = 0;
    } else {
      lastTapRef.current[cell.id] = now;
    }
  };

  // Mouse Wheel Zooming over cell
  const handleWheelZoom = (e, cell) => {
    e.stopPropagation();
    const currentZoom = cell.zoom || 1;
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const newZoom = Math.max(1, Math.min(3.5, parseFloat((currentZoom + delta).toFixed(2))));
    onCommitCell(cell.id, { zoom: newZoom });
  };

  // Determine split positions for 2-photo splitters
  const spec0 = cells[0] ? (cells[0].specOverride || { x: cells[0].x ?? 0, y: cells[0].y ?? 0, width: cells[0].width ?? 50, height: cells[0].height ?? 50 }) : null;
  const is2PhotoHorizontal = cells.length === 2 && (layoutId === 'side-by-side' || layoutId === 'asymmetric-70-30' || layoutId === '2x2-grid');
  const is2PhotoVertical = cells.length === 2 && (layoutId === 'vertical-split');

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{
        padding: `${padding}px`,
      }}
    >
      <div className="w-full h-full relative">
        {visibleCells.map((cell) => {
          const defaultSpec = {
            x: cell.x ?? 0,
            y: cell.y ?? 0,
            width: cell.width ?? 100,
            height: cell.height ?? 100,
          };
          const spec = cell.specOverride || defaultSpec;
          const asset = assets.find((a) => a.id === cell.assetId);
          const isSelected = selectedCellId === cell.id;
          const isHovered = hoveredCellId === cell.id;
          const isSwapTarget = swapTargetCellId === cell.id;
          const isBeingDragged = activeAction?.isDragging && activeAction?.cellId === cell.id;
          const isLocked = cell.locked === true;
          const halfGap = gap / 2;

          const filterCSS = getImageFilterStyle(cell);

          return (
            <div
              key={cell.id}
              data-testid={`image-cell-${cell.id}`}
              data-element-id={cell.id}
              ref={(el) => (cellRefs.current[cell.id] = el)}
              draggable={false}
              onDragOver={(e) => handleDragOver(e, cell.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, cell.id)}
              onWheel={(e) => handleWheelZoom(e, cell)}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                  if (onToggleSelection) onToggleSelection(cell.id);
                } else {
                  onSelectCell(cell.id);
                }
              }}
              onMouseDown={(e) => handleMouseDownCell(e, cell, defaultSpec, 'pan')}
              onPointerDown={(e) => handlePointerDownCell(e, cell, defaultSpec)}
              onPointerMove={(e) => handlePointerMoveCell(e, cell)}
              onPointerUp={(e) => handlePointerUpCell(e, cell)}
              onPointerCancel={(e) => handlePointerUpCell(e, cell)}
              onDoubleClick={(e) => handleDoubleClickCell(e, cell)}
              onTouchStart={(e) => handleTouchStartCell(e, cell)}
              className={`absolute group overflow-hidden ${
                isSelected && (cell.zoom || 1) > 1.05 ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'
              } ${
                isSwapTarget
                  ? 'ring-4 ring-amber-500 bg-amber-500/20 shadow-2xl z-30 scale-[1.02]'
                  : isBeingDragged
                  ? 'opacity-50 ring-2 ring-amber-400/80 z-10'
                  : isSelected
                  ? 'ring-3 ring-[#c25e40] z-20 shadow-lg'
                  : isHovered
                  ? 'ring-3 ring-amber-400 bg-amber-500/10 z-10'
                  : ''
              }`}
              style={{
                left: `calc(${spec.x}% + ${halfGap}px)`,
                top: `calc(${spec.y}% + ${halfGap}px)`,
                width: `calc(${spec.width}% - ${gap}px)`,
                height: `calc(${spec.height}% - ${gap}px)`,
                borderRadius: `${cell.borderRadius ?? cornerRadius}px`,
                boxShadow: cellShadow ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : 'none',
                backgroundColor: '#ffffff',
                opacity: isBeingDragged ? 0.5 : (cell.opacity ?? 1),
                mixBlendMode: cell.blendMode || 'normal',
                touchAction: 'none',
                transform: 'none',
                transition: 'none',
                animation: 'none',
              }}
            >
              {asset ? (
                <div
                  data-testid={`image-cell-content-${cell.id}`}
                  className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: 'none',
                    transition: 'none',
                    animation: 'none',
                  }}
                >
                  <img
                    data-testid={`image-element-${cell.id}`}
                    src={asset.url}
                    alt={asset.name}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{
                      transformOrigin: 'center center',
                      transform: getImageTransformStyle(cell),
                      filter: filterCSS,
                      transition: 'none',
                      animation: 'none',
                    }}
                  />

                  {/* Move Helper Indicator */}
                  {!isBeingDragged && !isSwapTarget && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-stone-900/80 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none flex items-center gap-1">
                      <Move className="w-3 h-3 text-amber-400" />
                      <span>Drag cell to Swap</span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  data-testid={`add-photo-placeholder-${cell.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCell(cell.id);
                    console.log('[EMPTY CELL CLICK]', { cellId: cell.id, layoutId: state.layoutId });
                    if (onAddPhotoClick) {
                      onAddPhotoClick(cell.id);
                    }
                  }}
                  className="w-full h-full flex flex-col items-center justify-center p-3 border-2 border-dashed border-stone-300/80 bg-stone-50/50 hover:bg-amber-50/60 hover:border-[#c25e40]/70 text-stone-500 hover:text-stone-800 transition-all cursor-pointer group pointer-events-auto"
                >
                  <div className="p-2.5 rounded-full bg-white shadow-sm border border-stone-200 group-hover:scale-110 transition-transform mb-1.5 pointer-events-none">
                    <ImagePlus className="w-4 h-4 text-[#c25e40]" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide text-stone-700 pointer-events-none">Add Photo</span>
                  <span className="text-[9px] text-stone-400 mt-0.5 pointer-events-none">Click or drag image</span>
                </div>
              )}

              {/* SWAP TARGET OVERLAY BADGE */}
              {isSwapTarget && (
                <div className="absolute inset-0 bg-amber-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-white pointer-events-none animate-in fade-in duration-150 z-40">
                  <div className="p-2.5 rounded-full bg-amber-500 text-white shadow-xl mb-1.5 animate-bounce">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold tracking-wide uppercase shadow-sm">
                    Swap Cell
                  </span>
                </div>
              )}

              {/* DYNAMIC GRID CELL RESIZING HANDLES (When Cell Selected & Not Locked & Not Dragging) */}
              {isSelected && !isLocked && !activeAction?.isDragging && (
                <>
                  {/* Bottom-Right Corner Handle */}
                  <div
                    onMouseDown={(e) => handleMouseDownCell(e, cell, defaultSpec, 'resize-corner')}
                    title="Drag to resize cell width & height"
                    className="absolute bottom-0 right-0 w-6 h-6 bg-[#c25e40] text-white flex items-center justify-center rounded-tl-xl shadow-md cursor-se-resize z-30 hover:scale-125 transition-transform"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </div>

                  {/* Right Edge Resize Bar */}
                  <div
                    onMouseDown={(e) => handleMouseDownCell(e, cell, defaultSpec, 'resize-right')}
                    title="Drag to adjust cell width"
                    className="absolute top-1/2 -translate-y-1/2 right-0 w-2.5 h-10 bg-[#c25e40]/80 hover:bg-[#c25e40] rounded-l-md cursor-e-resize z-30 transition-all"
                  />

                  {/* Bottom Edge Resize Bar */}
                  <div
                    onMouseDown={(e) => handleMouseDownCell(e, cell, defaultSpec, 'resize-bottom')}
                    title="Drag to adjust cell height"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2.5 w-10 bg-[#c25e40]/80 hover:bg-[#c25e40] rounded-t-md cursor-s-resize z-30 transition-all"
                  />

                  {/* Top-Left Move Cell Position Handle */}
                  <div
                    onMouseDown={(e) => handleMouseDownCell(e, cell, defaultSpec, 'move-grid')}
                    title="Drag to reposition this grid cell slot"
                    className="absolute top-0 left-0 px-2 py-1 bg-amber-700 text-white text-[10px] font-bold flex items-center gap-1 rounded-br-xl shadow-md cursor-move z-30 hover:bg-amber-800 transition-colors"
                  >
                    <Move className="w-3 h-3" />
                    <span>Cell</span>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* 2-PHOTO INTERACTIVE SPLITTER BAR */}
        {is2PhotoHorizontal && spec0 && (
          <div
            onMouseDown={(e) => handleMouseDownSplitter(e, 'split-horizontal')}
            title="Drag left/right to adjust 2-photo split ratio"
            className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-30 flex items-center justify-center group"
            style={{ left: `${spec0.width}%` }}
          >
            <div className="w-1.5 h-12 rounded-full bg-[#c25e40] group-hover:bg-amber-600 shadow-md transition-colors flex items-center justify-center">
              <SlidersHorizontal className="w-3 h-3 text-white rotate-90" />
            </div>
          </div>
        )}

        {is2PhotoVertical && spec0 && (
          <div
            onMouseDown={(e) => handleMouseDownSplitter(e, 'split-vertical')}
            title="Drag up/down to adjust 2-photo split ratio"
            className="absolute left-0 right-0 h-4 -mt-2 cursor-row-resize z-30 flex items-center justify-center group"
            style={{ top: `${spec0.height}%` }}
          >
            <div className="h-1.5 w-12 rounded-full bg-[#c25e40] group-hover:bg-amber-600 shadow-md transition-colors flex items-center justify-center">
              <SlidersHorizontal className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
