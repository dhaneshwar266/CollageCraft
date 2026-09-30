import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  Shuffle, 
  LayoutGrid,
  Download,
  Keyboard,
  Save,
  FolderOpen,
  Plus,
  Edit3,
  Check,
  Upload,
  ChevronDown
} from 'lucide-react';

export default function Header({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onShuffle,
  onReset,
  onExportClick,
  onOpenShortcuts,
  // Project persistence props
  projectName,
  onSetProjectName,
  saveStatus, // 'saved' | 'saving' | 'unsaved'
  onSaveProject,
  onNewProject,
  onOpenProjectManager,
  onExportProjectFile,
  onImportProjectFile,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName || 'Untitled Collage');
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);

  const handleCommitTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed) {
      onSetProjectName(trimmed);
    } else {
      setTitleInput(projectName || 'Untitled Collage');
    }
    setIsEditingTitle(false);
  };

  const getSaveStatusBadge = () => {
    if (saveStatus === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Saving...
        </span>
      );
    }
    if (saveStatus === 'unsaved') {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
          Unsaved changes
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
        <Check className="w-3 h-3 text-emerald-600" />
        Saved
      </span>
    );
  };

  return (
    <header data-layout="header" className="w-full max-w-full min-w-0 h-14 md:h-16 px-2 sm:px-4 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 z-40 shadow-xs relative gap-1.5 pt-[env(safe-area-inset-top,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] overflow-visible box-border">
      {/* Brand & Project Title Section */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0">
        <img
          src="/assets/collagecraft-logo.png"
          alt="CollageCraft Logo"
          className="w-[42px] h-[42px] sm:w-[44px] sm:h-[44px] md:w-[48px] md:h-[48px] object-contain rounded-xl shrink-0"
        />

        <div className="flex flex-col justify-center min-w-0 shrink">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 min-w-0">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  onBlur={handleCommitTitle}
                  className="py-0.5 px-1.5 text-xs sm:text-sm font-bold text-stone-900 border border-[#c25e40] rounded outline-none bg-white shadow-xs max-w-[100px] xs:max-w-[140px] sm:max-w-none"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setTitleInput(projectName || 'Untitled Collage');
                  setIsEditingTitle(true);
                }}
                className="group text-xs sm:text-sm font-extrabold text-stone-900 hover:text-[#c25e40] flex items-center gap-1 transition-colors cursor-pointer text-left min-w-0"
                title="Click to rename project"
              >
                <span className="truncate max-w-[70px] xs:max-w-[120px] sm:max-w-[200px] md:max-w-none">{projectName || 'Untitled Collage'}</span>
                <Edit3 className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hidden xs:inline-block" />
              </button>
            )}

            {/* Save status badge (Hidden on mobile <768px) */}
            <div className="hidden md:block shrink-0">
              {getSaveStatusBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Center Action Group: File, Undo, Redo on mobile; Shuffle, Reset, Shortcuts on desktop */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-stone-100/80 border border-stone-200 p-0.5 sm:p-1 rounded-xl shrink-0">
        {/* File Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            className="py-1 px-1.5 sm:py-1.5 sm:px-2.5 rounded-lg text-xs font-semibold text-stone-700 hover:bg-white hover:text-stone-900 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800 shrink-0" />
            <span className="hidden xs:inline">File</span>
            <ChevronDown className="w-3 h-3 text-stone-500 shrink-0" />
          </button>

          {isFileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsFileMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-stone-200 rounded-xl shadow-xl p-1 z-50 text-xs font-medium space-y-0.5 animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setIsFileMenuOpen(false);
                  onNewProject();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-stone-500" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => {
                  setIsFileMenuOpen(false);
                  onSaveProject();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save Project</span>
              </button>
              <button
                onClick={() => {
                  setIsFileMenuOpen(false);
                  onOpenProjectManager();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                <span>Project Manager</span>
              </button>
              <div className="h-[1px] bg-stone-200 my-1" />
              <button
                onClick={() => {
                  setIsFileMenuOpen(false);
                  onExportProjectFile();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>Export .collage File</span>
              </button>
              <label className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>Import .collage File</span>
                <input
                  type="file"
                  accept=".collage,.json"
                  onChange={(e) => {
                    setIsFileMenuOpen(false);
                    if (e.target.files && e.target.files[0]) {
                      onImportProjectFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </>
        )}
        </div>

        <div className="w-[1px] h-4 sm:h-5 bg-stone-300 mx-0.5 sm:mx-1" />

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
            canUndo
              ? 'text-stone-800 hover:bg-white hover:text-stone-900 shadow-xs cursor-pointer'
              : 'text-stone-400 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden md:inline">Undo</span>
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
            canRedo
              ? 'text-stone-800 hover:bg-white hover:text-stone-900 shadow-xs cursor-pointer'
              : 'text-stone-400 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden md:inline">Redo</span>
        </button>

        {/* Secondary controls hidden on mobile (<768px), visible on desktop (md:) */}
        <div className="w-[1px] h-4 sm:h-5 bg-stone-300 mx-0.5 sm:mx-1 hidden md:block" />

        <button
          onClick={onShuffle}
          title="Shuffle Image Order"
          className="hidden md:flex p-1.5 sm:p-2 rounded-lg text-xs font-semibold text-stone-700 hover:bg-white hover:text-amber-900 transition-all items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 shrink-0" />
          <span>Shuffle</span>
        </button>

        <button
          onClick={onReset}
          title="Reset Design to Default"
          className="hidden md:flex p-1.5 sm:p-2 rounded-lg text-xs font-semibold text-stone-700 hover:bg-white hover:text-rose-700 transition-all items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-500 shrink-0" />
          <span>Reset</span>
        </button>

        <div className="w-[1px] h-4 sm:h-5 bg-stone-300 mx-0.5 sm:mx-1 hidden lg:block" />

        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts Guide"
          className="hidden lg:flex p-1.5 sm:p-2 rounded-lg text-xs font-semibold text-stone-700 hover:bg-white hover:text-stone-900 transition-all items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Keyboard className="w-4 h-4 text-stone-600 shrink-0" />
          <span>Shortcuts</span>
        </button>
      </div>

      {/* Export CTA Button */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={onExportClick}
          className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#c25e40] hover:bg-[#a84d32] text-white font-semibold text-xs shadow-md shadow-amber-900/10 hover:shadow-amber-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 sm:gap-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0" />
          <span className="hidden sm:inline">Export Collage</span>
          <span className="hidden xs:inline sm:hidden">Export</span>
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-90 shrink-0" />
        </button>
      </div>
    </header>
  );
}
