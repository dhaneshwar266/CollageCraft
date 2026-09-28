/**
 * Group & Ungroup System Utilities
 */
import { getCombinedSelectionBounds } from './selectionGeometry';

/**
 * Creates a new Group element from selected element IDs
 */
export function createGroupElement(elements, selectedIds, groupName = 'Group') {
  if (!elements || !selectedIds || selectedIds.length < 2) {
    return null;
  }

  // Filter valid selected elements (exclude elements that are already in another group)
  const candidateElements = elements.filter((el) => selectedIds.includes(el.id));
  if (candidateElements.length < 2) {
    return null;
  }

  // Calculate combined bounds
  const bounds = getCombinedSelectionBounds(elements, selectedIds);
  if (!bounds) return null;

  const maxZ = Math.max(...candidateElements.map((el) => el.zIndex ?? 100), 100);
  const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const childIds = candidateElements.map((el) => el.id);

  const groupElement = {
    id: groupId,
    type: 'group',
    name: groupName,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: maxZ + 1,
    groupId: null,
    childIds,
  };

  // Update children with groupId reference
  const updatedElements = elements.map((el) => {
    if (childIds.includes(el.id)) {
      return { ...el, groupId: groupId };
    }
    return el;
  });

  return {
    groupElement,
    updatedElements: [...updatedElements, groupElement],
    groupId,
    childIds,
  };
}

/**
 * Ungroups a group element by ID, removing the group container and unsetting child groupId
 */
export function ungroupElement(elements, groupId) {
  const group = elements.find((el) => el.id === groupId && el.type === 'group');
  if (!group) return null;

  const childIds = group.childIds || elements.filter((el) => el.groupId === groupId).map((el) => el.id);

  const updatedElements = elements
    .filter((el) => el.id !== groupId)
    .map((el) => {
      if (el.groupId === groupId) {
        return { ...el, groupId: null };
      }
      return el;
    });

  return {
    updatedElements,
    childIds,
  };
}

/**
 * Resolves clicked element ID to its top-level parent Group ID if not currently editing that group
 */
export function resolveTargetId(elements, clickedId, editingGroupId = null) {
  if (!elements || !clickedId) return clickedId;

  const target = elements.find((el) => el.id === clickedId);
  if (!target) return clickedId;

  if (target.groupId) {
    // If we are currently editing this parent group, return the child ID directly!
    if (editingGroupId === target.groupId) {
      return clickedId;
    }
    // Otherwise resolve to the parent group
    return resolveTargetId(elements, target.groupId, editingGroupId);
  }

  return clickedId;
}

/**
 * Duplicates a group element and all of its child elements
 */
export function duplicateGroup(elements, groupId) {
  const group = elements.find((el) => el.id === groupId && el.type === 'group');
  if (!group) return null;

  const children = elements.filter((el) => el.groupId === groupId || group.childIds?.includes(el.id));
  const newGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const newChildIds = [];
  const duplicatedChildren = [];

  const maxZ = Math.max(...elements.map((el) => el.zIndex ?? 100), 100);
  const offset = 4;

  children.forEach((child, idx) => {
    const newChildId = `${child.type}-${Date.now()}-${idx}`;
    newChildIds.push(newChildId);

    let offsetPatch = {};
    if (child.type === 'image') {
      if (child.specOverride) {
        offsetPatch = {
          specOverride: {
            ...child.specOverride,
            x: child.specOverride.x + offset,
            y: child.specOverride.y + offset,
          },
        };
      } else {
        offsetPatch = {
          freeX: (child.freeX ?? 10) + offset,
          freeY: (child.freeY ?? 10) + offset,
          x: (child.x ?? 10) + offset,
          y: (child.y ?? 10) + offset,
        };
      }
    } else {
      offsetPatch = {
        x: (child.x ?? 50) + offset,
        y: (child.y ?? 50) + offset,
      };
    }

    duplicatedChildren.push({
      ...child,
      ...offsetPatch,
      id: newChildId,
      groupId: newGroupId,
      name: `${child.name || 'Layer'} Copy`,
      zIndex: maxZ + idx + 1,
    });
  });

  const duplicatedGroup = {
    ...group,
    id: newGroupId,
    name: `${group.name || 'Group'} Copy`,
    x: group.x + offset,
    y: group.y + offset,
    zIndex: maxZ + children.length + 2,
    groupId: null,
    childIds: newChildIds,
  };

  const updatedElements = [...elements, ...duplicatedChildren, duplicatedGroup];

  return {
    duplicatedGroup,
    updatedElements,
    newGroupId,
    newChildIds,
  };
}

/**
 * Deletes a group element and all of its child elements
 */
export function deleteGroup(elements, groupId) {
  const group = elements.find((el) => el.id === groupId && el.type === 'group');
  if (!group) return elements;

  const childIdsSet = new Set(group.childIds || []);
  elements.forEach((el) => {
    if (el.groupId === groupId) {
      childIdsSet.add(el.id);
    }
  });

  return elements.filter((el) => el.id !== groupId && !childIdsSet.has(el.id));
}

/**
 * Checks if an element is hidden due to group inheritance
 */
export function isElementHidden(elements, el) {
  if (el.visible === false) return true;
  if (el.groupId) {
    const parentGroup = elements.find((g) => g.id === el.groupId);
    if (parentGroup) {
      return isElementHidden(elements, parentGroup);
    }
  }
  return false;
}

/**
 * Checks if an element is locked due to group inheritance
 */
export function isElementLocked(elements, el) {
  if (el.locked === true) return true;
  if (el.groupId) {
    const parentGroup = elements.find((g) => g.id === el.groupId);
    if (parentGroup) {
      return isElementLocked(elements, parentGroup);
    }
  }
  return false;
}
