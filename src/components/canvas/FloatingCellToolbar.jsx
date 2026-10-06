import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  X,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Move,
  RefreshCw,
  Trash2,
  Crop,
  Lock,
  Scaling
} from 'lucide-react';
import { FILTER_PRESETS } from '../../utils/filterPresets';

export default function FloatingCellToolbar({
  cell,
  asset,
  onUpdateCell,
  onCommitCell,
  onClose,
  onReplaceAsset,
  onRemoveCellAsset,
  onOpenCropModal,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef(null);

  if (!cell || !asset) return null;

  if (cell.locked) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-50/95 border border-amber-300 rounded-2xl shadow-xl backdrop-blur-xl p-3 text-stone-900 flex items-center justify-between gap-4 min-w-[360px] animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
          <div className="p-1.5 rounded-lg bg-amber-200/80 text-amber-900">
            <Lock className="w-4 h-4" />
          </div>
          <span>Layer is locked. Unlock in the Layers panel to edit.</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-200/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleZoomChange = (newZoom) => {
    onCommitCell(cell.id, { zoom: parseFloat(newZoom) });
  };

  const handleRotate = () => {
    const nextRot = ((cell.rotation || 0) + 90) % 360;
    onCommitCell(cell.id, { rotation: nextRot });
  };

  const handleFlipH = () => {
    onCommitCell(cell.id, { flipH: !cell.flipH });
  };

  const handleFlipV = () => {
    onCommitCell(cell.id, { flipV: !cell.flipV });
  };

  const handleFilterSelect = (presetId) => {
    onCommitCell(cell.id, { filterPreset: presetId });
  };

  const handleNudge = (direction) => {
    const step = 20;
    let newX = cell.panX || 0;
    let newY = cell.panY || 0;

    if (direction === 'up') newY -= step;
    if (direction === 'down') newY += step;
    if (direction === 'left') newX -= step;
    if (direction === 'right') newX += step;
    if (direction === 'center') {
      newX = 0;
      newY = 0;
    }

    onCommitCell(cell.id, { panX: newX, panY: newY });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        if (onReplaceAsset) {
          onReplaceAsset(cell.id, {
            id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            url: dataUrl,
            width: img.naturalWidth || img.width || 800,
            height: img.naturalHeight || img.height || 800,
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 border border-stone-200/90 rounded-2xl shadow-xl backdrop-blur-xl p-3 text-stone-900 flex flex-col gap-2.5 min-w-[400px] max-w-[540px] animate-in fade-in slide-in-from-top-2 duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Controls Row */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
        <span className="text-xs font-bold text-stone-800 truncate max-w-[110px] pl-1">
          {asset.name}
        </span>

        <div className="flex items-center gap-1">
          {/* Crop Modal Button */}
          
          {/* Fit / Fill Mode Toggle */}
          <button
            onClick={() => {
              const nextFit = cell.objectFit === "contain" ? "cover" : "contain";
              onCommitCell(cell.id, { objectFit: nextFit, zoom: 1, panX: 0, panY: 0 });
            }}
            title={cell.objectFit === "contain" ? "Switch to Fill Cell (Crop to Fit)" : "Switch to Fit Original (Full Photo)"}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              cell.objectFit === "contain"
                ? "bg-[#c25e40] text-white shadow-xs"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            <Scaling className="w-3.5 h-3.5" />
            <span>{cell.objectFit === "contain" ? "Fit (Full)" : "Fill (Crop)"}</span>
          </button>


          {onOpenCropModal && (
            <button
              onClick={() => onOpenCropModal(cell, asset)}
              title="Crop & Frame Photo"
              className="px-2 py-1 rounded-lg bg-[#c25e40] text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-all hover:bg-[#a84d32]"
            >
              <Crop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Crop</span>
            </button>
          )}

          {/* Replace Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Replace Photo"
            className="px-2 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-100 text-amber-900 border border-amber-300/60 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Replace</span>
          </button>

          {/* Filter Preset Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              showFilters
                ? 'bg-stone-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Filters</span>
          </button>

          {/* Rotate 90° */}
          <button
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Flip H */}
          <button
            onClick={handleFlipH}
            title="Flip Horizontal"
            className={`p-1.5 rounded-lg transition-colors ${
              cell.flipH ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Flip V */}
          <button
            onClick={handleFlipV}
            title="Flip Vertical"
            className={`p-1.5 rounded-lg transition-colors ${
              cell.flipV ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <FlipVertical className="w-4 h-4" />
          </button>

          {/* Delete Photo */}
          {onRemoveCellAsset && (
            <button
              onClick={() => onRemoveCellAsset(asset.id)}
              title="Remove Photo"
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="w-[1px] h-4 bg-stone-200 mx-1" />

          {/* Close Toolbar */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Up, Down, Left, Right Arrow Nudge Controls */}
      <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs">
        <div className="flex items-center gap-1.5 text-stone-600 font-semibold text-[11px]">
          <Move className="w-3.5 h-3.5 text-[#c25e40]" />
          <span>Move Image:</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleNudge('left')}
            title="Move Left"
            className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleNudge('up')}
            title="Move Up"
            className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 shadow-2xs"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleNudge('down')}
            title="Move Down"
            className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 shadow-2xs"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleNudge('right')}
            title="Move Right"
            className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 shadow-2xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleNudge('center')}
            title="Reset Position (Center)"
            className="px-2 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold transition-colors ml-1 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3 text-stone-600" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Zoom / Fit-Fill Slider */}
      <div className="flex items-center gap-3 px-1 text-xs">
        <ZoomOut className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <input
          type="range"
          min="0.2"
          max="3.5"
          step="0.05"
          value={cell.zoom || 1}
          onChange={(e) => handleZoomChange(e.target.value)}
          className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
        />
        <ZoomIn className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="font-mono text-[11px] text-[#c25e40] min-w-[35px] text-right font-bold">
          {Math.round((cell.zoom || 1) * 100)}%
        </span>
      </div>

      {/* Extended Filters Panel */}
      {showFilters && (
        <div className="border-t border-stone-200/80 pt-2.5 space-y-3">
          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleFilterSelect(preset.id)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                  cell.filterPreset === preset.id
                    ? 'bg-[#c25e40] text-white ring-1 ring-[#c25e40]'
                    : 'bg-stone-100 text-stone-700 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Brightness & Contrast Sliders */}
          <div className="space-y-2 pt-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-16 text-stone-600">Brightness</span>
              <input
                type="range"
                min="50"
                max="150"
                value={cell.brightness || 100}
                onChange={(e) =>
                  onCommitCell(cell.id, { brightness: parseInt(e.target.value, 10) })
                }
                className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-stone-600">{cell.brightness || 100}%</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-16 text-stone-600">Contrast</span>
              <input
                type="range"
                min="50"
                max="150"
                value={cell.contrast || 100}
                onChange={(e) =>
                  onCommitCell(cell.id, { contrast: parseInt(e.target.value, 10) })
                }
                className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-stone-600">{cell.contrast || 100}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
