import React from 'react';
import { normalizeStickerElement } from '../../utils/stickerUtils';

export default function StickerRenderer({ sticker, isSelected, onClick, onMouseDown }) {
  if (!sticker || sticker.visible === false) return null;

  const normalized = normalizeStickerElement(sticker);
  const {
    id,
    stickerSource,
    content,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    shadow,
    opacity,
    blendMode,
    flipH,
    flipV,
    viewBox,
  } = normalized;

  // 1. RENDER EMOJI STICKER
  if (stickerSource === 'emoji') {
    return (
      <div
        className="w-full h-full flex items-center justify-center select-none pointer-events-auto cursor-pointer"
        onClick={onClick}
        onMouseDown={onMouseDown}
        style={{
          opacity: opacity,
          mixBlendMode: blendMode !== 'normal' ? blendMode : undefined,
          transform: `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
          filter: shadow?.enabled
            ? `drop-shadow(${shadow.offsetX || 0}px ${shadow.offsetY || 2}px ${shadow.blur || 4}px ${shadow.color || 'rgba(0,0,0,0.3)'})`
            : undefined,
        }}
      >
        <span
          className="leading-none text-center"
          style={{
            fontSize: `${Math.min(width, height)}px`,
          }}
        >
          {content}
        </span>
      </div>
    );
  }

  // 2. RENDER SVG VECTOR STICKER / ICON
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={viewBox || '0 0 24 24'}
      preserveAspectRatio="xMidYMid meet"
      className="overflow-visible pointer-events-auto cursor-pointer select-none"
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{
        opacity: opacity,
        mixBlendMode: blendMode !== 'normal' ? blendMode : undefined,
        transform: `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
      }}
    >
      {shadow?.enabled && (
        <defs>
          <filter id={`sticker-shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx={shadow.offsetX || 0}
              dy={shadow.offsetY || 2}
              stdDeviation={shadow.blur ? shadow.blur / 2 : 3}
              floodColor={shadow.color || '#000000'}
              floodOpacity={shadow.opacity ?? 0.25}
            />
          </filter>
        </defs>
      )}

      <path
        d={content}
        fill={fill || 'none'}
        stroke={strokeWidth > 0 ? (stroke || '#000000') : 'none'}
        strokeWidth={strokeWidth || 0}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={shadow?.enabled ? `url(#sticker-shadow-${id})` : undefined}
      />
    </svg>
  );
}
