import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Move, Crop, RotateCcw, Target } from 'lucide-react';
import { CROP_ASPECT_RATIOS } from '../../utils/imageUtils';

export default function CropModal({ isOpen, onClose, cell, asset, onCommitCell }) {
  if (!isOpen || !cell || !asset) return null;

  // Store pre-crop snapshot for cancel restoration
  const initialSnapshotRef = useRef({
    crop: cell.crop ? { ...cell.crop } : { enabled: false, x: 0, y: 0, width: 100, height: 100, aspectRatio: null, rotation: 0 },
    focalPoint: cell.focalPoint ? { ...cell.focalPoint } : { x: 50, y: 50 },
    zoom: cell.zoom || 1,
    panX: cell.panX || 0,
    panY: cell.panY || 0,
    rotation: cell.rotation || 0,
  });

  const [selectedRatio, setSelectedRatio] = useState(cell.crop?.aspectRatio || 'free');

  // Normalized crop rectangle percentages (0-100)
  const [cropRect, setCropRect] = useState(
    cell.crop?.enabled
      ? { x: cell.crop.x, y: cell.crop.y, width: cell.crop.width, height: cell.crop.height }
      : { x: 5, y: 5, width: 90, height: 90 }
  );

  const [focalPoint, setFocalPoint] = useState(cell.focalPoint || { x: 50, y: 50 });
  const [zoom, setZoom] = useState(cell.zoom || 1);
  const [panX, setPanX] = useState(cell.panX || 0);
  const [panY, setPanY] = useState(cell.panY || 0);
  const [rotation, setRotation] = useState(cell.rotation || 0);

  const [activeHandle, setActiveHandle] = useState(null); // 'move-image' | 'focal' | handle corner/edge
  const [dragStart, setDragStart] = useState(null);

  const containerRef = useRef(null);

  // Apply Aspect Ratio presets to crop bounds
  const handleRatioSelect = (aspectId) => {
    setSelectedRatio(aspectId);
    if (aspectId === 'free') return;

    let targetRatioVal = null;
    if (aspectId === 'original') {
      targetRatioVal = (containerRef.current?.clientWidth || 100) / (containerRef.current?.clientHeight || 100);
    } else {
      const spec = CROP_ASPECT_RATIOS.find((r) => r.id === aspectId);
      targetRatioVal = spec?.ratio;
    }

    if (!targetRatioVal) return;

    // Center aspect box inside 90x90 canvas area
    let w = 80;
    let h = 80;
    if (targetRatioVal >= 1) {
      h = Math.min(80, 80 / targetRatioVal);
    } else {
      w = Math.min(80, 80 * targetRatioVal);
    }

    const x = (100 - w) / 2;
    const y = (100 - h) / 2;

    setCropRect({ x: Math.max(0, x), y: Math.max(0, y), width: Math.min(100, w), height: Math.min(100, h) });
  };

  const handleMouseDown = (e, handleType = 'move-image') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setActiveHandle(handleType);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      initialPanX: panX,
      initialPanY: panY,
      initialCrop: { ...cropRect },
      initialFocal: { ...focalPoint },
    });
  };

  const handleMouseMove = (e) => {
    if (!activeHandle || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.clientX;
    const deltaY = e.clientY - dragStart.clientY;
    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;

    if (activeHandle === 'move-image') {
      setPanX(dragStart.initialPanX + deltaX);
      setPanY(dragStart.initialPanY + deltaY);
    } else if (activeHandle === 'focal') {
      const fx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const fy = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setFocalPoint({ x: Math.round(fx), y: Math.round(fy) });
    } else if (activeHandle.startsWith('handle-')) {
      let { x, y, width, height } = dragStart.initialCrop;

      if (activeHandle.includes('e')) width = Math.max(10, Math.min(100 - x, width + deltaPercentX));
      if (activeHandle.includes('s')) height = Math.max(10, Math.min(100 - y, height + deltaPercentY));
      if (activeHandle.includes('w')) {
        const newX = Math.max(0, Math.min(x + width - 10, x + deltaPercentX));
        width = width + (x - newX);
        x = newX;
      }
      if (activeHandle.includes('n')) {
        const newY = Math.max(0, Math.min(y + height - 10, y + deltaPercentY));
        height = height + (y - newY);
        y = newY;
      }

      setCropRect({ x, y, width, height });
    }
  };

  const handleMouseUp = () => {
    setActiveHandle(null);
    setDragStart(null);
  };

  const handleApply = () => {
    onCommitCell(cell.id, {
      crop: {
        enabled: true,
        x: Math.round(cropRect.x),
        y: Math.round(cropRect.y),
        width: Math.round(cropRect.width),
        height: Math.round(cropRect.height),
        aspectRatio: selectedRatio,
        rotation: 0,
      },
      focalPoint,
      zoom,
      panX,
      panY,
      rotation,
    });
    onClose();
  };

  const handleResetCrop = () => {
    setSelectedRatio('free');
    setCropRect({ x: 0, y: 0, width: 100, height: 100 });
    setFocalPoint({ x: 50, y: 50 });
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Crop className="w-5 h-5 text-[#c25e40]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-serif">Crop & Position Photo</h3>
              <p className="text-xs text-stone-500">Non-destructive aspect crop, focal point, zoom, and pan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Presets Bar */}
        <div className="px-6 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-stone-600 mr-1 shrink-0">Ratio:</span>
          {CROP_ASPECT_RATIOS.map((aspect) => (
            <button
              key={aspect.id}
              onClick={() => handleRatioSelect(aspect.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                selectedRatio === aspect.id
                  ? 'bg-[#c25e40] text-white shadow-2xs'
                  : 'bg-white border border-stone-200 hover:bg-stone-100 text-stone-700'
              }`}
            >
              {aspect.label}
            </button>
          ))}
        </div>

        {/* Interactive Crop Canvas Viewport */}
        <div
          ref={containerRef}
          onMouseDown={(e) => handleMouseDown(e, 'move-image')}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative w-full h-80 bg-stone-950 overflow-hidden flex items-center justify-center cursor-move select-none"
        >
          {/* Base Image */}
          <img
            src={asset.url}
            alt={asset.name}
            draggable={false}
            className="max-w-none transition-transform duration-75 pointer-events-none"
            style={{
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px) rotate(${rotation}deg)`,
            }}
          />

          {/* Focal Point Indicator */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'focal')}
            title="Drag focal point target"
            className="absolute w-6 h-6 -ml-3 -mt-3 border-2 border-amber-400 rounded-full bg-amber-400/30 flex items-center justify-center cursor-grab active:cursor-grabbing z-30 shadow-md"
            style={{
              left: `${focalPoint.x}%`,
              top: `${focalPoint.y}%`,
            }}
          >
            <Target className="w-3.5 h-3.5 text-amber-900" />
          </div>

          {/* Crop Boundary Box Overlay */}
          <div
            className="absolute border-2 border-amber-400 bg-amber-400/10 shadow-2xl z-20 pointer-events-none"
            style={{
              left: `${cropRect.x}%`,
              top: `${cropRect.y}%`,
              width: `${cropRect.width}%`,
              height: `${cropRect.height}%`,
            }}
          >
            {/* Rule of thirds grid */}
            <div className="w-full h-full border border-white/30 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Corner Resize Handles */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'handle-nw')}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-stone-900 rounded-full cursor-nwse-resize pointer-events-auto"
            />
            <div
              onMouseDown={(e) => handleMouseDown(e, 'handle-ne')}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-stone-900 rounded-full cursor-nesw-resize pointer-events-auto"
            />
            <div
              onMouseDown={(e) => handleMouseDown(e, 'handle-sw')}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-stone-900 rounded-full cursor-nesw-resize pointer-events-auto"
            />
            <div
              onMouseDown={(e) => handleMouseDown(e, 'handle-se')}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-stone-900 rounded-full cursor-nwse-resize pointer-events-auto"
            />
          </div>

          <div className="absolute bottom-3 left-3 bg-stone-900/80 px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-sm z-30">
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span>Drag image to pan or drag corner handles to adjust crop box</span>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-5 space-y-4 bg-stone-50 border-t border-stone-200">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-700 w-16">Zoom</span>
            <ZoomOut className="w-4 h-4 text-stone-400" />
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-stone-400" />
            <span className="font-mono text-xs text-[#c25e40] font-bold w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotate & Reset Controls */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 font-semibold hover:bg-stone-100 flex items-center gap-1.5 shadow-2xs"
              >
                <RotateCw className="w-3.5 h-3.5 text-stone-600" />
                <span>Rotate 90°</span>
              </button>
              <button
                onClick={() => setFocalPoint({ x: 50, y: 50 })}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 font-semibold hover:bg-stone-100 flex items-center gap-1.5 shadow-2xs"
              >
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset Focal</span>
              </button>
            </div>

            <button
              onClick={handleResetCrop}
              className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Crop</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-[#c25e40] hover:bg-[#a84d32] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
