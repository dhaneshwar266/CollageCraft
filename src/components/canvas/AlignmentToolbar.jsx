import React, { useState } from 'react';

// Custom precision SVG icons for Alignment & Distribution to ensure exact visuals
const AlignLeftIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="2" x2="4" y2="22" strokeWidth="2.5" />
    <rect x="8" y="5" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="8" y="15" width="8" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const AlignCenterHIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" strokeWidth="1.5" />
    <rect x="5" y="5" width="14" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="7" y="15" width="10" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const AlignRightIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="20" y1="2" x2="20" y2="22" strokeWidth="2.5" />
    <rect x="4" y="5" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="8" y="15" width="8" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const AlignTopIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="4" x2="22" y2="4" strokeWidth="2.5" />
    <rect x="5" y="8" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="15" y="8" width="4" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const AlignCenterVIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2 2" strokeWidth="1.5" />
    <rect x="5" y="5" width="4" height="14" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="15" y="7" width="4" height="10" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const AlignBottomIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="20" x2="22" y2="20" strokeWidth="2.5" />
    <rect x="5" y="4" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="15" y="8" width="4" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const DistributeHIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="3" y2="21" strokeWidth="2" />
    <line x1="21" y1="3" x2="21" y2="21" strokeWidth="2" />
    <rect x="7" y="6" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="13" y="6" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const DistributeVIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="21" y2="3" strokeWidth="2" />
    <line x1="3" y1="21" x2="21" y2="21" strokeWidth="2" />
    <rect x="6" y="7" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="6" y="13" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

export default function AlignmentToolbar({
  selectedCount = 0,
  onAlign,
  onDistribute,
}) {
  const [toastMessage, setToastMessage] = useState(null);

  if (selectedCount === 0) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAlign = (dir) => {
    const res = onAlign(dir);
    if (res?.lockedCount > 0) {
      showToast(`${res.lockedCount} locked layer${res.lockedCount > 1 ? 's' : ''} skipped`);
    }
  };

  const handleDistribute = (axis) => {
    const res = onDistribute(axis);
    if (res?.notEnoughTargets) {
      showToast('Select 3+ layers to distribute');
    } else if (res?.lockedCount > 0) {
      showToast(`${res.lockedCount} locked layer${res.lockedCount > 1 ? 's' : ''} skipped`);
    }
  };

  const isMulti = selectedCount >= 2;
  const canDistribute = selectedCount >= 3;

  return (
    <div className="relative inline-flex items-center gap-1.5 bg-white/95 border border-stone-200 rounded-xl p-1 shadow-md text-stone-700 backdrop-blur-md">
      {/* Toast popup message */}
      {toastMessage && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-stone-900 text-white text-[10px] font-semibold whitespace-nowrap shadow-lg animate-in fade-in duration-150 z-50">
          {toastMessage}
        </div>
      )}

      {/* Mode Header */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 select-none">
        {isMulti ? 'Align' : 'Align Canvas'}
      </span>

      {/* Align Left */}
      <button
        onClick={() => handleAlign('left')}
        title={isMulti ? 'Align Left' : 'Align to Canvas Left'}
        aria-label={isMulti ? 'Align Left' : 'Align to Canvas Left'}
        className="p-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
      >
        <AlignLeftIcon className="w-4 h-4 text-stone-700" />
      </button>

      {/* Align Center Horizontally */}
      <button
        onClick={() => handleAlign('center-h')}
        title={isMulti ? 'Align Center Horizontally' : 'Align to Canvas Center Horizontally'}
        aria-label={isMulti ? 'Align Center Horizontally' : 'Align to Canvas Center Horizontally'}
        className="p-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
      >
        <AlignCenterHIcon className="w-4 h-4 text-stone-700" />
      </button>

      {/* Align Right */}
      <button
        onClick={() => handleAlign('right')}
        title={isMulti ? 'Align Right' : 'Align to Canvas Right'}
        aria-label={isMulti ? 'Align Right' : 'Align to Canvas Right'}
        className="p-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
      >
        <AlignRightIcon className="w-4 h-4 text-stone-700" />
      </button>

      <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />

      {/* Align Top */}
      <button
        onClick={() => handleAlign('top')}
        title={isMulti ? 'Align Top' : 'Align to Canvas Top'}
        aria-label={isMulti ? 'Align Top' : 'Align to Canvas Top'}
        className="p-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
      >
        <AlignTopIcon className="w-4 h-4 text-stone-700" />
      </button>

      {/* Align Center Vertically */}
      <button
        onClick={() => handleAlign('center-v')}
        title={isMulti ? 'Align Center Vertically' : 'Align to Canvas Center Vertically'}
        aria-label={isMulti ? 'Align Center Vertically' : 'Align to Canvas Center Vertically'}
        className="p-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
      >
        <AlignCenterVIcon className="w-4 h-4 text-stone-700" />
      </button>

      {/* Align Bottom */}
      <button
        onClick={() => handleAlign('bottom')}
        title={isMulti ? 'Align Bottom' : 'Align to Canvas Bottom'}
        aria-label={isMulti ? 'Align Bottom' : 'Align to Canvas Bottom'}
        className="p-1.5 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors"
      >
        <AlignBottomIcon className="w-4 h-4 text-stone-700" />
      </button>

      {/* Distribution Section (For 2+ or 3+ selected items) */}
      {isMulti && (
        <>
          <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 select-none">
            Distribute
          </span>

          {/* Distribute Horizontally */}
          <button
            onClick={() => handleDistribute('horizontal')}
            disabled={!canDistribute}
            title="Distribute Horizontally"
            aria-label="Distribute Horizontally"
            className={`p-1.5 rounded-lg transition-colors ${
              canDistribute
                ? 'hover:bg-stone-100 hover:text-stone-900 text-stone-700'
                : 'opacity-40 cursor-not-allowed text-stone-400'
            }`}
          >
            <DistributeHIcon className="w-4 h-4" />
          </button>

          {/* Distribute Vertically */}
          <button
            onClick={() => handleDistribute('vertical')}
            disabled={!canDistribute}
            title="Distribute Vertically"
            aria-label="Distribute Vertically"
            className={`p-1.5 rounded-lg transition-colors ${
              canDistribute
                ? 'hover:bg-stone-100 hover:text-stone-900 text-stone-700'
                : 'opacity-40 cursor-not-allowed text-stone-400'
            }`}
          >
            <DistributeVIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
