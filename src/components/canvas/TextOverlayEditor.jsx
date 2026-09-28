import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { getElementBounds } from '../../utils/selectionGeometry';
import { getSnapTargets, calculateSnapDelta } from '../../utils/snapping';
import {
  normalizeTextElement,
  getTextCSSStyles,
  getTextTransformedValue,
} from '../../utils/textUtils';
import TextFormattingToolbar from './TextFormattingToolbar';
import ShapeRenderer from './ShapeRenderer';
import StickerRenderer from './StickerRenderer';

export default function TextOverlayEditor({
  textOverlays = [],
  stickers = [],
  document,
  selection,
  containerRef,
  setSnapGuides,
  selectedOverlayId,
  onSelectOverlay,
  onToggleSelection,
  onUpdateTextOverlay,
  onCommitMultipleChange,
  onRemoveTextOverlay,
  onRemoveSticker,
}) {
  const [dragState, setDragState] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const snapStateRef = useRef({});
  const textareaRef = useRef(null);

  // Auto-focus and select text when entering inline edit mode
  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingId]);

  // Escape key cancel during drag or text editing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (dragState) {
          if (setSnapGuides) setSnapGuides([]);
          snapStateRef.current = {};
          setDragState(null);
        } else if (editingId) {
          setEditingId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragState, editingId, setSnapGuides]);

  const handleMouseDownText = (e, item, type = 'text') => {
    // If currently editing this text, don't drag
    if (editingId === item.id) return;

    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (onToggleSelection) onToggleSelection(item.id);
      return;
    }
    onSelectOverlay(item.id);

    // If locked, block drag transformation
    if (item.locked) return;

    setDragState({
      id: item.id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
    });
  };

  const handleDoubleClickText = (e, txt) => {
    e.stopPropagation();
    if (txt.locked) return;
    setEditingId(txt.id);
    setEditingValue(txt.text || '');
  };

  const handleSaveTextValue = (id) => {
    if (editingId === id && onUpdateTextOverlay) {
      onUpdateTextOverlay(id, { text: editingValue });
    }
    setEditingId(null);
  };

  const handleMouseMove = (e) => {
    if (!dragState) return;
    const rect = containerRef?.current?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
    const rawDeltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
    const rawDeltaY = ((e.clientY - dragState.startY) / rect.height) * 100;

    const rawX = Math.max(5, Math.min(95, dragState.initialX + rawDeltaX));
    const rawY = Math.max(5, Math.min(95, dragState.initialY + rawDeltaY));

    const itemObj = document?.elements?.find((el) => el.id === dragState.id) || {
      id: dragState.id,
      type: dragState.type,
      x: rawX,
      y: rawY,
    };

    const trialBounds = getElementBounds({
      ...itemObj,
      x: rawX,
      y: rawY,
    });

    const targets = getSnapTargets(document?.elements, [dragState.id], rect, document?.guides || []);
    const snapRes = calculateSnapDelta(trialBounds, targets, rect, snapStateRef.current);
    snapStateRef.current = snapRes.activeSnapState;
    if (setSnapGuides) setSnapGuides(snapRes.guides);

    const finalX = Math.max(5, Math.min(95, rawX + snapRes.snapDeltaX));
    const finalY = Math.max(5, Math.min(95, rawY + snapRes.snapDeltaY));

    if (dragState.type === 'text' || dragState.type === 'sticker') {
      onUpdateTextOverlay(dragState.id, { x: finalX, y: finalY });
    }
  };

  const handleMouseUp = () => {
    if (setSnapGuides) setSnapGuides([]);
    snapStateRef.current = {};
    setDragState(null);
  };

  // Identify all selected text elements for multi-formatting
  const selectedTextElements = document?.elements
    ? document.elements.filter(
        (el) =>
          el.type === 'text' &&
          ((selection?.selectedIds || []).includes(el.id) || editingId === el.id)
      )
    : textOverlays.filter(
        (txt) => (selection?.selectedIds || []).includes(txt.id) || editingId === txt.id
      );

  const handleMultiFormattingUpdate = (patch) => {
    if (selectedTextElements.length === 0) return;
    const updates = selectedTextElements.map((el) => ({
      id: el.id,
      patch,
    }));
    if (onCommitMultipleChange) {
      onCommitMultipleChange(updates);
    } else if (onUpdateTextOverlay) {
      selectedTextElements.forEach((el) => onUpdateTextOverlay(el.id, patch));
    }
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Contextual Text Formatting Toolbar */}
      {selectedTextElements.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <TextFormattingToolbar
            selectedTextElements={selectedTextElements}
            onUpdateText={handleMultiFormattingUpdate}
          />
        </div>
      )}

      {/* RENDER TEXT OVERLAYS */}
      {textOverlays.map((rawTxt) => {
        if (rawTxt.visible === false) return null;
        const txt = normalizeTextElement(rawTxt);
        const isSelected = selectedOverlayId === txt.id || (selection?.selectedIds || []).includes(txt.id);
        const isLocked = txt.locked === true;
        const isEditing = editingId === txt.id;

        const cssStyles = getTextCSSStyles(txt);
        const displayValue = getTextTransformedValue(isEditing ? editingValue : txt.text, txt.textTransform);

        return (
          <div
            key={txt.id}
            onMouseDown={(e) => handleMouseDownText(e, txt, 'text')}
            onDoubleClick={(e) => handleDoubleClickText(e, txt)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 select-none group transition-shadow pointer-events-auto ${
              isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
            } ${
              isSelected && !isEditing ? 'ring-2 ring-[#c25e40] ring-offset-2 ring-offset-slate-950 rounded-lg' : ''
            }`}
            style={{
              left: `${txt.x}%`,
              top: `${txt.y}%`,
              transform: `translate(-50%, -50%) rotate(${txt.rotation || 0}deg)`,
            }}
          >
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleSaveTextValue(txt.id)}
                onKeyDown={(e) => {
                  e.stopPropagation(); // Don't trigger canvas shortcuts while typing!
                  const isMod = e.metaKey || e.ctrlKey;
                  if (isMod && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    onUpdateTextOverlay(txt.id, { fontWeight: txt.fontWeight >= 700 ? 400 : 700 });
                  } else if (isMod && e.key.toLowerCase() === 'i') {
                    e.preventDefault();
                    onUpdateTextOverlay(txt.id, { fontStyle: txt.fontStyle === 'italic' ? 'normal' : 'italic' });
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                className="bg-transparent resize-none overflow-hidden focus:outline-none ring-2 ring-amber-500 rounded-lg p-1"
                style={{
                  ...cssStyles,
                  width: 'max-content',
                  minWidth: '120px',
                  minHeight: '40px',
                }}
              />
            ) : (
              <div className="relative flex items-center justify-between group" style={cssStyles}>
                <span className="whitespace-pre-wrap">{displayValue}</span>

                {/* Hover delete button (only when unlocked & not editing) */}
                {!isLocked && !isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTextOverlay(txt.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 ml-2 text-stone-400 hover:text-rose-600 transition-opacity"
                    title="Delete Text Layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* RENDER SHAPES */}
      {(document?.elements || [])
        .filter((el) => el.type === 'shape')
        .map((shape) => {
          if (shape.visible === false) return null;
          const isSelected = selectedOverlayId === shape.id || selection?.selectedIds?.includes(shape.id);
          const isLocked = shape.locked === true;

          return (
            <div
              key={shape.id}
              onMouseDown={(e) => handleMouseDownText(e, shape, 'shape')}
              className={`absolute select-none pointer-events-auto ${
                isLocked ? 'cursor-default' : 'cursor-move'
              }`}
              style={{
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                width: `${shape.width}%`,
                height: `${shape.height}%`,
                transform: `rotate(${shape.rotation || 0}deg)`,
                zIndex: shape.zIndex || 400,
              }}
            >
              <ShapeRenderer
                shape={shape}
                isSelected={isSelected}
                onMouseDown={(e) => handleMouseDownText(e, shape, 'shape')}
              />
            </div>
          );
        })}

      {/* RENDER STICKERS */}
      {(document?.elements || [])
        .filter((el) => el.type === 'sticker')
        .map((st) => {
          if (st.visible === false) return null;
          const isSelected = selectedOverlayId === st.id || selection?.selectedIds?.includes(st.id);
          const isLocked = st.locked === true;

          return (
            <div
              key={st.id}
              onMouseDown={(e) => handleMouseDownText(e, st, 'sticker')}
              className={`absolute select-none pointer-events-auto ${
                isLocked ? 'cursor-default' : 'cursor-move'
              } ${isSelected ? 'ring-2 ring-amber-500 rounded-sm' : ''}`}
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: `${st.width || 64}px`,
                height: `${st.height || 64}px`,
                transform: `translate(-50%, -50%) rotate(${st.rotation || 0}deg)`,
                zIndex: st.zIndex || 300,
              }}
            >
              <StickerRenderer
                sticker={st}
                isSelected={isSelected}
                onMouseDown={(e) => handleMouseDownText(e, st, 'sticker')}
              />
            </div>
          );
        })}
    </div>
  );
}
