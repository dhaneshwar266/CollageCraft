import React, { useState, useEffect } from 'react';
import { Search, Star, Clock, Sparkles, Smile, Shapes, Heart } from 'lucide-react';
import { BUILTIN_STICKERS, STICKER_CATEGORIES } from '../../data/stickerRegistry';
import {
  getStickerFavorites,
  toggleStickerFavorite,
  getStickerRecents,
  pushStickerRecent,
} from '../../utils/stickerUtils';

export default function StickerLibrary({ onAddStickerItem }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'stickers' | 'icons' | 'emoji' | 'favorites' | 'recents'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    setFavorites(getStickerFavorites());
    setRecents(getStickerRecents());
  }, []);

  const handleToggleFav = (e, stickerId) => {
    e.stopPropagation();
    const updated = toggleStickerFavorite(stickerId);
    setFavorites(updated);
  };

  const handleSelectSticker = (item) => {
    const updatedRecents = pushStickerRecent(item.id);
    setRecents(updatedRecents);
    if (onAddStickerItem) {
      onAddStickerItem(item);
    }
  };

  // Filter registry items
  const filteredItems = BUILTIN_STICKERS.filter((item) => {
    // 1. Tab filter
    if (activeTab === 'favorites') {
      if (!favorites.includes(item.id)) return false;
    } else if (activeTab === 'recents') {
      if (!recents.includes(item.id)) return false;
    } else if (activeTab === 'stickers') {
      if (item.category === 'emoji' || item.category === 'icons') return false;
    } else if (activeTab === 'icons') {
      if (item.category !== 'icons') return false;
    } else if (activeTab === 'emoji') {
      if (item.category !== 'emoji') return false;
    }

    // 2. Category Pill filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // 3. Live Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = (item.keywords || []).some((kw) => kw.toLowerCase().includes(q));
      return matchName || matchCategory || matchKeywords;
    }

    return true;
  });

  return (
    <div className="space-y-4 select-none">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search stickers, icons, emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-stone-100/80 border border-stone-200/80 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c25e40]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main View Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All', icon: Sparkles },
          { id: 'stickers', label: 'Stickers', icon: Shapes },
          { id: 'icons', label: 'Icons', icon: Heart },
          { id: 'emoji', label: 'Emoji', icon: Smile },
          { id: 'favorites', label: `Favs (${favorites.length})`, icon: Star },
          { id: 'recents', label: 'Recents', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-[#c25e40] text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Pills (When not in Favorites or Recents) */}
      {activeTab !== 'favorites' && activeTab !== 'recents' && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {STICKER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-stone-800 text-white font-bold'
                  : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid Display */}
      {filteredItems.length === 0 ? (
        <div className="py-8 text-center text-stone-400 text-xs">
          No stickers found matching "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleSelectSticker(item)}
                className="group relative bg-stone-50 hover:bg-amber-50/80 border border-stone-200/90 hover:border-amber-300 rounded-2xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs min-h-[70px]"
                title={item.name}
              >
                {/* Favorite Star Toggle */}
                <button
                  onClick={(e) => handleToggleFav(e, item.id)}
                  className={`absolute top-1 right-1 p-1 rounded-full transition-opacity ${
                    isFav ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover:opacity-100 text-stone-400 hover:text-amber-500'
                  }`}
                  title={isFav ? 'Remove Favorite' : 'Mark Favorite'}
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Preview Content */}
                {item.stickerSource === 'emoji' ? (
                  <span className="text-3xl leading-none">{item.content}</span>
                ) : (
                  <svg
                    width="32"
                    height="32"
                    viewBox={item.viewBox || '0 0 24 24'}
                    className="w-8 h-8 pointer-events-none"
                  >
                    <path
                      d={item.content}
                      fill={item.defaultFill || '#3b82f6'}
                      stroke={item.defaultStroke || 'none'}
                      strokeWidth={item.defaultStrokeWidth || 0}
                    />
                  </svg>
                )}

                <span className="text-[10px] font-semibold text-stone-700 truncate w-full text-center mt-1">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
