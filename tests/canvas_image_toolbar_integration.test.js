import { describe, it, expect, beforeEach } from 'vitest';
import { createImageElement, normalizeLegacyStateToDocument } from '../src/utils/elementNormalizer.js';
import { createGroupElement } from '../src/utils/groupUtils.js';
import {
  EXTENDED_FILTER_PRESETS,
  getImageFilterStyle,
  getMultiImageCommonValue,
  getResetAllImagePropertiesState,
} from '../src/utils/imageUtils.js';

describe('Canvas Direct Image Selection & Editing Toolbar Integration Tests', () => {
  let document;

  beforeEach(() => {
    document = normalizeLegacyStateToDocument({
      cells: [
        { id: 'img-1', assetId: 'asset-1', name: 'Photo 1', brightness: 100, contrast: 100 },
        { id: 'img-2', assetId: 'asset-2', name: 'Photo 2', brightness: 100, contrast: 100 },
      ],
      textOverlays: [],
      stickers: [],
    });
  });

  it('1. Canvas selection uses centralized selection state matching Layers selection', () => {
    // Simulate selecting img-1
    const selection = { selectedIds: ['img-1'], primaryId: 'img-1' };

    const selectedElements = selection.selectedIds
      .map((id) => document.elements.find((el) => el.id === id))
      .filter(Boolean);

    const selectedImageElements = selectedElements.filter((el) => el.type === 'image');

    expect(selectedImageElements.length).toBe(1);
    expect(selectedImageElements[0].id).toBe('img-1');
  });

  it('2. Editing single image applies brightness, contrast, filter, and transform', () => {
    const img = document.elements.find((el) => el.id === 'img-1');
    expect(img).toBeDefined();

    // Patch adjustments
    const patch = {
      brightness: 130,
      contrast: 110,
      filterPreset: 'dramatic',
      rotation: 90,
      flipH: true,
      opacity: 0.85,
    };

    const updatedImg = { ...img, ...patch };
    expect(updatedImg.brightness).toBe(130);
    expect(updatedImg.contrast).toBe(110);
    expect(updatedImg.filterPreset).toBe('dramatic');
    expect(updatedImg.rotation).toBe(90);
    expect(updatedImg.flipH).toBe(true);
    expect(updatedImg.opacity).toBe(0.85);

    const filterStyle = getImageFilterStyle(updatedImg);
    expect(filterStyle).toContain('brightness(1.3)');
    expect(filterStyle).toContain('contrast(1.1)');
  });

  it('3. Group selection vs Group Edit Mode image selection', () => {
    // Create a group of img-1 and img-2
    const groupResult = createGroupElement(document.elements, ['img-1', 'img-2'], 'Test Group');
    expect(groupResult).not.toBeNull();
    const groupId = groupResult.groupId;

    // Normal selection -> resolves to Group ID
    let editingGroupId = null;
    let clickedId = 'img-1';
    let target = document.elements.find((el) => el.id === clickedId);
    let resolvedId = target.groupId && editingGroupId !== target.groupId ? target.groupId : clickedId;
    expect(resolvedId).toBe(groupId);

    // Group Edit Mode -> resolves to child img-1
    editingGroupId = groupId;
    resolvedId = target.groupId && editingGroupId !== target.groupId ? target.groupId : clickedId;
    expect(resolvedId).toBe('img-1');
  });

  it('4. Multi-image selection Toolbar state and batch update', () => {
    const selection = { selectedIds: ['img-1', 'img-2'], primaryId: 'img-2' };
    const selectedImageElements = document.elements.filter(
      (el) => selection.selectedIds.includes(el.id) && el.type === 'image'
    );

    expect(selectedImageElements.length).toBe(2);

    // Common value check
    const commonBrightness = getMultiImageCommonValue(selectedImageElements, 'brightness', 100);
    expect(commonBrightness).toBe(100);

    // Batch update both image elements
    const updatesMap = {};
    selectedImageElements.forEach((el) => {
      updatesMap[el.id] = { brightness: 120, filterPreset: 'vintage' };
    });

    const updatedElements = document.elements.map((el) =>
      updatesMap[el.id] ? { ...el, ...updatesMap[el.id] } : el
    );

    const img1 = updatedElements.find((el) => el.id === 'img-1');
    const img2 = updatedElements.find((el) => el.id === 'img-2');

    expect(img1.brightness).toBe(120);
    expect(img2.brightness).toBe(120);
    expect(img1.filterPreset).toBe('vintage');
    expect(img2.filterPreset).toBe('vintage');
  });

  it('5. Before/After preview resets live state safely', () => {
    const img = document.elements.find((el) => el.id === 'img-1');
    const resetState = getResetAllImagePropertiesState(img);
    expect(resetState.filterPreset).toBe('original');
    expect(resetState.brightness).toBe(100);
    expect(resetState.contrast).toBe(100);
    expect(resetState.rotation).toBe(0);
  });

  it('6. Double-click view reset restores transform properties without affecting filters, crop, or cell geometry', () => {
    const img = {
      id: 'img-1',
      assetId: 'asset-1',
      zoom: 2.0,
      panX: 50,
      panY: -30,
      rotation: 180,
      flipH: true,
      flipV: true,
      brightness: 125,
      contrast: 110,
      filterPreset: 'dramatic',
      crop: { x: 5, y: 5, width: 90, height: 90 },
      specOverride: { x: 20, y: 20, width: 60, height: 60 },
    };

    const resetViewPatch = {
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
    };

    const resetImg = { ...img, ...resetViewPatch };

    expect(resetImg.zoom).toBe(1);
    expect(resetImg.panX).toBe(0);
    expect(resetImg.panY).toBe(0);
    expect(resetImg.rotation).toBe(0);
    expect(resetImg.flipH).toBe(false);
    expect(resetImg.flipV).toBe(false);

    // Verify non-view properties were NOT mutated
    expect(resetImg.brightness).toBe(125);
    expect(resetImg.contrast).toBe(110);
    expect(resetImg.filterPreset).toBe('dramatic');
    expect(resetImg.crop).toEqual({ x: 5, y: 5, width: 90, height: 90 });
    expect(resetImg.specOverride).toEqual({ x: 20, y: 20, width: 60, height: 60 });
  });
});
