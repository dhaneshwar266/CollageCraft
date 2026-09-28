import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline,
  Strikethrough,
  Sparkles,
  ChevronDown,
  Palette,
  Sliders,
  Square,
  Sun,
  Layers,
  Check,
} from 'lucide-react';
import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  LETTER_SPACINGS,
  normalizeTextElement,
  getMultiTextCommonValue,
} from '../../utils/textUtils';

export default function TextFormattingToolbar({
  selectedTextElements = [],
  onUpdateText,
}) {
  const [activePopover, setActivePopover] = useState(null); // 'font'|'size'|'weight'|'color'|'spacing'|'transform'|'box'|'shadow'
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActivePopover(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selectedTextElements || selectedTextElements.length === 0) return null;

  const firstNorm = normalizeTextElement(selectedTextElements[0]);

  // Extract common property values or 'MIXED'
  const fontFamily = getMultiTextCommonValue(selectedTextElements, 'fontFamily');
  const fontSize = getMultiTextCommonValue(selectedTextElements, 'fontSize');
  const fontWeight = getMultiTextCommonValue(selectedTextElements, 'fontWeight');
  const fontStyle = getMultiTextCommonValue(selectedTextElements, 'fontStyle');
  const color = getMultiTextCommonValue(selectedTextElements, 'color');
  const textAlign = getMultiTextCommonValue(selectedTextElements, 'textAlign');
  const verticalAlign = getMultiTextCommonValue(selectedTextElements, 'verticalAlign');
  const lineHeight = getMultiTextCommonValue(selectedTextElements, 'lineHeight');
  const letterSpacing = getMultiTextCommonValue(selectedTextElements, 'letterSpacing');
  const textTransform = getMultiTextCommonValue(selectedTextElements, 'textTransform');
  const textDecoration = getMultiTextCommonValue(selectedTextElements, 'textDecoration');
  const backgroundColor = getMultiTextCommonValue(selectedTextElements, 'backgroundColor');
  const backgroundOpacity = getMultiTextCommonValue(selectedTextElements, 'backgroundOpacity');
  const padding = getMultiTextCommonValue(selectedTextElements, 'padding');
  const borderWidth = getMultiTextCommonValue(selectedTextElements, 'borderWidth');
  const borderColor = getMultiTextCommonValue(selectedTextElements, 'borderColor');
  const borderRadius = getMultiTextCommonValue(selectedTextElements, 'borderRadius');

  const shadow = firstNorm.shadow;
  const outline = firstNorm.outline;

  const handleApply = (patch) => {
    if (onUpdateText) {
      onUpdateText(patch);
    }
  };

  const togglePopover = (name) => {
    setActivePopover(activePopover === name ? null : name);
  };

  return (
    <div
      ref={menuRef}
      className="relative inline-flex items-center gap-1.5 bg-white/95 border border-stone-200/90 rounded-2xl shadow-xl backdrop-blur-xl p-1.5 text-stone-800 text-xs select-none z-40 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* FONT FAMILY SELECTOR */}
      <div className="relative">
        <button
          onClick={() => togglePopover('font')}
          title="Font Family"
          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold flex items-center gap-1.5 max-w-[130px]"
        >
          <span className="truncate">{fontFamily === 'MIXED' ? 'Mixed' : fontFamily}</span>
          <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
        </button>

        {activePopover === 'font' && (
          <div className="absolute top-10 left-0 w-44 bg-white border border-stone-200 rounded-2xl shadow-xl py-1 z-50 max-h-56 overflow-y-auto no-scrollbar">
            {FONT_FAMILIES.map((family) => (
              <button
                key={family}
                onClick={() => {
                  handleApply({ fontFamily: family });
                  setActivePopover(null);
                }}
                style={{ fontFamily: family }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-amber-50 flex items-center justify-between ${
                  fontFamily === family ? 'text-[#c25e40] font-bold bg-amber-50/60' : 'text-stone-800'
                }`}
              >
                <span>{family}</span>
                {fontFamily === family && <Check className="w-3.5 h-3.5 text-[#c25e40]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FONT SIZE INPUT & DROPDOWN */}
      <div className="relative flex items-center">
        <input
          type="number"
          min="1"
          max="500"
          value={fontSize === 'MIXED' ? '' : fontSize}
          placeholder={fontSize === 'MIXED' ? 'Mixed' : ''}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1 && val <= 500) {
              handleApply({ fontSize: val });
            }
          }}
          className="w-12 bg-stone-100 border border-stone-200 rounded-xl px-1.5 py-1 text-center font-mono text-xs font-bold text-stone-900 focus:outline-none focus:border-[#c25e40]"
        />
        <button
          onClick={() => togglePopover('size')}
          className="p-1 text-stone-400 hover:text-stone-800"
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {activePopover === 'size' && (
          <div className="absolute top-10 left-0 w-24 bg-white border border-stone-200 rounded-2xl shadow-xl py-1 z-50 max-h-56 overflow-y-auto no-scrollbar font-mono text-center">
            {FONT_SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => {
                  handleApply({ fontSize: sz });
                  setActivePopover(null);
                }}
                className={`w-full py-1 text-xs hover:bg-amber-50 font-bold ${
                  fontSize === sz ? 'text-[#c25e40] bg-amber-50/60' : 'text-stone-700'
                }`}
              >
                {sz}px
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />

      {/* FONT WEIGHT DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => togglePopover('weight')}
          title="Font Weight"
          className="px-2 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-1"
        >
          <span>
            {fontWeight === 'MIXED'
              ? 'Mixed'
              : FONT_WEIGHTS.find((w) => w.value === fontWeight)?.label || 'Regular'}
          </span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {activePopover === 'weight' && (
          <div className="absolute top-10 left-0 w-36 bg-white border border-stone-200 rounded-2xl shadow-xl py-1 z-50 max-h-56 overflow-y-auto no-scrollbar">
            {FONT_WEIGHTS.map((w) => (
              <button
                key={w.value}
                onClick={() => {
                  handleApply({ fontWeight: w.value });
                  setActivePopover(null);
                }}
                style={{ fontWeight: w.value }}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-amber-50 ${
                  fontWeight === w.value ? 'text-[#c25e40] font-bold bg-amber-50/60' : 'text-stone-800'
                }`}
              >
                {w.label} ({w.value})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BOLD / ITALIC TOGGLES */}
      <button
        onClick={() => {
          const nextWeight = fontWeight >= 700 ? 400 : 700;
          handleApply({ fontWeight: nextWeight });
        }}
        title="Bold (Cmd+B)"
        className={`p-1.5 rounded-xl transition-colors ${
          fontWeight >= 700 ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
        }`}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => {
          const nextStyle = fontStyle === 'italic' ? 'normal' : 'italic';
          handleApply({ fontStyle: nextStyle });
        }}
        title="Italic (Cmd+I)"
        className={`p-1.5 rounded-xl transition-colors ${
          fontStyle === 'italic' ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
        }`}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />

      {/* TEXT COLOR PICKER */}
      <div className="relative">
        <button
          onClick={() => togglePopover('color')}
          title="Text Color"
          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center gap-1.5"
        >
          <div
            className="w-4 h-4 rounded-full border border-stone-300 shadow-2xs"
            style={{ backgroundColor: color === 'MIXED' ? '#ffffff' : color || '#111111' }}
          />
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {activePopover === 'color' && (
          <div className="absolute top-10 left-0 w-48 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 space-y-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Text Color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color === 'MIXED' ? '#ffffff' : color || '#111111'}
                onChange={(e) => handleApply({ color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={color === 'MIXED' ? '' : color}
                placeholder="#111111"
                onChange={(e) => handleApply({ color: e.target.value })}
                className="flex-1 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-stone-800"
              />
            </div>
            {/* Color Swatches */}
            <div className="grid grid-cols-6 gap-1 pt-1">
              {['#ffffff', '#000000', '#1e293b', '#c25e40', '#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777', '#dc2626'].map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    handleApply({ color: hex });
                    setActivePopover(null);
                  }}
                  className="w-5 h-5 rounded-md border border-stone-200 shadow-2xs hover:scale-110 transition-transform"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />

      {/* TEXT ALIGNMENT */}
      <div className="flex items-center bg-stone-100 rounded-xl p-0.5">
        <button
          onClick={() => handleApply({ textAlign: 'left' })}
          title="Align Left"
          className={`p-1 rounded-lg transition-colors ${
            textAlign === 'left' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleApply({ textAlign: 'center' })}
          title="Align Center"
          className={`p-1 rounded-lg transition-colors ${
            textAlign === 'center' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleApply({ textAlign: 'right' })}
          title="Align Right"
          className={`p-1 rounded-lg transition-colors ${
            textAlign === 'right' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />

      {/* SPACING & LINE HEIGHT POPOVER */}
      <div className="relative">
        <button
          onClick={() => togglePopover('spacing')}
          title="Line Height & Letter Spacing"
          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1 font-semibold"
        >
          <Sliders className="w-3.5 h-3.5 text-stone-600" />
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {activePopover === 'spacing' && (
          <div className="absolute top-10 left-0 w-52 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 space-y-3">
            {/* Line Height */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-1">
                <span>Line Height</span>
                <span className="font-mono text-[#c25e40]">{lineHeight}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.1"
                  value={lineHeight === 'MIXED' ? 1.2 : lineHeight}
                  onChange={(e) => handleApply({ lineHeight: parseFloat(e.target.value) })}
                  className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Letter Spacing */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-1">
                <span>Letter Spacing</span>
                <span className="font-mono text-[#c25e40]">{letterSpacing}px</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-10"
                  max="40"
                  step="1"
                  value={letterSpacing === 'MIXED' ? 0 : letterSpacing}
                  onChange={(e) => handleApply({ letterSpacing: parseInt(e.target.value, 10) })}
                  className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TEXT TRANSFORM & DECORATION POPOVER */}
      <div className="relative">
        <button
          onClick={() => togglePopover('transform')}
          title="Text Case & Decoration"
          className="px-2 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-mono font-bold text-stone-800"
        >
          aA
        </button>

        {activePopover === 'transform' && (
          <div className="absolute top-10 left-0 w-44 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-50 space-y-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
              Text Case
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {['none', 'uppercase', 'lowercase', 'capitalize'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    handleApply({ textTransform: tf });
                    setActivePopover(null);
                  }}
                  className={`py-1 px-2 rounded-lg font-semibold capitalize text-left ${
                    textTransform === tf ? 'bg-[#c25e40] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="h-[1px] bg-stone-200 my-1" />

            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
              Decoration
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleApply({ textDecoration: textDecoration === 'underline' ? 'none' : 'underline' })}
                className={`p-1.5 rounded-lg flex-1 flex items-center justify-center ${
                  textDecoration === 'underline' ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleApply({ textDecoration: textDecoration === 'line-through' ? 'none' : 'line-through' })}
                className={`p-1.5 rounded-lg flex-1 flex items-center justify-center ${
                  textDecoration === 'line-through' ? 'bg-[#c25e40] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BACKGROUND & BORDER POPOVER */}
      <div className="relative">
        <button
          onClick={() => togglePopover('box')}
          title="Text Background & Border"
          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        {activePopover === 'box' && (
          <div className="absolute top-10 right-0 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 space-y-2.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Background Pill / Box
            </span>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor === 'transparent' ? '#1e293b' : backgroundColor}
                onChange={(e) => handleApply({ backgroundColor: e.target.value })}
                className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
              />
              <button
                onClick={() => handleApply({ backgroundColor: 'transparent' })}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700"
              >
                Clear Background
              </button>
            </div>

            {/* Padding & Radius Sliders */}
            <div className="space-y-2 text-[11px] pt-1">
              <div>
                <div className="flex items-center justify-between font-bold text-stone-600 mb-0.5">
                  <span>Padding</span>
                  <span className="font-mono text-[#c25e40]">{padding}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={padding === 'MIXED' ? 0 : padding}
                  onChange={(e) => handleApply({ padding: parseInt(e.target.value, 10) })}
                  className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-bold text-stone-600 mb-0.5">
                  <span>Corner Radius</span>
                  <span className="font-mono text-[#c25e40]">{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={borderRadius === 'MIXED' ? 0 : borderRadius}
                  onChange={(e) => handleApply({ borderRadius: parseInt(e.target.value, 10) })}
                  className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-bold text-stone-600 mb-0.5">
                  <span>Border Width</span>
                  <span className="font-mono text-[#c25e40]">{borderWidth}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={borderWidth === 'MIXED' ? 0 : borderWidth}
                    onChange={(e) => handleApply({ borderWidth: parseInt(e.target.value, 10) })}
                    className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="color"
                    value={borderColor === 'transparent' ? '#000000' : borderColor}
                    onChange={(e) => handleApply({ borderColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SHADOW & OUTLINE POPOVER */}
      <div className="relative">
        <button
          onClick={() => togglePopover('shadow')}
          title="Text Shadow & Outline"
          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>

        {activePopover === 'shadow' && (
          <div className="absolute top-10 right-0 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 space-y-2.5">
            {/* Shadow Toggle */}
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Text Shadow</span>
              <input
                type="checkbox"
                checked={shadow?.enabled ?? false}
                onChange={(e) =>
                  handleApply({
                    shadow: { ...shadow, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-[#c25e40] focus:ring-[#c25e40]"
              />
            </div>

            {shadow?.enabled && (
              <div className="space-y-2 text-[11px] pt-1 border-t border-stone-100">
                <div>
                  <div className="flex items-center justify-between font-bold text-stone-600 mb-0.5">
                    <span>Blur</span>
                    <span className="font-mono text-[#c25e40]">{shadow.blur || 4}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={shadow.blur || 4}
                    onChange={(e) =>
                      handleApply({
                        shadow: { ...shadow, blur: parseInt(e.target.value, 10) },
                      })
                    }
                    className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="h-[1px] bg-stone-200 my-1" />

            {/* Outline Toggle */}
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Text Stroke / Outline</span>
              <input
                type="checkbox"
                checked={outline?.enabled ?? false}
                onChange={(e) =>
                  handleApply({
                    outline: { ...outline, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-[#c25e40] focus:ring-[#c25e40]"
              />
            </div>

            {outline?.enabled && (
              <div className="space-y-2 text-[11px] pt-1 border-t border-stone-100">
                <div className="flex items-center justify-between font-bold text-stone-600 mb-0.5">
                  <span>Width</span>
                  <span className="font-mono text-[#c25e40]">{outline.width || 1}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={outline.width || 1}
                    onChange={(e) =>
                      handleApply({
                        outline: { ...outline, width: parseInt(e.target.value, 10) },
                      })
                    }
                    className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="color"
                    value={outline.color || '#000000'}
                    onChange={(e) =>
                      handleApply({
                        outline: { ...outline, color: e.target.value },
                      })
                    }
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
