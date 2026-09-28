import React, { useState } from 'react';
import { RotateCcw, Trash2, X, AlertTriangle } from 'lucide-react';
import ConfirmModal from '../modals/ConfirmModal';

export default function RecoveryBanner({ onRecover, onDiscard }) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  return (
    <>
      <div className="bg-amber-500 text-stone-900 border-b border-amber-600/30 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs z-30 animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-stone-900 shrink-0" />
          <span>An unsaved previous session was found. Would you like to restore your work?</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRecover}
            className="py-1 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recover Session</span>
          </button>
          <button
            onClick={() => setShowDiscardConfirm(true)}
            className="py-1 px-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-stone-950 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Recovery Data?"
        message="Are you sure you want to discard the previous session? Unsaved recovery data will be permanently deleted."
        confirmText="Discard Data"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onDiscard();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
