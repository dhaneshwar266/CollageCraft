import React, { useState, useRef } from 'react';
import {
  Crop,
  Sliders,
  Sparkles,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Eye,
  RotateCcw as ResetIcon,
  X,
  RefreshCw,
  Trash2,
  Lock,
  Layers,
  Move,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Check,
  Scaling,
} from 'lucide-react';
import {
  EXTENDED_FILTER_PRESETS,
  BLEND_MODES,
  getImageFilterStyle,
  getMultiImageCommonValue,
  getResetImageAdjustmentsState,
  getResetImageCropState,
  getResetImageFiltersState,
  getResetImageTransformState,
  getResetAllImagePropertiesState,
} from '../../utils/imageUtils';

export default function ImageEditingToolbar({
  selectedElements = [],
  primaryElement,
  assetMap = {},
  onLiveUpdate,
  onCommitChange,
  onClose,
  onOpenCropModal,
  onReplaceAsset,
  onRemoveAsset,
}) {
  const [activeTab, setActiveTab] = useState(null); // 'adjust' | 'filters' | 'effects' | 'transform' | 'blend' | 'reset'
  const [isBeforeAfterActive, setIsBeforeAfterActive] = useState(false);
  const fileInputRef = useRef(null);

  const imageElements = selectedElements.filter((el) => el?.type === 'image');
  const isMulti = imageElements.length > 1;
  const targetElement = primaryElement?.type === 'image' ? primaryElement : imageElements[0];

  if (!targetElement && imageElements.length === 0) return null;

  const currentAsset = assetMap[targetElement?.assetId] || { name: 'Photo' };

  // Handle locked element warning
  if (targetElement?.locked) {
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

  // Helper for applying change to single or multiple image elements
  const applyLiveChange = (updates) => {
    if (isMulti) {
      const liveMap = {};
      imageElements.forEach((el) => {
        liveMap[el.id] = { ...updates };
      });
      if (onLiveUpdate) onLiveUpdate(liveMap);
    } else if (targetElement) {
      if (onLiveUpdate) onLiveUpdate({ [targetElement.id]: updates });
    }
  };

  const applyCommitChange = (updates) => {
    if (isMulti) {
      const commitMap = {};
      imageElements.forEach((el) => {
        commitMap[el.id] = { ...updates };
      });
      if (onCommitChange) onCommitChange(commitMap);
    } else if (targetElement) {
      if (onCommitChange) onCommitChange({ [targetElement.id]: updates });
    }
  };

  // Rotation controls
  const handleRotateRight = () => {
    const nextRot = ((targetElement.rotation || 0) + 90) % 360;
    applyCommitChange({ rotation: nextRot });
  };

  const handleRotateLeft = () => {
    const nextRot = ((targetElement.rotation || 0) - 90 + 360) % 360;
    applyCommitChange({ rotation: nextRot });
  };

  // Flip controls
  const handleFlipH = () => {
    applyCommitChange({ flipH: !targetElement.flipH });
  };

  const handleFlipV = () => {
    applyCommitChange({ flipV: !targetElement.flipV });
  };

  // Filter selection
  const handleSelectFilter = (presetId) => {
    applyCommitChange({ filterPreset: presetId });
  };

  // Nudge pan inside frame
  const handleNudge = (direction) => {
    const step = 20;
    let newX = targetElement.panX || 0;
    let newY = targetElement.panY || 0;

    if (direction === 'up') newY -= step;
    if (direction === 'down') newY += step;
    if (direction === 'left') newX -= step;
    if (direction === 'right') newX += step;
    if (direction === 'center') {
      newX = 0;
      newY = 0;
    }

    applyCommitChange({ panX: newX, panY: newY });
  };

  // File replacement
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        if (onReplaceAsset && targetElement) {
          onReplaceAsset(targetElement.id, {
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

  // Values display
  const getVal = (key, defaultVal) => {
    return isMulti ? getMultiImageCommonValue(imageElements, key, defaultVal) : (targetElement[key] ?? defaultVal);
  };

  return (
    <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 md:relative md:top-0 md:left-0 md:translate-x-0 md:z-30 md:w-full md:max-w-none md:rounded-none md:border-x-0 md:border-t-0 md:border-b md:border-stone-200/80 md:bg-white/95 md:shadow-xs md:p-2.5 md:shrink-0 md:max-h-none bg-white/95 border border-stone-200/90 rounded-2xl shadow-xl backdrop-blur-xl p-2 sm:p-2.5 text-stone-900 flex flex-col gap-2 w-[calc(100vw-16px)] max-w-[620px] sm:w-auto sm:min-w-[420px] animate-in fade-in slide-in-from-top-2 duration-200 select-none max-h-[85vh] overflow-y-auto pt-[env(safe-area-inset-top,0px)] ImageEditingToolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Toolbar Buttons Row */}
      <div className="flex items-center justify-between gap-1 border-b border-stone-200/80 pb-2">
        <span className="text-xs font-bold text-stone-800 truncate max-w-[80px] xs:max-w-[120px] pl-1 shrink-0" title={currentAsset.name}>
          {isMulti ? `${imageElements.length} Photos` : currentAsset.name}
        </span>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {/* Crop Button (Single image only) */}
          {!isMulti && onOpenCropModal && (
            <button
              onClick={() => onOpenCropModal(targetElement, currentAsset)}
              title="Crop & Frame Photo"
              className="px-2.5 py-1.5 rounded-xl bg-[#c25e40] text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-all hover:bg-[#a84d32]"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Crop</span>
            </button>
          )}

          {/* Adjustments Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'adjust' ? null : 'adjust')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'adjust' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Adjust</span>
          </button>

          {/* Filters Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'filters' ? null : 'filters')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'filters' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Filters</span>
          </button>

          {/* Effects Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'effects' ? null : 'effects')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'effects' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Effects</span>
          </button>

          {/* Transform Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'transform' ? null : 'transform')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'transform' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Transform</span>
          </button>

          {/* Blend & Opacity Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'blend' ? null : 'blend')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'blend' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Blend</span>
          </button>

          {/* Reset Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'reset' ? null : 'reset')}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'reset' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
            title="Reset Controls"
          >
            <ResetIcon className="w-3.5 h-3.5 text-stone-500" />
          </button>

          {/* Before/After Preview Button */}
          <button
            onMouseDown={() => {
              setIsBeforeAfterActive(true);
              applyLiveChange(getResetAllImagePropertiesState(targetElement));
            }}
            onMouseUp={() => {
              setIsBeforeAfterActive(false);
              applyLiveChange({});
            }}
            onMouseLeave={() => {
              if (isBeforeAfterActive) {
                setIsBeforeAfterActive(false);
                applyLiveChange({});
              }
            }}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              isBeforeAfterActive ? 'bg-amber-500 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
            title="Hold to view original image"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Replace Photo */}
          {!isMulti && (
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Replace Photo"
              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            </button>
          )}

          {/* Delete Photo */}
          {onRemoveAsset && !isMulti && (
            <button
              onClick={() => onRemoveAsset(currentAsset.id)}
              title="Remove Photo"
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />

          {/* Close Toolbar */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* EXPANDABLE TAB: Adjustments */}
      {activeTab === 'adjust' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {/* Brightness */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Brightness</span>
              <input
                type="range"
                min="0"
                max="200"
                value={getVal('brightness', 100) === 'Mixed' ? 100 : getVal('brightness', 100)}
                onChange={(e) => applyLiveChange({ brightness: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ brightness: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('brightness', 100) === 'Mixed' ? 'Mixed' : `${getVal('brightness', 100) - 100}`}
              </span>
            </div>

            {/* Contrast */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Contrast</span>
              <input
                type="range"
                min="0"
                max="200"
                value={getVal('contrast', 100) === 'Mixed' ? 100 : getVal('contrast', 100)}
                onChange={(e) => applyLiveChange({ contrast: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ contrast: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('contrast', 100) === 'Mixed' ? 'Mixed' : `${getVal('contrast', 100) - 100}`}
              </span>
            </div>

            {/* Saturation */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Saturation</span>
              <input
                type="range"
                min="0"
                max="200"
                value={getVal('saturation', 100) === 'Mixed' ? 100 : getVal('saturation', 100)}
                onChange={(e) => applyLiveChange({ saturation: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ saturation: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('saturation', 100) === 'Mixed' ? 'Mixed' : `${getVal('saturation', 100) - 100}`}
              </span>
            </div>

            {/* Exposure */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Exposure</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={getVal('exposure', 0) === 'Mixed' ? 0 : getVal('exposure', 0)}
                onChange={(e) => applyLiveChange({ exposure: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ exposure: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('exposure', 0) === 'Mixed' ? 'Mixed' : getVal('exposure', 0)}
              </span>
            </div>

            {/* Highlights */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Highlights</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={getVal('highlights', 0) === 'Mixed' ? 0 : getVal('highlights', 0)}
                onChange={(e) => applyLiveChange({ highlights: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ highlights: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('highlights', 0) === 'Mixed' ? 'Mixed' : getVal('highlights', 0)}
              </span>
            </div>

            {/* Shadows */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Shadows</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={getVal('shadows', 0) === 'Mixed' ? 0 : getVal('shadows', 0)}
                onChange={(e) => applyLiveChange({ shadows: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ shadows: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('shadows', 0) === 'Mixed' ? 'Mixed' : getVal('shadows', 0)}
              </span>
            </div>

            {/* Temperature */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Temperature</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={getVal('temperature', 0) === 'Mixed' ? 0 : getVal('temperature', 0)}
                onChange={(e) => applyLiveChange({ temperature: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ temperature: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('temperature', 0) === 'Mixed' ? 'Mixed' : getVal('temperature', 0)}
              </span>
            </div>

            {/* Tint */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Tint</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={getVal('tint', 0) === 'Mixed' ? 0 : getVal('tint', 0)}
                onChange={(e) => applyLiveChange({ tint: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ tint: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('tint', 0) === 'Mixed' ? 'Mixed' : getVal('tint', 0)}
              </span>
            </div>

            {/* Hue */}
            <div className="flex items-center gap-2 col-span-2">
              <span className="w-20 text-stone-600 font-medium">Hue</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={getVal('hue', 0) === 'Mixed' ? 0 : getVal('hue', 0)}
                onChange={(e) => applyLiveChange({ hue: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ hue: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('hue', 0) === 'Mixed' ? 'Mixed' : `${getVal('hue', 0)}°`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDABLE TAB: Filters */}
      {activeTab === 'filters' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 animate-in fade-in duration-150">
          <div className="grid grid-cols-4 gap-2">
            {EXTENDED_FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectFilter(preset.id)}
                className={`p-2 rounded-xl text-center text-xs font-semibold transition-all border ${
                  getVal('filterPreset', 'original') === preset.id
                    ? 'bg-[#c25e40] text-white border-[#c25e40] shadow-xs'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-800'
                }`}
              >
                <div className="text-[11px] truncate">{preset.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EXPANDABLE TAB: Effects (Blur, Sharpness, Vignette, Radius) */}
      {activeTab === 'effects' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {/* Blur */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Blur</span>
              <input
                type="range"
                min="0"
                max="100"
                value={getVal('blur', 0) === 'Mixed' ? 0 : getVal('blur', 0)}
                onChange={(e) => applyLiveChange({ blur: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ blur: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('blur', 0) === 'Mixed' ? 'Mixed' : `${getVal('blur', 0)}%`}
              </span>
            </div>

            {/* Sharpness */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Sharpness</span>
              <input
                type="range"
                min="0"
                max="100"
                value={getVal('sharpness', 0) === 'Mixed' ? 0 : getVal('sharpness', 0)}
                onChange={(e) => applyLiveChange({ sharpness: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ sharpness: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('sharpness', 0) === 'Mixed' ? 'Mixed' : `${getVal('sharpness', 0)}%`}
              </span>
            </div>

            {/* Vignette */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Vignette</span>
              <input
                type="range"
                min="0"
                max="100"
                value={getVal('vignette', 0) === 'Mixed' ? 0 : getVal('vignette', 0)}
                onChange={(e) => applyLiveChange({ vignette: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ vignette: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('vignette', 0) === 'Mixed' ? 'Mixed' : `${getVal('vignette', 0)}%`}
              </span>
            </div>

            {/* Border Radius */}
            <div className="flex items-center gap-2">
              <span className="w-20 text-stone-600 font-medium">Radius</span>
              <input
                type="range"
                min="0"
                max="50"
                value={getVal('borderRadius', 0) === 'Mixed' ? 0 : getVal('borderRadius', 0)}
                onChange={(e) => applyLiveChange({ borderRadius: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ borderRadius: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('borderRadius', 0) === 'Mixed' ? 'Mixed' : `${getVal('borderRadius', 0)}px`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDABLE TAB: Transform (Rotate, Flip, Image Zoom, Internal Pan) */}
      {activeTab === 'transform' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-3.5 text-xs animate-in fade-in duration-150">
          {/* Fit / Fill Mode Toggle */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-100">
            <span className="text-stone-600 font-medium">Image Fit Mode</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  applyLiveChange({ objectFit: "contain", zoom: 1, panX: 0, panY: 0 });
                  applyCommitChange({ objectFit: "contain", zoom: 1, panX: 0, panY: 0 });
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                  getVal("objectFit", "cover") === "contain"
                    ? "bg-[#c25e40] text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <Scaling className="w-3.5 h-3.5" />
                <span>Fit (Full Photo)</span>
              </button>
              <button
                onClick={() => {
                  applyLiveChange({ objectFit: "cover", zoom: 1, panX: 0, panY: 0 });
                  applyCommitChange({ objectFit: "cover", zoom: 1, panX: 0, panY: 0 });
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                  getVal("objectFit", "cover") === "cover"
                    ? "bg-[#c25e40] text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <span>Fill (Crop to Cell)</span>
              </button>
            </div>
          </div>

          {/* Rotate & Flip controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRotateLeft}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-1"
                title="Rotate 90° Left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                <span>-90°</span>
              </button>
              <button
                onClick={handleRotateRight}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-1"
                title="Rotate 90° Right"
              >
                <RotateCw className="w-3.5 h-3.5 text-stone-600" />
                <span>+90°</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleFlipH}
                className={`p-1.5 rounded-xl transition-all ${
                  targetElement.flipH ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={handleFlipV}
                className={`p-1.5 rounded-xl transition-all ${
                  targetElement.flipV ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Internal Content Zoom */}
          <div className="flex items-center gap-3">
            <span className="w-20 text-stone-600 font-medium">Image Zoom</span>
            <ZoomOut className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="range"
              min="0.2"
              max="5"
              step="0.05"
              value={getVal('zoom', 1) === 'Mixed' ? 1 : getVal('zoom', 1)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                applyLiveChange({ zoom: val });
                applyCommitChange({ zoom: val });
              }}
              onPointerUp={(e) => {
                const val = parseFloat(e.target.value);
                applyCommitChange({ zoom: val });
              }}
              onKeyUp={(e) => {
                const val = parseFloat(e.target.value);
                applyCommitChange({ zoom: val });
              }}
              className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono text-[11px] text-[#c25e40] w-12 text-right font-bold">
              {getVal('zoom', 1) === 'Mixed' ? 'Mixed' : `${Math.round(getVal('zoom', 1) * 100)}%`}
            </span>
          </div>

          {/* Internal Nudge Pan */}
          {!isMulti && (
            <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-2">
              <div className="flex items-center gap-1.5 text-stone-600 font-semibold text-[11px]">
                <Move className="w-3.5 h-3.5 text-[#c25e40]" />
                <span>Pan inside box:</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleNudge('left')}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-[11px]"
                >
                  ←
                </button>
                <button
                  onClick={() => handleNudge('up')}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-[11px]"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleNudge('down')}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-[11px]"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleNudge('right')}
                  className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-[11px]"
                >
                  →
                </button>
                <button
                  onClick={() => handleNudge('center')}
                  className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold ml-1"
                >
                  Center
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXPANDABLE TAB: Blend & Opacity */}
      {activeTab === 'blend' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-4">
            {/* Opacity */}
            <div className="flex items-center gap-2">
              <span className="w-16 text-stone-600 font-medium">Opacity</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={getVal('opacity', 1) === 'Mixed' ? 1 : getVal('opacity', 1)}
                onChange={(e) => applyLiveChange({ opacity: parseFloat(e.target.value) })}
                onMouseUp={(e) => applyCommitChange({ opacity: parseFloat(e.target.value) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-10 text-right">
                {getVal('opacity', 1) === 'Mixed' ? 'Mixed' : `${Math.round(getVal('opacity', 1) * 100)}%`}
              </span>
            </div>

            {/* Blend Mode */}
            <div className="flex items-center gap-2">
              <span className="w-16 text-stone-600 font-medium">Blend</span>
              <select
                value={getVal('blendMode', 'normal')}
                onChange={(e) => applyCommitChange({ blendMode: e.target.value })}
                className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-2 py-1 text-xs font-semibold text-stone-800 focus:outline-none"
              >
                {getVal('blendMode', 'normal') === 'Mixed' && <option value="Mixed">Mixed</option>}
                {BLEND_MODES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDABLE TAB: Reset Options */}
      {activeTab === 'reset' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-1.5 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                applyCommitChange(getResetImageAdjustmentsState());
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-left"
            >
              Reset Adjustments
            </button>

            <button
              onClick={() => {
                applyCommitChange(getResetImageCropState());
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-left"
            >
              Reset Crop
            </button>

            <button
              onClick={() => {
                applyCommitChange(getResetImageFiltersState());
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-left"
            >
              Reset Filters
            </button>

            <button
              onClick={() => {
                applyCommitChange(getResetImageTransformState());
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-left"
            >
              Reset Transform
            </button>

            <button
              onClick={() => {
                applyCommitChange(getResetAllImagePropertiesState(targetElement));
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-left col-span-2"
            >
              Reset All Image Properties
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
