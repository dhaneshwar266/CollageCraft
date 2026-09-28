import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Image as ImageIcon, 
  Type as TypeIcon, 
  Smile, 
  Shapes, 
  Folder, 
  MoreVertical, 
  Copy, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown, 
  Edit2, 
  Search,
  Layers,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FolderMinus,
  Edit3
} from 'lucide-react';

export default function LayersPanel({
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
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const nameInputRef = useRef(null);
  const menuRef = useRef(null);

  const selectedCount = selection?.selectedIds?.length || 0;

  // Auto-focus input when starting rename
  useEffect(() => {
    if (editingId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingId]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleGroupCollapse = (groupId, e) => {
    if (e) e.stopPropagation();
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // All elements sorted by zIndex DESCENDING
  const elements = document?.elements ? [...document.elements] : [];
  const sortedElements = elements.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  // Top level elements (not inside a group)
  const topLevelElements = sortedElements.filter((el) => !el.groupId);

  const filterMatches = (el) => {
    if (!searchQuery.trim()) return true;
    return (el.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  const handleStartRename = (el) => {
    setEditingId(el.id);
    setEditingName(el.name || '');
    setActiveMenuId(null);
  };

  const handleSaveRename = (id) => {
    if (editingName.trim()) {
      renameElement(id, editingName);
    }
    setEditingId(null);
  };

  const handleKeyDownRename = (e, id) => {
    if (e.key === 'Enter') {
      handleSaveRename(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'text':
        return <TypeIcon className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'sticker':
        return <Smile className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'shape':
        return <Shapes className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'group':
        return <Folder className="w-4 h-4 text-amber-600 shrink-0" />;
      default:
        return <Layers className="w-4 h-4 text-stone-500 shrink-0" />;
    }
  };

  const renderLayerRow = (el, isChild = false) => {
    const isSelected = selection?.selectedIds?.includes(el.id);
    const isPrimary = selection?.primaryId === el.id;
    const isEditing = editingId === el.id;
    const isMenuOpen = activeMenuId === el.id;
    const isGroup = el.type === 'group';
    const isCollapsed = collapsedGroups[el.id];
    const isEditingThisGroup = editingGroupId === el.id;

    const childElements = isGroup
      ? sortedElements.filter((child) => child.groupId === el.id || el.childIds?.includes(child.id))
      : [];

    return (
      <div key={el.id} className="space-y-1">
        <div
          onClick={(e) => {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
              if (toggleSelection) toggleSelection(el.id);
            } else {
              setPrimarySelection(el.id);
            }
          }}
          className={`group relative p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
            isChild ? 'ml-4 bg-stone-50/70' : ''
          } ${
            isPrimary
              ? 'bg-amber-100/90 border-[#c25e40] ring-2 ring-[#c25e40] shadow-xs'
              : isSelected
              ? 'bg-amber-50/80 border-[#c25e40]/70 ring-1 ring-[#c25e40]/40'
              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          } ${!el.visible ? 'opacity-50 bg-stone-100/70' : ''}`}
        >
          {/* Left Controls: Chevron for Group + Visibility & Lock */}
          <div className="flex items-center gap-1 shrink-0">
            {isGroup && (
              <button
                onClick={(e) => toggleGroupCollapse(el.id, e)}
                className="p-1 rounded text-stone-500 hover:text-stone-900"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Visibility Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVisibility(el.id);
              }}
              title={el.visible ? 'Hide layer' : 'Show layer'}
              aria-label={el.visible ? 'Hide layer' : 'Show layer'}
              className={`p-1 rounded-lg transition-colors ${
                el.visible
                  ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
                  : 'text-amber-800 bg-amber-100/70 hover:bg-amber-200'
              }`}
            >
              {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Lock Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLock(el.id);
              }}
              title={el.locked ? 'Unlock layer' : 'Lock layer'}
              aria-label={el.locked ? 'Unlock layer' : 'Lock layer'}
              className={`p-1 rounded-lg transition-colors ${
                el.locked
                  ? 'text-amber-900 bg-amber-200/70 hover:bg-amber-300'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-200/60'
              }`}
            >
              {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Layer Icon & Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getTypeIcon(el.type)}

            {isEditing ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleSaveRename(el.id)}
                onKeyDown={(e) => handleKeyDownRename(e, el.id)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-white border border-[#c25e40] rounded px-1.5 py-0.5 text-xs text-stone-900 focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(el);
                  }}
                  className={`text-xs font-medium truncate ${
                    isSelected ? 'text-stone-900 font-bold' : 'text-stone-700'
                  } ${!el.visible ? 'line-through text-stone-400' : ''}`}
                >
                  {el.name || (isGroup ? 'Group' : 'Unnamed Layer')}
                </span>
                {isGroup && (
                  <span className="text-[10px] text-stone-400 font-mono">
                    ({childElements.length})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Context Menu Trigger */}
          <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : el.id);
              }}
              title="Layer actions"
              aria-label="Layer actions"
              className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Context Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-6 w-44 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 py-1 text-xs text-stone-800 animate-in fade-in duration-100">
                {isGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (setEditingGroupId) {
                        setEditingGroupId(isEditingThisGroup ? null : el.id);
                      }
                      setActiveMenuId(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2 font-semibold text-amber-900"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isEditingThisGroup ? 'Exit Group Edit' : 'Edit Group Children'}</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(el);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Rename Layer</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateElement(el.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Duplicate</span>
                </button>

                {isGroup && ungroupSelectedElement && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      ungroupSelectedElement(el.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2 font-semibold text-stone-800"
                  >
                    <FolderMinus className="w-3.5 h-3.5 text-stone-600" />
                    <span>Ungroup</span>
                  </button>
                )}

                <div className="h-[1px] bg-stone-200 my-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bringForward(el.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-stone-500" />
                  <span>Bring Forward</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendBackward(el.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-stone-500" />
                  <span>Send Backward</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bringToFront(el.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2"
                >
                  <ChevronsUp className="w-3.5 h-3.5 text-stone-500" />
                  <span>Bring to Front</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendToBack(el.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-amber-50 flex items-center gap-2"
                >
                  <ChevronsDown className="w-3.5 h-3.5 text-stone-500" />
                  <span>Send to Back</span>
                </button>

                <div className="h-[1px] bg-stone-200 my-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElement(el.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Layer</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Render Group Children if Expanded */}
        {isGroup && !isCollapsed && childElements.map((child) => renderLayerRow(child, true))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-3 select-none">
      {/* Top Header info for Multi-Selection & Grouping */}
      {selectedCount > 1 && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-semibold shadow-2xs">
          <span>{selectedCount} layers selected</span>
          <div className="flex items-center gap-1">
            {groupSelectedElements && (
              <button
                onClick={groupSelectedElements}
                className="px-2 py-1 rounded-lg bg-[#c25e40] text-white hover:bg-[#a84d32] transition-colors flex items-center gap-1 shadow-2xs text-[11px]"
                title="Group Selected Layers (Cmd+G)"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Group</span>
              </button>
            )}
            {duplicateSelectedElements && (
              <button
                onClick={duplicateSelectedElements}
                className="p-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 transition-colors"
                title="Duplicate Selected Layers"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {deleteSelectedElements && (
              <button
                onClick={deleteSelectedElements}
                className="p-1 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Selected Layers"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Group Edit Mode Banner */}
      {editingGroupId && (
        <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-between text-xs text-amber-950 font-bold shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
            <span>Editing Group Children</span>
          </div>
          <button
            onClick={() => setEditingGroupId(null)}
            className="px-2 py-0.5 rounded-md bg-amber-800 text-white hover:bg-amber-900 text-[10px] font-semibold"
          >
            Exit
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#c25e40] focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
        {topLevelElements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <Layers className="w-8 h-8 text-stone-300 mb-2" />
            <p className="text-xs font-semibold text-stone-500">
              {searchQuery ? 'No matching layers' : 'No layers yet'}
            </p>
            <p className="text-[11px] text-stone-400 max-w-[180px] mt-1">
              {searchQuery ? 'Try another search term' : 'Add photos, text captions or stickers to canvas'}
            </p>
          </div>
        ) : (
          topLevelElements.filter(filterMatches).map((el) => renderLayerRow(el, false))
        )}
      </div>
    </div>
  );
}
