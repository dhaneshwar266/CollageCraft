/**
 * Professional Shapes & Vector System Utilities
 * Resolution-independent vector path generators, SVG utilities,
 * color & gradient style generators, and polygon calculations.
 */

export const SHAPE_TYPES = [
  // Basic
  { id: 'rectangle', label: 'Rectangle', category: 'basic', defaultWidth: 160, defaultHeight: 120 },
  { id: 'rounded-rectangle', label: 'Rounded Rect', category: 'basic', defaultWidth: 160, defaultHeight: 120 },
  { id: 'circle', label: 'Circle', category: 'basic', defaultWidth: 120, defaultHeight: 120 },
  { id: 'ellipse', label: 'Ellipse', category: 'basic', defaultWidth: 160, defaultHeight: 100 },

  // Lines
  { id: 'line', label: 'Line', category: 'lines', defaultWidth: 180, defaultHeight: 20 },
  { id: 'arrow', label: 'Arrow', category: 'lines', defaultWidth: 180, defaultHeight: 24 },

  // Geometry
  { id: 'triangle', label: 'Triangle', category: 'geometry', defaultWidth: 140, defaultHeight: 120 },
  { id: 'diamond', label: 'Diamond', category: 'geometry', defaultWidth: 130, defaultHeight: 130 },
  { id: 'pentagon', label: 'Pentagon', category: 'geometry', defaultWidth: 130, defaultHeight: 130 },
  { id: 'hexagon', label: 'Hexagon', category: 'geometry', defaultWidth: 140, defaultHeight: 120 },
  { id: 'star', label: 'Star', category: 'geometry', defaultWidth: 140, defaultHeight: 140 },

  // Decorative
  { id: 'heart', label: 'Heart', category: 'decorative', defaultWidth: 140, defaultHeight: 130 },
];

/**
 * Normalizes all shape element properties safely
 */
