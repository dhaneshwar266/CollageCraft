import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Z / Cmd + Z', desc: 'Undo last design change' },
    { key: 'Ctrl + Y / Cmd + Shift + Z', desc: 'Redo undone action' },
    { key: 'Mouse Drag on Photo', desc: 'Move image Up, Down, Left, Right inside cell' },
    { key: 'Arrow Pad Buttons (Toolbar)', desc: 'Nudge photo position by 20px increments' },
    { key: 'Delete / Backspace', desc: 'Remove selected text caption or sticker overlay' },
    { key: 'Ctrl + E / Cmd + E', desc: 'Quickly open Export Modal' },
    { key: 'Drag Asset from Bottom Tray', desc: 'Drop image into any cell to replace/fill' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Keyboard className="w-5 h-5 text-[#c25e40]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-serif">Keyboard Shortcuts & Guide</h3>
              <p className="text-xs text-stone-500">Master Studio hotkeys for faster collaging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-3 bg-[#faf7f2]/50">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white shadow-2xs"
            >
              <span className="text-xs text-stone-600 font-medium">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-stone-100 border border-stone-300 text-stone-800 text-[11px] font-mono font-bold shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#c25e40] hover:bg-[#a84d32] text-white text-xs font-semibold shadow-xs"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
