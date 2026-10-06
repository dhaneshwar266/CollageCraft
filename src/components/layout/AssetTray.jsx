import React, { useRef, useState } from 'react';
import { 
  ImagePlus, 
  Trash2, 
  Copy, 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  Upload
} from 'lucide-react';

export default function AssetTray({
  assets,
  onAddAsset,
  onRemoveAsset,
  onLoadSamplePhotos,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const img = new Image();
        img.onload = () => {
          onAddAsset({
            id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            url: dataUrl,
            width: img.naturalWidth || img.width || 800,
            height: img.naturalHeight || img.height || 800,
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDuplicate = (asset) => {
    onAddAsset({
      id: `asset-dup-${Date.now()}`,
      name: `${asset.name} (Copy)`,
      url: asset.url,
    });
  };

  return (
    <div
      data-layout="asset-tray"
      className={`border-t border-stone-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 z-20 flex flex-col shrink-0 mb-0 ${
        isCollapsed ? 'h-9 md:h-10' : 'h-24 md:h-32 sm:h-36'
      }`}
    >
      {/* Tray Header & Controls */}
      <div className="h-9 md:h-10 px-2 sm:px-4 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/80 select-none shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-stone-700 hover:text-stone-900 flex items-center gap-1.5 text-xs font-semibold"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-xs">Asset Tray ({assets.length} Photos)</span>
          </button>
        </div>

        {/* Load Sample Photos CTA & Add Photos */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onLoadSamplePhotos}
            className="px-2 sm:px-3 py-1 rounded-lg bg-amber-100/70 hover:bg-amber-100 text-amber-900 border border-amber-300/60 text-[11px] sm:text-xs font-medium transition-colors flex items-center gap-1 sm:gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">Load Sample Photos</span>
            <span className="sm:hidden">Samples</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 sm:px-3 py-1 rounded-lg bg-[#c25e40] hover:bg-[#a84d32] text-white text-[11px] sm:text-xs font-semibold shadow-xs transition-all flex items-center gap-1 sm:gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Upload Photos</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Thumbnails Row */}
      {!isCollapsed && (
        <div className="flex-1 p-1.5 md:p-3 overflow-x-auto flex items-center gap-2 md:gap-3 no-scrollbar min-h-0">
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', asset.id);
                e.dataTransfer.setData('application/json', JSON.stringify({ assetId: asset.id }));
              }}
              className="h-14 w-14 md:h-24 md:w-24 shrink-0 rounded-xl bg-stone-100 border border-stone-200 relative group overflow-hidden shadow-xs cursor-grab active:cursor-grabbing hover:border-[#c25e40] transition-all"
            >
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />

              {/* Index Chip */}
              <span className="absolute top-1 left-1 bg-white/90 text-[10px] font-mono font-bold text-stone-800 px-1.5 py-0.5 rounded-md border border-stone-200">
                #{index + 1}
              </span>

              {/* Hover Actions Overlay */}
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                <button
                  onClick={() => handleDuplicate(asset)}
                  title="Duplicate photo"
                  className="p-1.5 rounded-lg bg-white text-stone-800 hover:bg-[#c25e40] hover:text-white transition-colors shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRemoveAsset(asset.id)}
                  disabled={assets.length <= 1}
                  title="Remove photo"
                  className={`p-1.5 rounded-lg transition-colors shadow-xs ${
                    assets.length > 1
                      ? 'bg-white text-stone-800 hover:bg-rose-600 hover:text-white'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Dropzone Tile */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-14 w-16 md:h-24 md:w-28 shrink-0 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#c25e40] bg-stone-50 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center gap-0.5 md:gap-1 text-stone-500 hover:text-[#c25e40] group"
          >
            <ImagePlus className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] md:text-[11px] font-medium">Add Photo</span>
          </button>
        </div>
      )}
    </div>
  );
}
