import React, { useState } from 'react';
import {
  Palette,
  Square,
  Sliders,
  Sun,
  Layers,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw as ResetIcon,
  X,
  Plus,
  Trash2,
  Lock,
  ChevronDown,
} from 'lucide-react';
import {
  getMultiShapeCommonValue,
  getResetShapeFormattingState,
  SHAPE_TYPES,
} from '../../utils/shapeUtils';

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#64748b', '#1e293b', '#94a3b8', 'transparent',
];

export default function ShapeFormattingToolbar({
  selectedElements = [],
  primaryElement,
  onLiveUpdate,
  onCommitChange,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(null); // 'fill' | 'stroke' | 'radius' | 'sides' | 'effects' | 'transform' | 'reset'

  const shapeElements = selectedElements.filter((el) => el?.type === 'shape');
  const isMulti = shapeElements.length > 1;
  const targetElement = primaryElement?.type === 'shape' ? primaryElement : shapeElements[0];

  if (!targetElement && shapeElements.length === 0) return null;

  // Handle locked shape element
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

  // Live and Commit change apply helpers
  const applyLiveChange = (updates) => {
    if (isMulti) {
      const liveMap = {};
      shapeElements.forEach((el) => {
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
      shapeElements.forEach((el) => {
        commitMap[el.id] = { ...updates };
      });
      if (onCommitChange) onCommitChange(commitMap);
    } else if (targetElement) {
      if (onCommitChange) onCommitChange({ [targetElement.id]: updates });
    }
  };

  const getVal = (key, defaultVal) => {
    return isMulti ? getMultiShapeCommonValue(shapeElements, key, defaultVal) : (targetElement[key] ?? defaultVal);
  };

  const shapeType = targetElement.shapeType || 'rectangle';
  const hasPolygonSides = ['star', 'pentagon', 'hexagon', 'triangle'].includes(shapeType);
  const isStar = shapeType === 'star';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 md:relative md:top-0 md:left-0 md:translate-x-0 md:z-30 md:w-full md:max-w-none md:rounded-none md:border-x-0 md:border-t-0 md:border-b md:border-stone-200/80 md:bg-white/95 md:shadow-xs md:p-2.5 md:shrink-0 bg-white/95 border border-stone-200/90 rounded-2xl shadow-xl backdrop-blur-xl p-2.5 text-stone-900 flex flex-col gap-2 min-w-[420px] max-w-[620px] animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      {/* Top Main Buttons */}
      <div className="flex items-center justify-between gap-1.5 border-b border-stone-200/80 pb-2">
        <span className="text-xs font-bold text-stone-800 truncate max-w-[120px] pl-1">
          {isMulti ? `${shapeElements.length} Shapes` : targetElement.name || 'Shape'}
        </span>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {/* Fill Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'fill' ? null : 'fill')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'fill' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-stone-400"
              style={{
                backgroundColor: typeof getVal('fill') === 'object' ? (getVal('fill')?.color || '#3b82f6') : (getVal('fill') || '#3b82f6'),
              }}
            />
            <span>Fill</span>
          </button>

          {/* Stroke Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'stroke' ? null : 'stroke')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'stroke' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Square className="w-3.5 h-3.5 text-amber-500" />
            <span>Stroke</span>
          </button>

          {/* Radius Button */}
          {(shapeType === 'rounded-rectangle' || shapeType === 'rectangle') && (
            <button
              onClick={() => setActiveTab(activeTab === 'radius' ? null : 'radius')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                activeTab === 'radius' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Radius</span>
            </button>
          )}

          {/* Polygon / Star Sides */}
          {hasPolygonSides && (
            <button
              onClick={() => setActiveTab(activeTab === 'sides' ? null : 'sides')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                activeTab === 'sides' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>{isStar ? 'Star' : 'Sides'}</span>
            </button>
          )}

          {/* Effects & Opacity */}
          <button
            onClick={() => setActiveTab(activeTab === 'effects' ? null : 'effects')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'effects' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Effects</span>
          </button>

          {/* Transform */}
          <button
            onClick={() => setActiveTab(activeTab === 'transform' ? null : 'transform')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'transform' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Transform</span>
          </button>

          {/* Reset */}
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

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB: Fill Color / Gradient Editor */}
      {activeTab === 'fill' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-3 text-xs animate-in fade-in duration-150">
          {/* Preset Fill Colors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PRESET_COLORS.map((color, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const newFill = color === 'transparent' ? { type: 'transparent', color: 'transparent' } : { type: 'solid', color };
                  applyCommitChange({ fill: newFill });
                }}
                className="w-6 h-6 rounded-full border border-stone-300 shadow-2xs hover:scale-110 transition-transform shrink-0 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                title={color}
              >
                {color === 'transparent' && <span className="text-[10px] text-rose-500 font-bold">✕</span>}
              </button>
            ))}
          </div>

          {/* Custom Hex Color input */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-medium">Color:</span>
              <input
                type="color"
                value={typeof getVal('fill') === 'object' ? (getVal('fill')?.color || '#3b82f6') : (getVal('fill') || '#3b82f6')}
                onChange={(e) => applyCommitChange({ fill: { type: 'solid', color: e.target.value } })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200 p-0.5 bg-white"
              />
            </div>

            {/* Gradient Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  applyCommitChange({
                    fill: {
                      type: 'linear',
                      color: '#3b82f6',
                      gradient: {
                        type: 'linear',
                        angle: 45,
                        stops: [
                          { offset: 0, color: '#3b82f6' },
                          { offset: 1, color: '#8b5cf6' },
                        ],
                      },
                    },
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-[11px]"
              >
                Linear Grad
              </button>
              <button
                onClick={() =>
                  applyCommitChange({
                    fill: {
                      type: 'radial',
                      color: '#3b82f6',
                      gradient: {
                        type: 'radial',
                        angle: 0,
                        stops: [
                          { offset: 0, color: '#f59e0b' },
                          { offset: 1, color: '#ef4444' },
                        ],
                      },
                    },
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-[11px]"
              >
                Radial Grad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Stroke Controls */}
      {activeTab === 'stroke' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-3">
            {/* Stroke Color */}
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-medium">Stroke:</span>
              <input
                type="color"
                value={getVal('stroke', '#1e3a8a') === 'Mixed' ? '#1e3a8a' : getVal('stroke', '#1e3a8a')}
                onChange={(e) => applyCommitChange({ stroke: e.target.value })}
                className="w-7 h-7 rounded-lg cursor-pointer border border-stone-200 p-0.5 bg-white"
              />
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <span className="text-stone-600 font-medium">Width:</span>
              <input
                type="range"
                min="0"
                max="40"
                value={getVal('strokeWidth', 0) === 'Mixed' ? 0 : getVal('strokeWidth', 0)}
                onChange={(e) => applyLiveChange({ strokeWidth: parseInt(e.target.value, 10) })}
                onMouseUp={(e) => applyCommitChange({ strokeWidth: parseInt(e.target.value, 10) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-8 text-right">
                {getVal('strokeWidth', 0) === 'Mixed' ? 'Mixed' : `${getVal('strokeWidth', 0)}px`}
              </span>
            </div>

            {/* Stroke Style */}
            <select
              value={getVal('strokeStyle', 'solid')}
              onChange={(e) => applyCommitChange({ strokeStyle: e.target.value })}
              className="bg-stone-100 border border-stone-200 rounded-xl px-2 py-1 text-xs font-semibold text-stone-800"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB: Corner Radius */}
      {activeTab === 'radius' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="w-24 text-stone-600 font-medium">Corner Radius</span>
            <input
              type="range"
              min="0"
              max="60"
              value={getVal('cornerRadius', 0) === 'Mixed' ? 0 : getVal('cornerRadius', 0)}
              onChange={(e) => applyLiveChange({ cornerRadius: parseInt(e.target.value, 10) })}
              onMouseUp={(e) => applyCommitChange({ cornerRadius: parseInt(e.target.value, 10) })}
              className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-[11px] text-stone-600 w-12 text-right">
              {getVal('cornerRadius', 0) === 'Mixed' ? 'Mixed' : `${getVal('cornerRadius', 0)}px`}
            </span>
          </div>
        </div>
      )}

      {/* TAB: Polygon / Star Sides & Inner Radius */}
      {activeTab === 'sides' && (
        <div className="border-t border-stone-200/80 pt-2.5 pb-1 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="w-24 text-stone-600 font-medium">Polygon Sides</span>
            <input
              type="range"
              min="3"
              max="20"
              value={getVal('sides', 5) === 'Mixed' ? 5 : getVal('sides', 5)}
              onChange={(e) => applyLiveChange({ sides: parseInt(e.target.value, 10) })}
              onMouseUp={(e) => applyCommitChange({ sides: parseInt(e.target.value, 10) })}
              className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-[11px] text-stone-600 w-8 text-right font-bold">
              {getVal('sides', 5) === 'Mixed' ? 'Mixed' : getVal('sides', 5)}
            </span>
          </div>

          {isStar && (
            <div className="flex items-center gap-3 pt-1">
              <span className="w-24 text-stone-600 font-medium">Inner Radius</span>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={getVal('innerRadius', 0.4) === 'Mixed' ? 0.4 : getVal('innerRadius', 0.4)}
                onChange={(e) => applyLiveChange({ innerRadius: parseFloat(e.target.value) })}
                onMouseUp={(e) => applyCommitChange({ innerRadius: parseFloat(e.target.value) })}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono text-[11px] text-stone-600 w-12 text-right font-bold">
                {getVal('innerRadius', 0.4) === 'Mixed' ? 'Mixed' : `${Math.round(getVal('innerRadius', 0.4) * 100)}%`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB: Effects (Opacity, Blend Mode, Shadow) */}
      {activeTab === 'effects' && (
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
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => applyCommitChange({ rotation: ((targetElement.rotation || 0) - 90 + 360) % 360 })}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                <span>-90°</span>
              </button>
              <button
                onClick={() => applyCommitChange({ rotation: ((targetElement.rotation || 0) + 90) % 360 })}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5 text-stone-600" />
                <span>+90°</span>
              </button>
            </div>

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
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                applyCommitChange(getResetShapeFormattingState());
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-left col-span-2"
            >
              Reset Shape Formatting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
