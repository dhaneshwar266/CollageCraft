import React from 'react';
import { getShapeSvgPath, getShapeStrokeDasharray, normalizeShapeElement } from '../../utils/shapeUtils';

export default function ShapeRenderer({ shape, isSelected, onClick, onMouseDown }) {
  if (!shape || shape.visible === false) return null;

  const normalized = normalizeShapeElement(shape);
  const {
    id,
    shapeType,
    width,
    height,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    strokeStyle,
    strokeOpacity,
    cornerRadius,
    sides,
    innerRadius,
    shadow,
    opacity,
    blendMode,
    flipH,
    flipV,
  } = normalized;

  const pathD = getShapeSvgPath(shapeType, width, height, { cornerRadius, sides, innerRadius });
  const strokeDash = getShapeStrokeDasharray(strokeStyle, strokeWidth);

  // Gradient ID uniquely generated for SVG <defs>
  const gradientId = `shape-grad-${id}`;

  const renderFill = () => {
    if (!fill) return 'none';
    if (typeof fill === 'string') return fill;
    if (fill.type === 'transparent') return 'none';
    if (fill.type === 'linear' || fill.type === 'radial' || (fill.gradient && fill.type !== 'solid')) {
      return `url(#${gradientId})`;
    }
    return fill.color || '#3b82f6';
  };

  const isLineOrArrow = shapeType === 'line' || shapeType === 'arrow';

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible pointer-events-none"
      style={{
        opacity: opacity,
        mixBlendMode: blendMode !== 'normal' ? blendMode : undefined,
        transform: `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
      }}
    >
      <defs>
        {/* SVG Gradient Defs if fill type is gradient */}
        {fill && typeof fill === 'object' && fill.gradient && (
          <>
            {fill.type === 'radial' ? (
              <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                {(fill.gradient.stops || []).map((stop, idx) => (
                  <stop key={idx} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </radialGradient>
            ) : (
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2={`${Math.cos(((fill.gradient.angle || 0) * Math.PI) / 180) * 100}%`}
                y2={`${Math.sin(((fill.gradient.angle || 0) * Math.PI) / 180) * 100}%`}
              >
                {(fill.gradient.stops || []).map((stop, idx) => (
                  <stop key={idx} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                ))}
              </linearGradient>
            )}
          </>
        )}

        {/* Drop Shadow Filter if enabled */}
        {shadow?.enabled && (
          <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx={shadow.offsetX || 0}
              dy={shadow.offsetY || 3}
              stdDeviation={shadow.blur ? shadow.blur / 2 : 3}
              floodColor={shadow.color || '#000000'}
              floodOpacity={shadow.opacity ?? 0.25}
            />
          </filter>
        )}
      </defs>

      {/* Invisible wider hit area for line/arrow elements */}
      {isLineOrArrow && (
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(20, strokeWidth + 12)}
          strokeLinecap="round"
          className="pointer-events-auto cursor-pointer"
          onClick={onClick}
          onMouseDown={onMouseDown}
        />
      )}

      {/* Main Rendered Vector Path */}
      <path
        d={pathD}
        fill={renderFill()}
        fillOpacity={fillOpacity}
        stroke={strokeWidth > 0 ? stroke : 'none'}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash !== 'none' ? strokeDash : undefined}
        strokeOpacity={strokeOpacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={shadow?.enabled ? `url(#shadow-${id})` : undefined}
        className="pointer-events-auto cursor-pointer transition-opacity"
        onClick={onClick}
        onMouseDown={onMouseDown}
      />
    </svg>
  );
}
