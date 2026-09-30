import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Layers,
  Sliders, 
  Palette, 
  Type, 
  Sticker, 
  Move,
  Plus,
  Trash2,
  Shapes,
  X,
} from 'lucide-react';
import { ASPECT_RATIOS, LAYOUT_PRESETS } from '../../utils/layoutTemplates';
import LayersPanel from './LayersPanel';
import ShapeInsertMenu from '../canvas/ShapeInsertMenu';
import StickerLibrary from './StickerLibrary';
import { createStickerFromRegistry } from '../../utils/stickerUtils';

export default function Sidebar({
  activeTab,
  setActiveTab,
  state,
  setLayoutId,
  setAspectRatio,
  updateFrameSettings,
  updateBackgroundSettings,
  addTextOverlay,
  updateTextOverlay,
  removeTextOverlay,
  addSticker,
  removeSticker,
  addShapeElement,
  selectedOverlayId,
  setSelectedOverlayId,
  // Unified document & selection state and actions for Layers Panel
  document,
  selection,
  setPrimarySelection,
  toggleSelection,
  toggleVisibility,
  toggleLock,
  renameElement,
  duplicateElement,
  removeElement,
  deleteSelectedElements,
  duplicateSelectedElements,
  groupSelectedElements,
  ungroupSelectedElement,
  editingGroupId,
  setEditingGroupId,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
}) {
  const {
    aspectRatio,
    layoutId,
    frameSettings,
    backgroundSettings,
    assets,
    textOverlays,
    stickers,
  } = state;

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activePhotos = (document?.elements || []).filter(
    (el) => el.type === 'image' && el.assetId != null
  );
  const activePhotoCount = Math.max(activePhotos.length, assets.length);
  const photoCount = activePhotoCount;
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLayoutSubTab, setActiveLayoutSubTab] = useState('aspect-ratio');

  // Filter templates so NO template with capacity < activePhotoCount is displayed
  const validTemplates = React.useMemo(() => {
    let list = LAYOUT_PRESETS.filter((preset) => {
      const cap = preset.capacity || preset.photoCount || (preset.cells ? preset.cells.length : 0);
      return activePhotoCount === 0 || cap >= activePhotoCount;
    });

    if (activePhotoCount > 20) {
      const autoCells = getAutoGridLayout(activePhotoCount);
      const generatedPreset = {
        id: `auto-grid-${activePhotoCount}`,
        name: `${activePhotoCount} Photo Auto Grid`,
        photoCount: activePhotoCount,
        capacity: activePhotoCount,
        category: 'Balanced',
        cells: autoCells,
      };
      list = [generatedPreset, ...list];
    }
    return list;
  }, [activePhotoCount]);

  const displayedTemplates = React.useMemo(() => {
    if (activeCategory === 'All') return validTemplates;
    if (activeCategory === 'Exact Match') {
      return validTemplates.filter(
        (p) => (p.capacity || p.photoCount || p.cells.length) === activePhotoCount
      );
    }
    return validTemplates.filter((p) => p.category === activeCategory);
  }, [validTemplates, activeCategory, activePhotoCount]);

  const tabs = [
    { id: 'layouts', label: 'Layouts', icon: LayoutGrid },
    { id: 'layers', label: 'Layers', icon: Layers },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
    { id: 'spacing', label: 'Spacing & Border', icon: Sliders },
    { id: 'background', label: 'Background', icon: Palette },
    { id: 'text', label: 'Text Captions', icon: Type },
    { id: 'stickers', label: 'Stickers', icon: Sticker },
  ];

  const renderTabContent = () => (
    <>
      {/* TAB 1: LAYOUTS */}
      {activeTab === 'layouts' && (
        <div className="space-y-4">
          {/* Sub-tab Navigation Bar: 3 side-by-side buttons in one horizontal row */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80 shrink-0 w-full select-none">
            <button
              onClick={() => setActiveLayoutSubTab('aspect-ratio')}
              className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all text-center truncate cursor-pointer ${
                activeLayoutSubTab === 'aspect-ratio'
                  ? 'bg-[#c25e40] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              Canvas Aspect
            </button>
            <button
              onClick={() => setActiveLayoutSubTab('collage-mode')}
              className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all text-center truncate cursor-pointer ${
                activeLayoutSubTab === 'collage-mode'
                  ? 'bg-[#c25e40] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              Collage Mode
            </button>
            <button
              onClick={() => setActiveLayoutSubTab('grid-templates')}
              className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all text-center truncate cursor-pointer ${
                activeLayoutSubTab === 'grid-templates'
                  ? 'bg-[#c25e40] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              Grid Templates
            </button>
          </div>

          {/* Sub-tab 1: Aspect Ratio Selector */}
          {activeLayoutSubTab === 'aspect-ratio' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                <span>Canvas Aspect Ratio</span>
                <span className="text-[#c25e40] font-mono">{aspectRatio}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((item) => {
                  const isSelected = aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAspectRatio(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#c25e40] bg-amber-50 text-stone-900 ring-1 ring-[#c25e40]/50'
                          : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:border-stone-300 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold">{item.id}</span>
                      <span className="text-[10px] text-stone-500 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Collage Mode */}
          {activeLayoutSubTab === 'collage-mode' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Collage Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLayoutId('side-by-side')}
                  className={`p-3 rounded-xl border text-center font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                    layoutId !== 'freestyle'
                      ? 'border-[#c25e40] bg-[#c25e40] text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Smart Grid</span>
                </button>

                <button
                  onClick={() => setLayoutId('freestyle')}
                  className={`p-3 rounded-xl border text-center font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                    layoutId === 'freestyle'
                      ? 'border-amber-800 bg-gradient-to-r from-amber-700 to-stone-800 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Move className="w-4 h-4" />
                  <span>Freestyle</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Grid Preset Templates List */}
          {activeLayoutSubTab === 'grid-templates' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Grid Templates ({activePhotoCount} {activePhotoCount === 1 ? 'Photo' : 'Photos'} Active)
                </label>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Exact Match', 'Classic', 'Hero / Featured', 'Balanced', 'Magazine', 'Mosaic', 'Asymmetric'].map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#c25e40] text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                      }`}
                    >
                      {cat === 'Exact Match' ? `Exact (${activePhotoCount}P)` : cat}
                    </button>
                  );
                })}
              </div>

              {/* Templates Grid List */}
              <div className="grid grid-cols-2 gap-2.5">
                {displayedTemplates.map((preset) => {
                  const isSelected = layoutId === preset.id;
                  const cap = preset.capacity || preset.photoCount || preset.cells.length;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        console.log('[TEMPLATE-1-CLICK]', {
                          templateId: preset.id,
                          activeImageCount: activePhotoCount,
                        });
                        console.log('[TEMPLATE-2-CALLBACK]', {
                          templateId: preset.id,
                          functionName: 'setLayoutId',
                        });
                        console.log('[TEMPLATE-3-STATE-BEFORE]', {
                          layoutId,
                          elementsCount: document?.elements?.length || 0,
                          cells: (document?.elements || [])
                            .filter((e) => e.type === 'image' && e.visible !== false)
                            .map((c) => ({
                              id: c.id,
                              x: c.x,
                              y: c.y,
                              width: c.width,
                              height: c.height,
                              specOverride: c.specOverride,
                              freeX: c.freeX,
                              freeY: c.freeY,
                              freeW: c.freeW,
                              freeH: c.freeH,
                            })),
                        });
                        setLayoutId(preset.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? 'border-[#c25e40] bg-amber-50/90 text-stone-900 ring-2 ring-[#c25e40] shadow-sm'
                          : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:border-stone-300 hover:bg-white'
                      }`}
                    >
                      {/* Real Geometry Mini Visual Grid Box */}
                      <div className="w-full h-16 bg-stone-100 rounded-lg p-1 relative mb-2 flex items-center justify-center border border-stone-200 overflow-hidden shadow-inner">
                        {preset.cells.map((c, i) => (
                          <div
                            key={i}
                            className={`absolute rounded-[2px] transition-colors ${
                              isSelected
                                ? 'bg-[#c25e40]'
                                : 'bg-stone-400 group-hover:bg-[#c25e40]/75'
                            }`}
                            style={{
                              left: `${c.x}%`,
                              top: `${c.y}%`,
                              width: `${c.width}%`,
                              height: `${c.height}%`,
                              border: '1px solid #ffffff',
                              transform: c.rotation ? `rotate(${c.rotation}deg)` : 'none',
                            }}
                          >
                            {preset.cells.length <= 16 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white opacity-80">
                                {i + 1}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate text-stone-800">{preset.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200/80 font-mono text-stone-700 font-bold shrink-0">
                          {cap}P
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 mt-0.5">
                        <span>{cap} Cell{cap > 1 ? 's' : ''}</span>
                        <span className="font-semibold text-stone-400">{preset.category}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: LAYERS */}
      {activeTab === 'layers' && (
        <div className="h-full">
          <LayersPanel
            document={document}
            selection={selection}
            setPrimarySelection={setPrimarySelection}
            toggleSelection={toggleSelection}
            toggleVisibility={toggleVisibility}
            toggleLock={toggleLock}
            renameElement={renameElement}
            duplicateElement={duplicateElement}
            removeElement={removeElement}
            deleteSelectedElements={deleteSelectedElements}
            duplicateSelectedElements={duplicateSelectedElements}
            groupSelectedElements={groupSelectedElements}
            ungroupSelectedElement={ungroupSelectedElement}
            editingGroupId={editingGroupId}
            setEditingGroupId={setEditingGroupId}
            bringForward={bringForward}
            sendBackward={sendBackward}
            bringToFront={bringToFront}
            sendToBack={sendToBack}
          />
        </div>
      )}

      {/* TAB: SHAPES */}
      {activeTab === 'shapes' && (
        <div className="space-y-4 w-full max-w-full min-w-0">
          <ShapeInsertMenu onAddShape={(shapeType) => addShapeElement(shapeType)} />
        </div>
      )}

      {/* TAB 2: SPACING & BORDER */}
      {activeTab === 'spacing' && (
        <div className="space-y-6">
          {/* Outer Margin / Padding Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-stone-700">
              <span>Outer Frame Padding</span>
              <span className="font-mono text-[#c25e40]">{frameSettings.padding}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={frameSettings.padding}
              onChange={(e) => updateFrameSettings({ padding: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Inner Grid Gap Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-stone-700">
              <span>Inner Grid Gap</span>
              <span className="font-mono text-[#c25e40]">{frameSettings.gap}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={frameSettings.gap}
              onChange={(e) => updateFrameSettings({ gap: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Corner Rounding (Border Radius) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-stone-700">
              <span>Corner Rounding (Border Radius)</span>
              <span className="font-mono text-[#c25e40]">
                {(selection?.primaryId && document?.elements?.find((el) => el.id === selection.primaryId && el.type === 'image')?.borderRadius != null)
                  ? document.elements.find((el) => el.id === selection.primaryId).borderRadius
                  : frameSettings.cornerRadius}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={
                (selection?.primaryId && document?.elements?.find((el) => el.id === selection.primaryId && el.type === 'image')?.borderRadius != null)
                  ? document.elements.find((el) => el.id === selection.primaryId).borderRadius
                  : frameSettings.cornerRadius
              }
              onChange={(e) => updateFrameSettings({ cornerRadius: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="h-[1px] bg-stone-200" />

          {/* Cell Elevation Shadow Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-800">Cell Elevation Shadow</span>
              <p className="text-[11px] text-stone-500">Adds subtle drop shadow behind photos</p>
            </div>
            <button
              onClick={() => updateFrameSettings({ cellShadow: !frameSettings.cellShadow })}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                frameSettings.cellShadow ? 'bg-[#c25e40]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  frameSettings.cellShadow ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BACKGROUND */}
      {activeTab === 'background' && (
        <div className="space-y-6">
          {/* Background Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'gradient', label: 'Gradients' },
              { id: 'color', label: 'Solid Color' },
              { id: 'blur', label: 'Photo Blur' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() =>
                  updateBackgroundSettings({
                    type: mode.id,
                    ...(mode.id === 'blur' && !backgroundSettings.blurAssetUrl && assets[0]
                      ? { blurAssetUrl: assets[0].url }
                      : {}),
                  })
                }
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  backgroundSettings.type === mode.id
                    ? 'bg-[#c25e40] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Editorial Gradients Presets */}
          {backgroundSettings.type === 'gradient' && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Editorial Warm Gradients
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    name: 'Warm Alabaster',
                    val: 'linear-gradient(135deg, #faf7f2 0%, #ede6da 100%)',
                    stops: ['#faf7f2', '#ede6da'],
                  },
                  {
                    name: 'Terracotta Sun',
                    val: 'linear-gradient(135deg, #fef3c7 0%, #f97316 50%, #c25e40 100%)',
                    stops: ['#fef3c7', '#f97316', '#c25e40'],
                  },
                  {
                    name: 'Sage & Olive',
                    val: 'linear-gradient(135deg, #f0fdf4 0%, #86efac 50%, #4d7c0f 100%)',
                    stops: ['#f0fdf4', '#86efac', '#4d7c0f'],
                  },
                  {
                    name: 'Champagne Gold',
                    val: 'linear-gradient(135deg, #fffbeb 0%, #fde68a 50%, #d97706 100%)',
                    stops: ['#fffbeb', '#fde68a', '#d97706'],
                  },
                  {
                    name: 'Vintage Newspaper',
                    val: 'linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 50%, #d6d3d1 100%)',
                    stops: ['#f5f5f4', '#e7e5e4', '#d6d3d1'],
                  },
                  {
                    name: 'Espresso Dark',
                    val: 'linear-gradient(135deg, #292524 0%, #1c1917 100%)',
                    stops: ['#292524', '#1c1917'],
                  },
                ].map((grad, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      updateBackgroundSettings({
                        type: 'gradient',
                        value: grad.val,
                        stops: grad.stops,
                      })
                    }
                    className="h-16 rounded-xl border border-stone-300 p-2 text-left flex flex-col justify-end transition-all hover:scale-105 relative overflow-hidden shadow-xs"
                    style={{ background: grad.val }}
                  >
                    <span className="text-[11px] font-bold text-stone-900 drop-shadow-xs">
                      {grad.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Solid Colors */}
          {backgroundSettings.type === 'color' && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Solid Canvas Colors
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundSettings.value || '#faf7f2'}
                  onChange={(e) =>
                    updateBackgroundSettings({ type: 'color', value: e.target.value })
                  }
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-stone-300"
                />
                <span className="font-mono text-xs text-stone-700">
                  {backgroundSettings.value || '#faf7f2'}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[
                  '#faf7f2',
                  '#ffffff',
                  '#f5f5f4',
                  '#e7e5e4',
                  '#c25e40',
                  '#d97706',
                  '#65a30d',
                  '#0284c7',
                  '#475569',
                  '#1c1917',
                  '#57534e',
                  '#fbcfe8',
                ].map((hex) => (
                  <button
                    key={hex}
                    onClick={() => updateBackgroundSettings({ type: 'color', value: hex })}
                    className="w-8 h-8 rounded-lg border border-stone-300 hover:scale-110 transition-transform shadow-xs"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Photo Blur Picker */}
          {backgroundSettings.type === 'blur' && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Select Photo for Blurred Background
              </label>
              <div className="grid grid-cols-3 gap-2">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() =>
                      updateBackgroundSettings({
                        type: 'blur',
                        blurAssetUrl: asset.url,
                      })
                    }
                    className={`h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      backgroundSettings.blurAssetUrl === asset.url
                        ? 'border-[#c25e40] ring-2 ring-[#c25e40]/50'
                        : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={asset.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TEXT CAPTIONS */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          <button
            onClick={() =>
              addTextOverlay({
                text: 'YOUR CAPTION',
                fontFamily: 'Playfair Display',
                fontSize: 28,
                color: '#1c1917',
                bgPill: true,
                bgPillColor: 'rgba(255, 255, 255, 0.9)',
              })
            }
            className="w-full py-2.5 rounded-xl bg-[#c25e40] hover:bg-[#a84d32] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Text Caption</span>
          </button>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Text Layers
            </label>

            {textOverlays.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No text overlays added yet.</p>
            ) : (
              textOverlays.map((txt) => {
                const isSelected = selectedOverlayId === txt.id;
                return (
                  <div
                    key={txt.id}
                    className={`p-3 rounded-xl border space-y-3 transition-all ${
                      isSelected
                        ? 'border-[#c25e40] bg-amber-50/50'
                        : 'border-stone-200 bg-stone-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={txt.text}
                        onChange={(e) => updateTextOverlay(txt.id, { text: e.target.value })}
                        onFocus={() => setSelectedOverlayId(txt.id)}
                        className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-[#c25e40]"
                      />
                      <button
                        onClick={() => removeTextOverlay(txt.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-1">Font Family</label>
                        <select
                          value={txt.fontFamily}
                          onChange={(e) =>
                            updateTextOverlay(txt.id, { fontFamily: e.target.value })
                          }
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800"
                        >
                          <option value="Playfair Display">Playfair (Serif)</option>
                          <option value="Inter">Inter (Sans)</option>
                          <option value="Outfit">Outfit (Modern)</option>
                          <option value="Caveat">Caveat (Handwritten)</option>
                          <option value="Montserrat">Montserrat</option>
                          <option value="Space Grotesk">Space Grotesk</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block mb-1">Text Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={txt.color}
                            onChange={(e) => updateTextOverlay(txt.id, { color: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border border-stone-300"
                          />
                          <span className="font-mono text-[11px] text-stone-700">{txt.color}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-stone-500">
                        <span>Size</span>
                        <span>{txt.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="14"
                        max="64"
                        value={txt.fontSize}
                        onChange={(e) =>
                          updateTextOverlay(txt.id, { fontSize: parseInt(e.target.value, 10) })
                        }
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="text-stone-700">Background Pill</label>
                      <button
                        onClick={() => updateTextOverlay(txt.id, { bgPill: !txt.bgPill })}
                        className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                          txt.bgPill ? 'bg-[#c25e40]' : 'bg-stone-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            txt.bgPill ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STICKERS, ICONS & DECORATIONS */}
      {activeTab === 'stickers' && (
        <div className="space-y-4">
          <StickerLibrary
            onAddStickerItem={(registryItem) => {
              const existingCount = document?.elements?.filter((el) => el.type === 'sticker').length || 0;
              const stickerEl = createStickerFromRegistry(registryItem, existingCount, true);
              if (addSticker) {
                addSticker(stickerEl);
              }
            }}
          />
        </div>
      )}
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (md: 768px+) */}
      <aside className="hidden md:flex w-80 border-r border-stone-200/80 bg-white/90 backdrop-blur-md flex-col shrink-0 z-20 overflow-hidden shadow-xs">
        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200/80 bg-stone-100/60 p-1.5 gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all min-w-[60px] ${
                  isActive
                    ? 'bg-[#c25e40] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {renderTabContent()}
        </div>
      </aside>

      {/* MOBILE TOOL PANEL & BOTTOM NAVIGATION DOCK (< md: 768px) */}
      <div data-layout="bottom-nav" className="md:hidden flex flex-col shrink-0 z-30 bg-white border-t border-stone-200">
        {/* Mobile Fixed Tool Dock Bar (Tool Bar: Layouts, Layers, Shapes, Spacing, Background, Text, Stickers) */}
        <div data-layout="mobile-tool-bar" className="h-12 bg-white/95 backdrop-blur-md flex items-center justify-start gap-0.5 px-1 overflow-x-auto overflow-y-hidden no-scrollbar flex-nowrap shrink-0 border-b border-stone-200/60 pb-[env(safe-area-inset-bottom,0px)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && isMobileOpen;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeTab === tab.id && isMobileOpen) {
                    setIsMobileOpen(false);
                  } else {
                    setActiveTab(tab.id);
                    setIsMobileOpen(true);
                  }
                }}
                className={`flex-shrink-0 min-w-[54px] py-1 px-1 flex flex-col items-center justify-center transition-all ${
                  isActive ? 'text-[#c25e40] font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] truncate max-w-[52px]">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Expandable Tool Panel (Appears directly BELOW Tool Bar when opened) */}
        {isMobileOpen && (
          <div data-layout="tool-panel" className="max-h-[30vh] xs:max-h-[32vh] sm:max-h-[35vh] max-h-[260px] min-h-[160px] bg-white border-b border-stone-200 flex flex-col shrink-0 min-h-0 pb-[env(safe-area-inset-bottom,0px)]">
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-stone-200/80 bg-stone-50/90 relative shrink-0 select-none">
              <div className="w-8 h-1 bg-stone-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-1" />
              <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider mt-0.5">
                {tabs.find((t) => t.id === activeTab)?.label || 'Tools'}
              </span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sheet Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs min-h-0 no-scrollbar">
              {renderTabContent()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
