import React, { useState, useEffect } from 'react';

export default function PersistentGuides({
  guides = [],
  showGuides = true,
  canvasRect = null,
  onUpdateGuide,
  onRemoveGuide,
}) {
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [draggingGuide, setDraggingGuide] = useState(null); // { id, type, initialPos } | null

  // Deselect guide on click elsewhere or Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGuideId) {
        if (onRemoveGuide) onRemoveGuide(selectedGuideId);
        setSelectedGuideId(null);
      } else if (e.key === 'Escape') {
        setSelectedGuideId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGuideId, onRemoveGuide]);

  if (!showGuides || !guides || guides.length === 0) {
    return null;
  }

  const handleMouseDownGuide = (e, guide) => {
    e.stopPropagation();
    setSelectedGuideId(guide.id);

    if (!canvasRect || canvasRect.width === 0 || canvasRect.height === 0) return;

    const isH = guide.type === 'horizontal';
    const canvasLength = isH ? canvasRect.height : canvasRect.width;
    const canvasStart = isH ? canvasRect.top : canvasRect.left;

    let currentPct = guide.position;

    setDraggingGuide({
      id: guide.id,
      type: guide.type,
      currentPct,
    });

    const handleMouseMove = (moveEvent) => {
      const mousePx = isH ? moveEvent.clientY : moveEvent.clientX;
      const offsetPx = mousePx - canvasStart;
      currentPct = parseFloat(((offsetPx / canvasLength) * 100).toFixed(2));

      setDraggingGuide({
        id: guide.id,
        type: guide.type,
        currentPct,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (currentPct < -5 || currentPct > 105) {
        // Dragged off canvas -> Delete guide
        if (onRemoveGuide) onRemoveGuide(guide.id);
      } else if (onUpdateGuide) {
        onUpdateGuide(guide.id, { position: currentPct });
      }
      setDraggingGuide(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {guides.map((g) => {
        if (g.visible === false) return null;

        const isDragging = draggingGuide?.id === g.id;
        const posPct = isDragging ? draggingGuide.currentDocPct : g.position;
        const isSelected = selectedGuideId === g.id;

        if (g.type === 'horizontal') {
          return (
            <div
              key={g.id}
              onMouseDown={(e) => handleMouseDownGuide(e, g)}
              className={`absolute left-0 right-0 h-3 -translate-y-1/2 cursor-ns-resize group pointer-events-auto flex items-center justify-between transition-colors ${
                isSelected ? 'z-40' : 'z-30'
              }`}
              style={{ top: `${posPct}%` }}
              title={`Horizontal Guide Y: ${posPct}% (Drag off canvas to delete)`}
            >
              {/* Guide Line */}
              <div
                className={`w-full h-[1.5px] ${
                  isSelected
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] ring-1 ring-cyan-300'
                    : 'bg-cyan-500/80 hover:bg-cyan-400 hover:shadow-[0_0_6px_rgba(6,182,212,0.7)]'
                }`}
              />

              {/* Guide Position Tag */}
              <div
                className={`absolute left-2 -top-5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow pointer-events-none transition-opacity ${
                  isSelected || isDragging
                    ? 'opacity-100 bg-cyan-600'
                    : 'opacity-0 group-hover:opacity-100 bg-cyan-800/80'
                }`}
              >
                Y: {Math.round(posPct)}%
              </div>
            </div>
          );
        }

        if (g.type === 'vertical') {
          return (
            <div
              key={g.id}
              onMouseDown={(e) => handleMouseDownGuide(e, g)}
              className={`absolute top-0 bottom-0 w-3 -translate-x-1/2 cursor-ew-resize group pointer-events-auto flex flex-col justify-between transition-colors ${
                isSelected ? 'z-40' : 'z-30'
              }`}
              style={{ left: `${posPct}%` }}
              title={`Vertical Guide X: ${posPct}% (Drag off canvas to delete)`}
            >
              {/* Guide Line */}
              <div
                className={`h-full w-[1.5px] ${
                  isSelected
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] ring-1 ring-cyan-300'
                    : 'bg-cyan-500/80 hover:bg-cyan-400 hover:shadow-[0_0_6px_rgba(6,182,212,0.7)]'
                }`}
              />

              {/* Guide Position Tag */}
              <div
                className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow pointer-events-none transition-opacity ${
                  isSelected || isDragging
                    ? 'opacity-100 bg-cyan-600'
                    : 'opacity-0 group-hover:opacity-100 bg-cyan-800/80'
                }`}
              >
                X: {Math.round(posPct)}%
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