export function normalizeShapeElement(el = {}) {
  const shapeType = el.shapeType || 'rectangle';
  return {
    id: el.id || `shape-${Date.now()}`,
    type: 'shape',
    name: el.name || `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`,
    x: el.x ?? 100,
    y: el.y ?? 100,
    width: el.width ?? 140,
    height: el.height ?? 120,
    rotation: el.rotation ?? 0,
    opacity: el.opacity ?? 1,
    visible: el.visible ?? true,
    locked: el.locked ?? false,
    zIndex: el.zIndex ?? 400,
    groupId: el.groupId || null,

    shapeType: shapeType,

    fill: el.fill || {
      type: 'solid',
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
    fillOpacity: el.fillOpacity ?? 1,

    stroke: el.stroke || '#1e3a8a',
    strokeOpacity: el.strokeOpacity ?? 1,
    strokeWidth: el.strokeWidth ?? 0,
    strokeStyle: el.strokeStyle || 'solid', // 'solid' | 'dashed' | 'dotted'

    cornerRadius: el.cornerRadius ?? (shapeType === 'rounded-rectangle' ? 16 : 0),

    shadow: el.shadow || {
      enabled: false,
      color: '#000000',
      opacity: 0.25,
      blur: 6,
      offsetX: 0,
      offsetY: 3,
    },

    flipH: el.flipH ?? false,
    flipV: el.flipV ?? false,

    sides: el.sides ?? (shapeType === 'pentagon' ? 5 : shapeType === 'hexagon' ? 6 : shapeType === 'star' ? 5 : 3),
    innerRadius: el.innerRadius ?? 0.4, // For Star
    blendMode: el.blendMode || 'normal',
  };
}

/**
 * Generates exact SVG path string `d="..."` for vector rendering
 */
export function getShapeSvgPath(shapeType, w, h, options = {}) {
  const width = Math.max(1, w);
  const height = Math.max(1, h);
  const radius = Math.min(options.cornerRadius || 0, width / 2, height / 2);

  switch (shapeType) {
    case 'rectangle':
      return `M 0 0 H ${width} V ${height} H 0 Z`;

    case 'rounded-rectangle': {
      const r = Math.max(0, radius);
      return `M ${r} 0 
              H ${width - r} 
              A ${r} ${r} 0 0 1 ${width} ${r} 
              V ${height - r} 
              A ${r} ${r} 0 0 1 ${width - r} ${height} 
              H ${r} 
              A ${r} ${r} 0 0 1 0 ${height - r} 
              V ${r} 
              A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }

    case 'circle':
    case 'ellipse': {
      const rx = width / 2;
      const ry = height / 2;
      return `M ${rx} 0 
              A ${rx} ${ry} 0 1 0 ${rx} ${height} 
              A ${rx} ${ry} 0 1 0 ${rx} 0 Z`;
    }

    case 'triangle':
      return `M ${width / 2} 0 L ${width} ${height} L 0 ${height} Z`;

    case 'diamond':
      return `M ${width / 2} 0 L ${width} ${height / 2} L ${width / 2} ${height} L 0 ${height / 2} Z`;

    case 'pentagon':
      return getRegularPolygonPath(width, height, 5);

    case 'hexagon':
      return getRegularPolygonPath(width, height, 6);

    case 'star':
      return getStarPath(width, height, options.sides || 5, options.innerRadius ?? 0.4);

    case 'heart': {
      const cx = width / 2;
      const topY = height * 0.25;
      return `M ${cx} ${height * 0.85}
              C ${width * 0.1} ${height * 0.5}, 0 ${topY}, ${width * 0.25} ${topY * 0.4}
              C ${width * 0.4} 0, ${cx} ${height * 0.25}, ${cx} ${height * 0.35}
              C ${cx} ${height * 0.25}, ${width * 0.6} 0, ${width * 0.75} ${topY * 0.4}
              C ${width} ${topY}, ${width * 0.9} ${height * 0.5}, ${cx} ${height * 0.85} Z`;
    }

    case 'line':
      return `M 0 ${height / 2} L ${width} ${height / 2}`;

    case 'arrow': {
      const headSize = Math.min(24, height * 0.8, width * 0.3);
      const lineEndY = height / 2;
      return `M 0 ${lineEndY} L ${width - headSize} ${lineEndY}
              M ${width - headSize} ${lineEndY - headSize / 2} 
              L ${width} ${lineEndY} 
              L ${width - headSize} ${lineEndY + headSize / 2} Z`;
    }

    default:
      if (options.sides && options.sides >= 3) {
        return getRegularPolygonPath(width, height, options.sides);
      }
      return `M 0 0 H ${width} V ${height} H 0 Z`;
  }
}

/**
 * Calculates regular polygon path (Pentagon, Hexagon, Octagon, etc.)
 */
function getRegularPolygonPath(width, height, sides) {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;
  const points = [];

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

/**
 * Calculates N-pointed Star path
 */
function getStarPath(width, height, numPoints, innerRatio) {
  const cx = width / 2;
  const cy = height / 2;
  const outerRx = width / 2;
  const outerRy = height / 2;
  const innerRx = outerRx * Math.max(0.1, Math.min(0.9, innerRatio));
  const innerRy = outerRy * Math.max(0.1, Math.min(0.9, innerRatio));

  const totalPoints = numPoints * 2;
  const pathParts = [];

  for (let i = 0; i < totalPoints; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;

    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    pathParts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  pathParts.push('Z');
  return pathParts.join(' ');
}

/**
 * Maps strokeStyle ('solid' | 'dashed' | 'dotted') to SVG strokeDasharray
 */
export function getShapeStrokeDasharray(strokeStyle, strokeWidth = 1) {
  const sw = Math.max(1, strokeWidth);
  if (strokeStyle === 'dashed') {
    return `${sw * 4}, ${sw * 2}`;
  }
  if (strokeStyle === 'dotted') {
    return `${sw}, ${sw * 2}`;
  }
  return 'none';
}

/**
 * Calculates common value across multiple shape elements (or returns 'Mixed')
 */
export function getMultiShapeCommonValue(elements = [], key, defaultValue = '') {
  if (!Array.isArray(elements) || elements.length === 0) return defaultValue;
  const shapeElements = elements.filter((el) => el.type === 'shape');
  if (shapeElements.length === 0) return defaultValue;

  const firstVal = shapeElements[0][key];
  const allSame = shapeElements.every((el) => {
    if (typeof firstVal === 'object' && firstVal !== null) {
      return JSON.stringify(el[key]) === JSON.stringify(firstVal);
    }
    return el[key] === firstVal;
  });

  return allSame ? (firstVal ?? defaultValue) : 'Mixed';
}

/**
 * Helper to generate default reset properties
 */
export function getResetShapeFormattingState() {
  return {
    fill: {
      type: 'solid',
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
    fillOpacity: 1,
    stroke: '#1e3a8a',
    strokeWidth: 0,
    strokeStyle: 'solid',
    strokeOpacity: 1,
    cornerRadius: 0,
    shadow: {
      enabled: false,
      color: '#000000',
      opacity: 0.25,
      blur: 6,
      offsetX: 0,
      offsetY: 3,
    },
    opacity: 1,
    blendMode: 'normal',
  };
}
