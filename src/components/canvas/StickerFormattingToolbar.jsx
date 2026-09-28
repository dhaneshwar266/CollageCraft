import React, { useState } from 'react';
import {
  Palette,
  Square,
  Sun,
  Layers,
  FlipHorizontal,
  FlipVertical,
  RotateCcw as ResetIcon,
  X,
  Lock,
} from 'lucide-react';
import {
  getMultiStickerCommonValue,
  getResetStickerFormattingState,
} from '../../utils/stickerUtils';

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#64748b', '#1e293b', 'transparent',
];

export default function StickerFormattingToolbar({
  selectedElements = [],
  primaryElement,
  onLiveUpdate,
  onCommitChange,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(null); // 'fill' | 'stroke' | 'effects' | 'transform' | 'reset'

  const stickerElements = selectedElements.filter((el) => el?.type === 'sticker');
  const isMulti = stickerElements.length > 1;
  const targetElement = primaryElement?.type === 'sticker' ? primaryElement : stickerElements[0];

  if (!targetElement && stickerElements.length === 0) return null;

  // Handle locked sticker
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

  const isEmoji = targetElement?.stickerSource === 'emoji';

  const applyLiveChange = (updates) => {
    if (isMulti) {
      const liveMap = {};
      stickerElements.forEach((el) => {
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
      stickerElements.forEach((el) => {
        commitMap[el.id] = { ...updates };
      });
      if (onCommitChange) onCommitChange(commitMap);
    } else if (targetElement) {
      if (onCommitChange) onCommitChange({ [targetElement.id]: updates });
    }
  };

  const getVal = (key, defaultVal) => {
    return isMulti ? getMultiStickerCommonValue(stickerElements, key, defaultVal) : (targetElement[key] ?? defaultVal);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 border border-stone-200/90 rounded-2xl shadow-xl backdrop-blur-xl p-2.5 text-stone-900 flex flex-col gap-2 min-w-[380px] max-w-[580px] animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      {/* Top Buttons Row */}
      <div className="flex items-center justify-between gap-1.5 border-b border-stone-200/80 pb-2">
        <span className="text-xs font-bold text-stone-800 truncate max-w-[120px] pl-1">
          {isMulti ? `${stickerElements.length} Stickers` : targetElement.name || 'Sticker'}
        </span>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {/* Color/Fill Tab (SVG stickers & icons only) */}
          {!isEmoji && (
            <button
              onClick={() => setActiveTab(activeTab === 'fill' ? null : 'fill')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'fill' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Color</span>
            </button>
          )}

          {/* Stroke Tab (SVG stickers & icons only) */}
          {!isEmoji && (
            <button
              onClick={() => setActiveTab(activeTab === 'stroke' ? null : 'stroke')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'stroke' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-amber-500" />
              <span>Stroke</span>
            </button>
          )}

          {/* Effects & Opacity Tab */}
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
            <FlipHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>Flip</span>
          </button>

          {/* Reset Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'reset' ? null : 'reset')}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'reset' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
            title="Reset Options"
          >
            <ResetIcon className="w-3.5 h-3.5 text-stone-500" />
          </button>

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

      {/* TAB: Fill Color */}
      {!isEmoji && activeTab === 'fill' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PRESET_COLORS.map((color, idx) => (
              <button
                key={idx}
                onClick={() => applyCommitChange({ fill: color, fillColor: color })}
                className="w-6 h-6 rounded-full border border-stone-300 shadow-2xs hover:scale-110 transition-transform shrink-0 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                title={color}
              >
                {color === 'transparent' && <span className="text-[10px] text-rose-500 font-bold">✕</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-stone-600 font-medium">Custom Color:</span>
            <input
              type="color"
              value={getVal('fill', '#3b82f6') === 'Mixed' ? '#3b82f6' : (getVal('fill', '#3b82f6') === 'transparent' ? '#ffffff' : getVal('fill', '#3b82f6'))}
              onChange={(e) => applyCommitChange({ fill: e.target.value, fillColor: e.target.value })}
              className="w-7 h-7 rounded-lg cursor-pointer border border-stone-200 p-0.5 bg-white"
            />
          </div>
        </div>
      )}

      {/* TAB: Stroke Controls */}
      {!isEmoji && activeTab === 'stroke' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-medium">Stroke:</span>
              <input
                type="color"
                value={getVal('stroke', '#000000') === 'Mixed' ? '#000000' : (getVal('stroke', '#000000') === 'none' ? '#ffffff' : getVal('stroke', '#000000'))}
                onChange={(e) => applyCommitChange({ stroke: e.target.value, strokeColor: e.target.value })}
                className="w-7 h-7 rounded-lg cursor-pointer border border-stone-200 p-0.5 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-[220px]">
              <span className="text-stone-600 font-medium">Width:</span>
              <input
                type="range"
                min="0"
                max="30"
                value={getVal('strokeWidth', 0) === 'Mixed' ? 0 : getVal('strokeWidth', 0)}
                onChange={(e) => applyLiveChange({ strokeWidth: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ strokeWidth: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-8 text-right">
                {getVal('strokeWidth', 0) === 'Mixed' ? 'Mixed' : `${getVal('strokeWidth', 0)}px`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Effects (Opacity, Blend, Shadow) */}
      {activeTab === 'effects' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-4">
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

            <div className="flex items-center gap-2">
              <span className="w-16 text-stone-600 font-medium">Blend</span>
              <select
                value={getVal('blendMode', 'normal')}
                onChange={(e) => applyCommitChange({ blendMode: e.target.value })}
                className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-2 py-1 text-xs font-semibold text-stone-800 focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Transform */}
      {activeTab === 'transform' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-stone-600 font-medium">Flip Orientation:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => applyCommitChange({ flipH: !targetElement.flipH })}
                className={`p-1.5 rounded-xl transition-all ${
                  targetElement.flipH ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyCommitChange({ flipV: !targetElement.flipV })}
                className={`p-1.5 rounded-xl transition-all ${
                  targetElement.flipV ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Reset */}
      {activeTab === 'reset' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-1.5 animate-in fade-in duration-150">
          <button
            onClick={() => {
              applyCommitChange(getResetStickerFormattingState(targetElement));
              setActiveTab(null);
            }}
            className="w-full px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-left font-semibold text-xs"
          >
            Reset Sticker Formatting
          </button>
        </div>
      )}
    </div>
  );
}
