import React, { useState } from 'react';
import {
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  Minus,
  MoveRight,
  Hexagon,
  Shapes,
  X,
} from 'lucide-react';
import { SHAPE_TYPES } from '../../utils/shapeUtils';

export default function ShapeInsertMenu({ onAddShape, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'basic', label: 'Basic' },
    { id: 'lines', label: 'Lines' },
    { id: 'geometry', label: 'Geometry' },
    { id: 'decorative', label: 'Decorative' },
  ];

  const filteredShapes = activeCategory === 'all'
    ? SHAPE_TYPES
    : SHAPE_TYPES.filter((s) => s.category === activeCategory);

  const getShapeIcon = (shapeType) => {
    switch (shapeType) {
      case 'rectangle':
      case 'rounded-rectangle':
        return <Square className="w-5 h-5 text-blue-500" />;
      case 'circle':
      case 'ellipse':
        return <Circle className="w-5 h-5 text-emerald-500" />;
      case 'triangle':
        return <Triangle className="w-5 h-5 text-amber-500" />;
      case 'star':
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />;
      case 'line':
        return <Minus className="w-5 h-5 text-stone-700" />;
      case 'arrow':
        return <MoveRight className="w-5 h-5 text-[#c25e40]" />;
      case 'hexagon':
      case 'pentagon':
      case 'diamond':
        return <Hexagon className="w-5 h-5 text-purple-500" />;
      default:
        return <Shapes className="w-5 h-5 text-stone-600" />;
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 bg-white border border-stone-200/80 rounded-2xl p-3 sm:p-4 select-none box-border">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Shapes className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 font-serif">Add Shape</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Selector */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-stone-100 no-scrollbar w-full">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
              activeCategory === cat.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Shape Grid Buttons */}
      <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-0.5 w-full">
        {filteredShapes.map((shape) => (
          <button
            key={shape.id}
            onClick={() => {
              if (onAddShape) onAddShape(shape.id);
              if (onClose) onClose();
            }}
            className="p-2.5 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 text-stone-800"
          >
            {getShapeIcon(shape.id)}
            <span className="text-[10px] font-semibold truncate w-full text-center">{shape.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
