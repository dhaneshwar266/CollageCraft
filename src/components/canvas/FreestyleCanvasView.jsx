import React, { useState, useEffect, useRef } from 'react';
import { getImageFilterStyle, getImageTransformStyle, clampImagePan } from '../../utils/imageUtils';
import { RotateCw, Maximize2 } from 'lucide-react';
import { getElementBounds } from '../../utils/selectionGeometry';
import { getSnapTargets, calculateSnapDelta } from '../../utils/snapping';

export default function FreestyleCanvasView({
  state,
  document,
  containerRef,
  setSnapGuides,
  selectedCellId,
  onSelectCell,
  onToggleSelection,
  onUpdateCell,
  onCommitCell,
}) {
  const { cells, assets, frameSettings } = state;
  const { cornerRadius = 16, cellShadow = true } = frameSettings;

  const [dragState, setDragState] = useState(null);
  const snapStateRef = useRef({});

  // Escape key cancel during drag
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dragState) {
        if (setSnapGuides) setSnapGuides([]);
        snapStateRef.current = {};
        setDragState(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragState, setSnapGuides]);

  // Global window event listener when dragging in Freestyle mode
  useEffect(() => {
    if (!dragState) return;

    const handleWindowMouseMove = (e) => {
      const rect = containerRef?.current?.getBoundingClientRect();
      const vpZoom = 1;

      const screenDeltaX = e.clientX - dragState.startX;
      const screenDeltaY = e.clientY - dragState.startY;

      const canvasDeltaX = screenDeltaX / vpZoom;
      const canvasDeltaY = screenDeltaY / vpZoom;

      const canvasWidth = Math.max(50, (rect?.width || 800) / vpZoom);
      const canvasHeight = Math.max(50, (rect?.height || 600) / vpZoom);

      const rawDeltaX = (canvasDeltaX / canvasWidth) * 100;
      const rawDeltaY = (canvasDeltaY / canvasHeight) * 100;

      if (dragState.action === 'in-cell-pan') {
        const deltaX = Math.round(canvasDeltaX);
        const deltaY = Math.round(canvasDeltaY);

        const rawPanX = dragState.initialPanX + deltaX;
        const rawPanY = dragState.initialPanY + deltaY;

        const { panX: newPanX, panY: newPanY } = clampImagePan(
          rawPanX,
          rawPanY,
          dragState.cellW,
          dragState.cellH,
          dragState.zoom,
          dragState.asset
        );

        setDragState((prev) => (prev ? { ...prev, currentPanX: newPanX, currentPanY: newPanY } : null));
        onUpdateCell(dragState.cellId, { panX: newPanX, panY: newPanY });
      } else if (dragState.action === 'move') {
        const MIN_W = dragState.initialW || 35;
        const MIN_H = dragState.initialH || 35;
        const rawX = Math.max(0, Math.min(100 - MIN_W, dragState.initialX + rawDeltaX));
        const rawY = Math.max(0, Math.min(100 - MIN_H, dragState.initialY + rawDeltaY));

        const trialBounds = getElementBounds({
          type: 'image',
          freeX: rawX,
          freeY: rawY,
          freeW: dragState.initialW,
          freeH: dragState.initialH,
          rotation: dragState.initialRot,
        });

        const targets = getSnapTargets(document?.elements, [dragState.cellId], rect, document?.guides || []);
        const snapRes = calculateSnapDelta(trialBounds, targets, rect, snapStateRef.current);
        snapStateRef.current = snapRes.activeSnapState;
        if (setSnapGuides) setSnapGuides(snapRes.guides);

        const finalX = Math.max(0, Math.min(100 - MIN_W, rawX + snapRes.snapDeltaX));
        const finalY = Math.max(0, Math.min(100 - MIN_H, rawY + snapRes.snapDeltaY));

        setDragState((prev) => (prev ? { ...prev, currentX: finalX, currentY: finalY } : null));
        onUpdateCell(dragState.cellId, { freeX: finalX, freeY: finalY });
      } else if (dragState.action === 'resize') {
        if (setSnapGuides) setSnapGuides([]);
        const MIN_W = 5;
        const MIN_H = 5;
        const round2 = (val) => Math.round(val * 100) / 100;
        const newW = round2(Math.max(MIN_W, Math.min(100 - dragState.initialX, dragState.initialW + rawDeltaX)));
        const newH = round2(Math.max(MIN_H, Math.min(100 - dragState.initialY, dragState.initialH + rawDeltaY)));
        setDragState((prev) => (prev ? { ...prev, currentW: newW, currentH: newH } : null));
        onUpdateCell(dragState.cellId, { freeW: newW, freeH: newH });
      } else if (dragState.action === 'rotate') {
        if (setSnapGuides) setSnapGuides([]);
        const newRot = (dragState.initialRot + rawDeltaX * 2) % 360;
        setDragState((prev) => (prev ? { ...prev, currentRot: newRot } : null));
        onUpdateCell(dragState.cellId, { rotation: newRot });
      }
    };

    const handleWindowMouseUp = () => {
      if (dragState) {
        if (dragState.action === 'in-cell-pan') {
          onCommitCell(dragState.cellId, {
            panX: dragState.currentPanX ?? dragState.initialPanX,
            panY: dragState.currentPanY ?? dragState.initialPanY,
          });
        } else if (dragState.action === 'move') {
          onCommitCell(dragState.cellId, {
            freeX: dragState.currentX ?? dragState.initialX,
            freeY: dragState.currentY ?? dragState.initialY,
          });
        } else if (dragState.action === 'resize') {
          onCommitCell(dragState.cellId, {
            freeW: dragState.currentW ?? dragState.initialW,
            freeH: dragState.currentH ?? dragState.initialH,
          });
        } else if (dragState.action === 'rotate') {
          onCommitCell(dragState.cellId, {
            rotation: dragState.currentRot ?? dragState.initialRot,
          });
        }
        if (setSnapGuides) setSnapGuides([]);
        snapStateRef.current = {};
        setDragState(null);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, onUpdateCell, onCommitCell, containerRef, setSnapGuides, document, state]);

  const activePointersRef = useRef(new Map());
  const pinchStateRef = useRef({
    active: false,
    cellId: null,
    startDistance: 0,
    startZoom: 1,
    currentZoom: 1,
  });

  const handleMouseDownCard = (e, cell, action = 'move') => {
    if (activePointersRef.current.size >= 2 || pinchStateRef.current.active) {
      console.warn('[PINCH BLOCKED DRAG]', { action });
      return;
    }

    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (onToggleSelection) onToggleSelection(cell.id);
      return;
    }
    onSelectCell(cell.id);

    // If locked, block drag, resize, or rotate transformations
    if (cell.locked) return;

    const isZoomed = (cell.zoom || 1) > 1.05;
    const effectiveAction = (isZoomed && action === 'move') ? 'in-cell-pan' : action;

    const rect = containerRef?.current?.getBoundingClientRect();
    const cellW = (rect?.width || 800) * ((cell.freeW ?? 38) / 100);
    const cellH = (rect?.height || 600) * ((cell.freeH ?? 38) / 100);
    const asset = assets.find((a) => a.id === cell.assetId);

    setDragState({
      cellId: cell.id,
      action: effectiveAction, // 'move' | 'resize' | 'rotate' | 'in-cell-pan'
      startX: e.clientX,
      startY: e.clientY,
      cellW,
      cellH,
      asset,
      zoom: cell.zoom || 1,
      initialX: cell.freeX ?? 10,
      initialY: cell.freeY ?? 10,
      initialW: cell.freeW ?? 35,
      initialH: cell.freeH ?? 35,
      initialRot: cell.rotation || 0,
      initialPanX: cell.panX || 0,
      initialPanY: cell.panY || 0,
      currentPanX: cell.panX || 0,
      currentPanY: cell.panY || 0,
    });
  };

  // POINTER PINCH ZOOM HANDLERS FOR FREESTYLE
  const handlePointerDownCard = (e, cell) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size >= 2) {
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);

      setDragState(null);

      pinchStateRef.current = {
        active: true,
        cellId: cell.id,
        startDistance: dist,
        startZoom: cell.zoom || 1.0,
        currentZoom: cell.zoom || 1.0,
      };

      console.log('[PINCH START FREESTYLE]', {
        pointerCount: activePointersRef.current.size,
        cellId: cell.id,
        distance: dist,
        zoom: cell.zoom || 1.0,
      });

      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePointerMoveCard = (e, cell) => {
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

      console.log('[PINCH MOVE FREESTYLE]', {
        pointerCount: activePointersRef.current.size,
        distance: dist,
        startDistance: startDist,
        zoom: nextZoom,
      });

      onUpdateCell(cell.id, { zoom: nextZoom });
    }
  };

  const handlePointerUpCard = (e, cell) => {
    activePointersRef.current.delete(e.pointerId);

    if (pinchStateRef.current.active && activePointersRef.current.size < 2) {
      const finalZoom = pinchStateRef.current.currentZoom;
      console.log('[PINCH END FREESTYLE]', { cellId: cell.id, finalZoom });

      pinchStateRef.current.active = false;
      onCommitCell(cell.id, { zoom: finalZoom });
      setDragState(null);
    }
  };

  // Touch double-tap tracking ref
  const lastTapRef = useRef({});

  // DOUBLE-CLICK / DOUBLE-TAP: Reset Image View Transform
  const handleDoubleClickCard = (e, cell) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState(null);
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

  const handleTouchStartCard = (e, cell) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[cell.id] || 0;
    if (now - lastTap < 300) {
      e.stopPropagation();
      handleDoubleClickCard(e, cell);
      lastTapRef.current[cell.id] = 0;
    } else {
      lastTapRef.current[cell.id] = now;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {cells.map((cell, index) => {
        if (cell.visible === false) return null;
        const asset = assets.find((a) => a.id === cell.assetId);
        if (!asset) return null;

        const isSelected = selectedCellId === cell.id;
        const isZoomed = (cell.zoom || 1) > 1.05;
        const isSelectedAndZoomed = isSelected && isZoomed;
        const isLocked = cell.locked === true;
        const posX = cell.freeX ?? 10 + (index * 12) % 50;
        const posY = cell.freeY ?? 10 + (index * 12) % 50;
        const posW = cell.freeW ?? 38;
        const posH = cell.freeH ?? 38;
        const rot = cell.rotation ?? (index % 2 === 0 ? 1 : -1) * (index * 3 + 2);

        const filterCSS = getImageFilterStyle(cell);

        return (
          <div
            key={cell.id}
            data-testid={`image-cell-${cell.id}`}
            data-element-id={cell.id}
            onMouseDown={(e) => handleMouseDownCard(e, cell, 'move')}
            onPointerDown={(e) => handlePointerDownCard(e, cell)}
            onPointerMove={(e) => handlePointerMoveCard(e, cell)}
            onPointerUp={(e) => handlePointerUpCard(e, cell)}
            onPointerCancel={(e) => handlePointerUpCard(e, cell)}
            onDoubleClick={(e) => handleDoubleClickCard(e, cell)}
            onTouchStart={(e) => handleTouchStartCard(e, cell)}
            className={`absolute group select-none ${
              isLocked ? 'cursor-default' : isSelectedAndZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'
            } ${
              isSelected ? 'ring-4 ring-[#c25e40] z-30 shadow-xl' : 'hover:ring-2 hover:ring-amber-500 z-10'
            }`}
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              width: `${posW}%`,
              height: `${posH}%`,
              transform: `rotate(${rot}deg)`,
              borderRadius: `${cell.borderRadius ?? cornerRadius}px`,
              boxShadow: cellShadow ? '0 15px 35px rgba(0,0,0,0.3)' : 'none',
              opacity: cell.opacity ?? 1,
              backgroundColor: '#ffffff',
              touchAction: 'none',
              transition: 'none',
              animation: 'none',
            }}
          >
            <div
              data-testid={`image-cell-content-${cell.id}`}
              className="absolute inset-0 w-full h-full overflow-hidden rounded-[inherit] pointer-events-none"
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
                  filter: filterCSS,
                  transformOrigin: 'center center',
                  transform: getImageTransformStyle(cell),
                  transition: 'none',
                  animation: 'none',
                }}
              />
            </div>

            {/* Selection Controls overlay */}
            {isSelected && !isLocked && (
              <>
                {/* Rotate handle top right */}
                <button
                  onMouseDown={(e) => handleMouseDownCard(e, cell, 'rotate')}
                  className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#c25e40] text-white flex items-center justify-center shadow-lg hover:scale-110 cursor-alias z-40"
                  title="Drag to Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Resize handle bottom right */}
                <button
                  onMouseDown={(e) => handleMouseDownCard(e, cell, 'resize')}
                  className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-lg hover:scale-110 cursor-nwse-resize z-40"
                  title="Drag to Resize"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
