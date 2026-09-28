export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square (Instagram)', ratio: 1 / 1, width: 1080, height: 1080 },
  { id: '4:5', label: '4:5 Portrait (Insta Post)', ratio: 4 / 5, width: 1080, height: 1350 },
  { id: '9:16', label: '9:16 Story / Reel', ratio: 9 / 16, width: 1080, height: 1920 },
  { id: '16:9', label: '16:9 Landscape (Banner)', ratio: 16 / 9, width: 1920, height: 1080 },
  { id: '3:2', label: '3:2 Classic Print', ratio: 3 / 2, width: 1200, height: 800 },
];

export const LAYOUT_PRESETS = [
  // --- 1 PHOTO ---
  {
    id: 'single-photo',
    name: 'Single Full Photo',
    photoCount: 1,
    capacity: 1,
    minImages: 1,
    maxImages: 1,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 100, height: 100 },
    ],
  },
  {
    id: 'single-framed',
    name: 'Single Framed Border',
    photoCount: 1,
    capacity: 1,
    minImages: 1,
    maxImages: 1,
    category: 'Hero / Featured',
    cells: [
      { x: 5, y: 5, width: 90, height: 90 },
    ],
  },

  // --- 2 PHOTOS ---
  {
    id: 'side-by-side',
    name: 'Side by Side (50/50)',
    photoCount: 2,
    capacity: 2,
    minImages: 2,
    maxImages: 2,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 100 },
    ],
  },
  {
    id: 'vertical-split',
    name: 'Top & Bottom (50/50)',
    photoCount: 2,
    capacity: 2,
    minImages: 2,
    maxImages: 2,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 50, width: 100, height: 50 },
    ],
  },
  {
    id: 'asymmetric-70-30',
    name: 'Hero Asymmetric (70/30)',
    photoCount: 2,
    capacity: 2,
    minImages: 2,
    maxImages: 2,
    category: 'Asymmetric',
    cells: [
      { x: 0, y: 0, width: 70, height: 100 },
      { x: 70, y: 0, width: 30, height: 100 },
    ],
  },

  // --- 3 PHOTOS ---
  {
    id: '1-left-2-right',
    name: 'Hero Left + 2 Right',
    photoCount: 3,
    capacity: 3,
    minImages: 3,
    maxImages: 3,
    category: 'Hero / Featured',
    cells: [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ],
  },
  {
    id: '1-top-2-bottom',
    name: 'Hero Top + 2 Bottom',
    photoCount: 3,
    capacity: 3,
    minImages: 3,
    maxImages: 3,
    category: 'Hero / Featured',
    cells: [
      { x: 0, y: 0, width: 100, height: 60 },
      { x: 0, y: 60, width: 50, height: 40 },
      { x: 50, y: 60, width: 50, height: 40 },
    ],
  },
  {
    id: '3-equal-columns',
    name: '3 Vertical Strips',
    photoCount: 3,
    capacity: 3,
    minImages: 3,
    maxImages: 3,
    category: 'Balanced',
    cells: [
      { x: 0, y: 0, width: 33.33, height: 100 },
      { x: 33.33, y: 0, width: 33.34, height: 100 },
      { x: 66.67, y: 0, width: 33.33, height: 100 },
    ],
  },
  {
    id: 'magazine-triptych',
    name: 'Magazine Triptych',
    photoCount: 3,
    capacity: 3,
    minImages: 3,
    maxImages: 3,
    category: 'Magazine',
    cells: [
      { x: 0, y: 0, width: 28, height: 100 },
      { x: 28, y: 0, width: 44, height: 100 },
      { x: 72, y: 0, width: 28, height: 100 },
    ],
  },

  // --- 4 PHOTOS ---
  {
    id: '2x2-grid',
    name: 'Classic 2 × 2 Grid',
    photoCount: 4,
    capacity: 4,
    minImages: 4,
    maxImages: 4,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 0, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ],
  },
  {
    id: '1-hero-3-side',
    name: '1 Hero + 3 Stacked',
    photoCount: 4,
    capacity: 4,
    minImages: 4,
    maxImages: 4,
    category: 'Hero / Featured',
    cells: [
      { x: 0, y: 0, width: 65, height: 100 },
      { x: 65, y: 0, width: 35, height: 33.33 },
      { x: 65, y: 33.33, width: 35, height: 33.34 },
      { x: 65, y: 66.67, width: 35, height: 33.33 },
    ],
  },
  {
    id: '4-vertical-strips',
    name: '4 Vertical Strips',
    photoCount: 4,
    capacity: 4,
    minImages: 4,
    maxImages: 4,
    category: 'Balanced',
    cells: [
      { x: 0, y: 0, width: 25, height: 100 },
      { x: 25, y: 0, width: 25, height: 100 },
      { x: 50, y: 0, width: 25, height: 100 },
      { x: 75, y: 0, width: 25, height: 100 },
    ],
  },
  {
    id: 'bento-4',
    name: 'Bento Grid 4',
    photoCount: 4,
    capacity: 4,
    minImages: 4,
    maxImages: 4,
    category: 'Magazine',
    cells: [
      { x: 0, y: 0, width: 60, height: 60 },
      { x: 60, y: 0, width: 40, height: 30 },
      { x: 60, y: 30, width: 40, height: 70 },
      { x: 0, y: 60, width: 60, height: 40 },
    ],
  },

  // --- 5 PHOTOS ---
  {
    id: 'bento-5',
    name: '5 Photo Bento Grid',
    photoCount: 5,
    capacity: 5,
    minImages: 5,
    maxImages: 5,
    category: 'Magazine',
    cells: [
      { x: 0, y: 0, width: 50, height: 60 },
      { x: 50, y: 0, width: 50, height: 30 },
      { x: 50, y: 30, width: 50, height: 30 },
      { x: 0, y: 60, width: 33.33, height: 40 },
      { x: 33.33, y: 60, width: 66.67, height: 40 },
    ],
  },
  {
    id: 'hero-top-4-grid',
    name: '1 Hero Top + 4 Grid',
    photoCount: 5,
    capacity: 5,
    minImages: 5,
    maxImages: 5,
    category: 'Hero / Featured',
    cells: [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 50, width: 25, height: 50 },
      { x: 25, y: 50, width: 25, height: 50 },
      { x: 50, y: 50, width: 25, height: 50 },
      { x: 75, y: 50, width: 25, height: 50 },
    ],
  },
  {
    id: 'center-featured-5',
    name: 'Center Hero + 4 Frame',
    photoCount: 5,
    capacity: 5,
    minImages: 5,
    maxImages: 5,
    category: 'Mosaic',
    cells: [
      { x: 25, y: 25, width: 50, height: 50 },
      { x: 0, y: 0, width: 50, height: 25 },
      { x: 50, y: 0, width: 50, height: 25 },
      { x: 0, y: 75, width: 50, height: 25 },
      { x: 50, y: 75, width: 50, height: 25 },
    ],
  },

  // --- 6 PHOTOS ---
  {
    id: 'filmstrip-6',
    name: 'Classic 3 × 2 Grid',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 33.33, height: 50 },
      { x: 33.33, y: 0, width: 33.34, height: 50 },
      { x: 66.67, y: 0, width: 33.33, height: 50 },
      { x: 0, y: 50, width: 33.33, height: 50 },
      { x: 33.33, y: 50, width: 33.34, height: 50 },
      { x: 66.67, y: 50, width: 33.33, height: 50 },
    ],
  },
  {
    id: 'grid-2x3-vertical',
    name: 'Vertical 2 × 3 Grid',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Balanced',
    cells: [
      { x: 0, y: 0, width: 50, height: 33.33 },
      { x: 50, y: 0, width: 50, height: 33.33 },
      { x: 0, y: 33.33, width: 50, height: 33.34 },
      { x: 50, y: 33.33, width: 50, height: 33.34 },
      { x: 0, y: 66.67, width: 50, height: 33.33 },
      { x: 50, y: 66.67, width: 50, height: 33.33 },
    ],
  },
  {
    id: '1-hero-5-small',
    name: '1 Hero Left + 5 Grid',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Hero / Featured',
    cells: [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 33.33 },
      { x: 50, y: 33.33, width: 25, height: 33.34 },
      { x: 75, y: 33.33, width: 25, height: 33.34 },
      { x: 50, y: 66.67, width: 25, height: 33.33 },
      { x: 75, y: 66.67, width: 25, height: 33.33 },
    ],
  },
  {
    id: '1-hero-top-5-grid',
    name: '1 Hero Top + 5 Grid',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Hero / Featured',
    cells: [
      { x: 0, y: 0, width: 100, height: 60 },
      { x: 0, y: 60, width: 20, height: 40 },
      { x: 20, y: 60, width: 20, height: 40 },
      { x: 40, y: 60, width: 20, height: 40 },
      { x: 60, y: 60, width: 20, height: 40 },
      { x: 80, y: 60, width: 20, height: 40 },
    ],
  },
  {
    id: '6-vertical-strips',
    name: '6 Vertical Strips',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Balanced',
    cells: [
      { x: 0, y: 0, width: 16.66, height: 100 },
      { x: 16.66, y: 0, width: 16.67, height: 100 },
      { x: 33.33, y: 0, width: 16.67, height: 100 },
      { x: 50, y: 0, width: 16.67, height: 100 },
      { x: 66.67, y: 0, width: 16.67, height: 100 },
      { x: 83.34, y: 0, width: 16.66, height: 100 },
    ],
  },
  {
    id: '6-horizontal-rows',
    name: '6 Horizontal Rows',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Balanced',
    cells: [
      { x: 0, y: 0, width: 100, height: 16.66 },
      { x: 0, y: 16.66, width: 100, height: 16.67 },
      { x: 0, y: 33.33, width: 100, height: 16.67 },
      { x: 0, y: 50, width: 100, height: 16.67 },
      { x: 0, y: 66.67, width: 100, height: 16.67 },
      { x: 0, y: 83.34, width: 100, height: 16.66 },
    ],
  },
  {
    id: 'bento-6',
    name: '6 Photo Bento Grid',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Magazine',
    cells: [
      { x: 0, y: 0, width: 60, height: 50 },
      { x: 60, y: 0, width: 40, height: 25 },
      { x: 60, y: 25, width: 40, height: 25 },
      { x: 0, y: 50, width: 33.33, height: 50 },
      { x: 33.33, y: 50, width: 33.34, height: 50 },
      { x: 66.67, y: 50, width: 33.33, height: 50 },
    ],
  },
  {
    id: 'asymmetric-6-mosaic',
    name: '6 Photo Asymmetric Mosaic',
    photoCount: 6,
    capacity: 6,
    minImages: 6,
    maxImages: 6,
    category: 'Asymmetric',
    cells: [
      { x: 0, y: 0, width: 40, height: 60 },
      { x: 40, y: 0, width: 60, height: 40 },
      { x: 40, y: 40, width: 30, height: 30 },
      { x: 70, y: 40, width: 30, height: 30 },
      { x: 0, y: 60, width: 40, height: 40 },
      { x: 40, y: 70, width: 60, height: 30 },
    ],
  },

  // --- 7 PHOTOS ---
  {
    id: 'grid-7-hero-top',
    name: '1 Hero Top + 6 Grid',
    photoCount: 7,
    capacity: 7,
    minImages: 7,
    maxImages: 7,
    category: 'Hero / Featured',
    cells: [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 50, width: 33.33, height: 25 },
      { x: 33.33, y: 50, width: 33.34, height: 25 },
      { x: 66.67, y: 50, width: 33.33, height: 25 },
      { x: 0, y: 75, width: 33.33, height: 25 },
      { x: 33.33, y: 75, width: 33.34, height: 25 },
      { x: 66.67, y: 75, width: 33.33, height: 25 },
    ],
  },

  // --- 8 PHOTOS ---
  {
    id: 'grid-8-classic',
    name: 'Classic 4 × 2 Grid',
    photoCount: 8,
    capacity: 8,
    minImages: 8,
    maxImages: 8,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 25, height: 50 },
      { x: 25, y: 0, width: 25, height: 50 },
      { x: 50, y: 0, width: 25, height: 50 },
      { x: 75, y: 0, width: 25, height: 50 },
      { x: 0, y: 50, width: 25, height: 50 },
      { x: 25, y: 50, width: 25, height: 50 },
      { x: 50, y: 50, width: 25, height: 50 },
      { x: 75, y: 50, width: 25, height: 50 },
    ],
  },
  {
    id: 'grid-8-bento',
    name: '8 Photo Bento Mosaic',
    photoCount: 8,
    capacity: 8,
    minImages: 8,
    maxImages: 8,
    category: 'Mosaic',
    cells: [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 25, height: 25 },
      { x: 75, y: 0, width: 25, height: 25 },
      { x: 50, y: 25, width: 50, height: 25 },
      { x: 0, y: 50, width: 25, height: 50 },
      { x: 25, y: 50, width: 25, height: 25 },
      { x: 25, y: 75, width: 25, height: 25 },
      { x: 50, y: 50, width: 50, height: 50 },
    ],
  },

  // --- 9 PHOTOS ---
  {
    id: 'grid-3x3',
    name: 'Classic 3 × 3 Grid',
    photoCount: 9,
    capacity: 9,
    minImages: 9,
    maxImages: 9,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 33.33, height: 33.33 },
      { x: 33.33, y: 0, width: 33.34, height: 33.33 },
      { x: 66.67, y: 0, width: 33.33, height: 33.33 },
      { x: 0, y: 33.33, width: 33.33, height: 33.34 },
      { x: 33.33, y: 33.33, width: 33.34, height: 33.34 },
      { x: 66.67, y: 33.33, width: 33.33, height: 33.34 },
      { x: 0, y: 66.67, width: 33.33, height: 33.33 },
      { x: 33.33, y: 66.67, width: 33.34, height: 33.33 },
      { x: 66.67, y: 66.67, width: 33.33, height: 33.33 },
    ],
  },

  // --- 10 PHOTOS ---
  {
    id: 'grid-10-5x2',
    name: 'Classic 5 × 2 Grid',
    photoCount: 10,
    capacity: 10,
    minImages: 10,
    maxImages: 10,
    category: 'Classic',
    cells: [
      { x: 0, y: 0, width: 20, height: 50 },
      { x: 20, y: 0, width: 20, height: 50 },
      { x: 40, y: 0, width: 20, height: 50 },
      { x: 60, y: 0, width: 20, height: 50 },
      { x: 80, y: 0, width: 20, height: 50 },
      { x: 0, y: 50, width: 20, height: 50 },
      { x: 20, y: 50, width: 20, height: 50 },
      { x: 40, y: 50, width: 20, height: 50 },
      { x: 60, y: 50, width: 20, height: 50 },
      { x: 80, y: 50, width: 20, height: 50 },
    ],
  },
  {
    id: 'grid-10-hero-center',
    name: '2 Hero Center + 8 Frame',
    photoCount: 10,
    capacity: 10,
    minImages: 10,
    maxImages: 10,
    category: 'Hero / Featured',
    cells: [
      { x: 25, y: 25, width: 50, height: 25 },
      { x: 25, y: 50, width: 50, height: 25 },
      { x: 0, y: 0, width: 25, height: 50 },
      { x: 0, y: 50, width: 25, height: 50 },
      { x: 75, y: 0, width: 25, height: 50 },
      { x: 75, y: 50, width: 25, height: 50 },
      { x: 25, y: 0, width: 25, height: 25 },
      { x: 50, y: 0, width: 25, height: 25 },
      { x: 25, y: 75, width: 25, height: 25 },
      { x: 50, y: 75, width: 25, height: 25 },
    ],
  },

  // --- 11 PHOTOS ---
  {
    id: 'grid-11-mosaic',
    name: '1 Hero + 10 Mosaic',
    photoCount: 11,
    capacity: 11,
    minImages: 11,
    maxImages: 11,
    category: 'Mosaic',
    cells: [
      { x: 0, y: 0, width: 50, height: 60 },
      { x: 50, y: 0, width: 25, height: 30 },
      { x: 75, y: 0, width: 25, height: 30 },
      { x: 50, y: 30, width: 25, height: 30 },
      { x: 75, y: 30, width: 25, height: 30 },
      { x: 0, y: 60, width: 20, height: 40 },
      { x: 20, y: 60, width: 20, height: 40 },
      { x: 40, y: 60, width: 20, height: 40 },
      { x: 60, y: 60, width: 20, height: 40 },
      { x: 80, y: 60, width: 20, height: 40 },
      { x: 50, y: 60, width: 50, height: 40 },
    ].slice(0, 11),
  },

  // --- 12 PHOTOS ---
  {
    id: 'grid-12-4x3',
    name: 'Classic 4 × 3 Grid',
    photoCount: 12,
    capacity: 12,
    minImages: 12,
    maxImages: 12,
    category: 'Classic',
    cells: Array.from({ length: 12 }, (_, i) => ({
      x: (i % 4) * 25,
      y: Math.floor(i / 4) * 33.33,
      width: 25,
      height: 33.33,
    })),
  },

  // --- 13 PHOTOS ---
  {
    id: 'grid-13-hero',
    name: '1 Hero + 12 Frame',
    photoCount: 13,
    capacity: 13,
    minImages: 13,
    maxImages: 13,
    category: 'Hero / Featured',
    cells: [
      { x: 25, y: 25, width: 50, height: 50 },
      ...Array.from({ length: 12 }, (_, i) => ({
        x: (i % 4) * 25,
        y: Math.floor(i / 4) * 25,
        width: 25,
        height: 25,
      })).filter((c) => !(c.x >= 25 && c.x < 75 && c.y >= 25 && c.y < 75)),
      ...Array.from({ length: 8 }, (_, i) => ({
        x: (i % 4) * 25,
        y: (i < 4 ? 0 : 75),
        width: 25,
        height: 25,
      })),
    ].slice(0, 13),
  },

  // --- 14 PHOTOS ---
  {
    id: 'grid-14-7x2',
    name: 'Classic 7 × 2 Grid',
    photoCount: 14,
    capacity: 14,
    minImages: 14,
    maxImages: 14,
    category: 'Classic',
    cells: Array.from({ length: 14 }, (_, i) => ({
      x: (i % 7) * (100 / 7),
      y: Math.floor(i / 7) * 50,
      width: 100 / 7,
      height: 50,
    })),
  },

  // --- 15 PHOTOS ---
  {
    id: 'grid-15-5x3',
    name: 'Classic 5 × 3 Grid',
    photoCount: 15,
    capacity: 15,
    minImages: 15,
    maxImages: 15,
    category: 'Classic',
    cells: Array.from({ length: 15 }, (_, i) => ({
      x: (i % 5) * 20,
      y: Math.floor(i / 5) * 33.33,
      width: 20,
      height: 33.33,
    })),
  },

  // --- 16 PHOTOS ---
  {
    id: 'grid-16-4x4',
    name: 'Classic 4 × 4 Grid',
    photoCount: 16,
    capacity: 16,
    minImages: 16,
    maxImages: 16,
    category: 'Classic',
    cells: Array.from({ length: 16 }, (_, i) => ({
      x: (i % 4) * 25,
      y: Math.floor(i / 4) * 25,
      width: 25,
      height: 25,
    })),
  },

  // --- 17 PHOTOS ---
  {
    id: 'grid-17-mosaic',
    name: '17 Photo Mosaic Grid',
    photoCount: 17,
    capacity: 17,
    minImages: 17,
    maxImages: 17,
    category: 'Mosaic',
    cells: Array.from({ length: 17 }, (_, i) => ({
      x: (i % 5) * 20,
      y: Math.floor(i / 5) * 25,
      width: i >= 15 ? 50 : 20,
      height: 25,
    })),
  },

  // --- 18 PHOTOS ---
  {
    id: 'grid-18-6x3',
    name: 'Classic 6 × 3 Grid',
    photoCount: 18,
    capacity: 18,
    minImages: 18,
    maxImages: 18,
    category: 'Classic',
    cells: Array.from({ length: 18 }, (_, i) => ({
      x: (i % 6) * (100 / 6),
      y: Math.floor(i / 6) * 33.33,
      width: 100 / 6,
      height: 33.33,
    })),
  },

  // --- 19 PHOTOS ---
  {
    id: 'grid-19-mosaic',
    name: '19 Photo Mosaic Grid',
    photoCount: 19,
    capacity: 19,
    minImages: 19,
    maxImages: 19,
    category: 'Mosaic',
    cells: Array.from({ length: 19 }, (_, i) => ({
      x: (i % 5) * 20,
      y: Math.floor(i / 5) * 25,
      width: i === 18 ? 100 : (i >= 15 ? 50 : 20),
      height: 25,
    })),
  },

  // --- 20 PHOTOS ---
  {
    id: 'grid-20-5x4',
    name: 'Classic 5 × 4 Grid',
    photoCount: 20,
    capacity: 20,
    minImages: 20,
    maxImages: 20,
    category: 'Classic',
    cells: Array.from({ length: 20 }, (_, i) => ({
      x: (i % 5) * 20,
      y: Math.floor(i / 5) * 25,
      width: 20,
      height: 25,
    })),
  },
];

// Helper to generate dynamic grid layout for N count if no exact template is picked
export function getAutoGridLayout(count) {
  if (count <= 1) {
    return [{ x: 0, y: 0, width: 100, height: 100 }];
  }
  if (count === 2) {
    return [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 100 },
    ];
  }
  if (count === 3) {
    return [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ];
  }
  if (count === 4) {
    return [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 0, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ];
  }

  // Calculate N rows and cols
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;

  const cells = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    // Handle last row width filling if count doesn't fill grid evenly
    let w = cellWidth;
    let x = col * cellWidth;
    const isLastRow = row === rows - 1;
    const itemsInLastRow = count - row * cols;
    if (isLastRow && itemsInLastRow < cols) {
      w = 100 / itemsInLastRow;
      x = (i % cols) * w;
    }

    cells.push({
      x,
      y: row * cellHeight,
      width: w,
      height: cellHeight,
    });
  }

  return cells;
}

// Get best default layout based on image count
export function getDefaultLayoutForCount(count) {
  if (count <= 2) return 'side-by-side';
  if (count === 3) return '1-left-2-right';
  if (count === 4) return '2x2-grid';
  if (count === 5) return 'bento-5';
  return 'filmstrip-6';
}
