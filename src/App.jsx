import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import WorkspaceCanvas from './components/canvas/WorkspaceCanvas';
import AssetTray from './components/layout/AssetTray';
import ExportModal from './components/modals/ExportModal';
import ShortcutsModal from './components/modals/ShortcutsModal';
import CropModal from './components/modals/CropModal';
import ProjectManagerModal from './components/modals/ProjectManagerModal';
import ConfirmModal from './components/modals/ConfirmModal';
import RecoveryBanner from './components/common/RecoveryBanner';
import { useCollageState } from './hooks/useCollageState';

export default function App() {
  const {
    document: docModel,
    selection,
    state,
    selectedCellId,
    setSelectedCellId,
    selectedOverlayId,
    setSelectedOverlayId,
    isExportOpen,
    setIsExportOpen,
    activeTab,
    setActiveTab,
    canUndo,
    canRedo,
    undo,
    redo,
    loadSamplePhotos,
    addAsset,
    replaceCellAsset,
    removeAsset,
    swapCells,
    shuffleOrder,
    updateCellParams,
    commitCellParams,
    updateFrameSettings,
    updateBackgroundSettings,
    setLayoutId,
    setAspectRatio,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    addSticker,
    removeSticker,
    addShapeElement,
    resetDesign,
    setPrimarySelection,
    toggleVisibility,
    toggleLock,
    renameElement,
    duplicateElement,
    removeElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    toggleSelection,
    selectAll,
    deleteSelectedElements,
    duplicateSelectedElements,
    moveSelectedElements,
    updateMultipleElementsLive,
    commitMultipleElementsChange,
    clearSelection,
    editingGroupId,
    setEditingGroupId,
    groupSelectedElements,
    ungroupSelectedElement,
    alignSelected,
    distributeSelected,
    viewport,
    setViewport,
    setZoom,
    addGuide,
    updateGuide,
    removeGuide,
    clearAllGuides,

    // Persistence API
    projectId,
    projectName,
    setProjectName,
    saveStatus,
    saveCurrentProject,
    startNewProject,
    loadProject,
    duplicateCurrentProject,
    deleteProject,
    exportProjectFile,
    importProjectFile,
    recoveryAvailable,
    recoverSession,
    discardSession,
    isProjectManagerOpen,
    setIsProjectManagerOpen,
    confirmModalData,
    setConfirmModalData,
  } = useCollageState();

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [cropModalData, setCropModalData] = useState(null); // { cell, asset } | null

  // Global Keyboard Shortcuts (Undo, Redo, Select All, Group, Ungroup, Delete, Duplicate, Nudge, Export, Save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept typing in inputs
      if (['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase())) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if (isMod && e.key.toLowerCase() === 'y') {
        if (canRedo) redo();
      } else if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentProject();
      } else if (isMod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelectedElement();
        } else {
          groupSelectedElements();
        }
      } else if (isMod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      } else if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedElements();
      } else if (isMod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportOpen(true);
      } else if (e.key === 'Escape') {
        if (editingGroupId) {
          setEditingGroupId(null);
        } else {
          clearSelection();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        moveSelectedElements(dx, dy);
      } else if (e.key === '?') {
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    selectAll,
    groupSelectedElements,
    ungroupSelectedElement,
    duplicateSelectedElements,
    clearSelection,
    deleteSelectedElements,
    moveSelectedElements,
    editingGroupId,
    setEditingGroupId,
    setIsExportOpen,
    saveCurrentProject,
  ]);

  return (
    <div className="w-full max-w-full min-w-0 h-screen h-[100dvh] flex flex-col bg-[#f8fafc] text-stone-900 overflow-hidden font-sans box-border">
      {/* Session Recovery Banner */}
      {recoveryAvailable && (
        <RecoveryBanner onRecover={recoverSession} onDiscard={discardSession} />
      )}

      {/* Studio Header Bar */}
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onShuffle={shuffleOrder}
        onReset={resetDesign}
        onExportClick={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        projectName={projectName}
        onSetProjectName={setProjectName}
        saveStatus={saveStatus}
        onSaveProject={saveCurrentProject}
        onNewProject={() => startNewProject(false)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onExportProjectFile={exportProjectFile}
        onImportProjectFile={importProjectFile}
      />

      {/* Main Studio Body:
          On Desktop (>=768px): flex-row with Sidebar left, WorkspaceCanvas right, Desktop AssetTray across bottom.
          On Mobile (<=767px): flex-col with WorkspaceCanvas (top) -> AssetTray (middle) -> Sidebar Mobile Dock/Panel (bottom).
      */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-full min-w-0 overflow-hidden relative box-border min-h-0">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            state={state}
            setLayoutId={setLayoutId}
            setAspectRatio={setAspectRatio}
            updateFrameSettings={updateFrameSettings}
            updateBackgroundSettings={updateBackgroundSettings}
            addTextOverlay={addTextOverlay}
            updateTextOverlay={updateTextOverlay}
            removeTextOverlay={removeTextOverlay}
            addSticker={addSticker}
            removeSticker={removeSticker}
            addShapeElement={addShapeElement}
            selectedOverlayId={selectedOverlayId}
            setSelectedOverlayId={setSelectedOverlayId}
            document={docModel}
            selection={selection}
            setPrimarySelection={setPrimarySelection}
            toggleSelection={toggleSelection}
            toggleVisibility={toggleVisibility}
            toggleLock={toggleLock}
            renameElement={renameElement}
            duplicateElement={duplicateElement}
            removeElement={removeElement}
            deleteSelectedElements={deleteSelectedElements}
            duplicateSelectedElements={duplicateSelectedElements}
            groupSelectedElements={groupSelectedElements}
            ungroupSelectedElement={ungroupSelectedElement}
            editingGroupId={editingGroupId}
            setEditingGroupId={setEditingGroupId}
            bringForward={bringForward}
            sendBackward={sendBackward}
            bringToFront={bringToFront}
            sendToBack={sendToBack}
          />
        </div>

        {/* Workspace Canvas (Top primary area on mobile, flex-1) */}
        <WorkspaceCanvas
          state={state}
          document={docModel}
          selection={selection}
          editingGroupId={editingGroupId}
          setEditingGroupId={setEditingGroupId}
          selectedCellId={selectedCellId}
          onSelectCell={setSelectedCellId}
          onToggleSelection={toggleSelection}
          onClearSelection={clearSelection}
          selectedOverlayId={selectedOverlayId}
          onSelectOverlay={setSelectedOverlayId}
          onSwapCells={swapCells}
          onUpdateCell={updateCellParams}
          onCommitCell={commitCellParams}
          onUpdateTextOverlay={updateTextOverlay}
          onRemoveTextOverlay={removeTextOverlay}
          onRemoveSticker={removeSticker}
          onAddAsset={addAsset}
          onReplaceAsset={replaceCellAsset}
          onRemoveCellAsset={removeAsset}
          onLoadSamplePhotos={loadSamplePhotos}
          onOpenCropModal={(cell, asset) => setCropModalData({ cell, asset })}
          onUpdateMultipleLive={updateMultipleElementsLive}
          onCommitMultipleChange={commitMultipleElementsChange}
          onAlignSelected={alignSelected}
          onDistributeSelected={distributeSelected}
          viewport={viewport}
          onSetViewport={setViewport}
          onSetZoom={setZoom}
          onAddGuide={addGuide}
          onUpdateGuide={updateGuide}
          onRemoveGuide={removeGuide}
          onClearAllGuides={clearAllGuides}
        />

        {/* Mobile Asset Tray (Directly below WorkspaceCanvas on mobile) */}
        <div className="md:hidden shrink-0">
          <AssetTray
            assets={state.assets}
            onAddAsset={addAsset}
            onRemoveAsset={removeAsset}
            onLoadSamplePhotos={loadSamplePhotos}
          />
        </div>

        {/* Mobile Tool Panel & Bottom Navigation Dock (Directly below AssetTray on mobile) */}
        <div className="md:hidden shrink-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            state={state}
            setLayoutId={setLayoutId}
            setAspectRatio={setAspectRatio}
            updateFrameSettings={updateFrameSettings}
            updateBackgroundSettings={updateBackgroundSettings}
            addTextOverlay={addTextOverlay}
            updateTextOverlay={updateTextOverlay}
            removeTextOverlay={removeTextOverlay}
            addSticker={addSticker}
            removeSticker={removeSticker}
            addShapeElement={addShapeElement}
            selectedOverlayId={selectedOverlayId}
            setSelectedOverlayId={setSelectedOverlayId}
            document={docModel}
            selection={selection}
            setPrimarySelection={setPrimarySelection}
            toggleSelection={toggleSelection}
            toggleVisibility={toggleVisibility}
            toggleLock={toggleLock}
            renameElement={renameElement}
            duplicateElement={duplicateElement}
            removeElement={removeElement}
            deleteSelectedElements={deleteSelectedElements}
            duplicateSelectedElements={duplicateSelectedElements}
            groupSelectedElements={groupSelectedElements}
            ungroupSelectedElement={ungroupSelectedElement}
            editingGroupId={editingGroupId}
            setEditingGroupId={setEditingGroupId}
            bringForward={bringForward}
            sendBackward={sendBackward}
            bringToFront={bringToFront}
            sendToBack={sendToBack}
          />
        </div>
      </div>

      {/* Desktop Asset Tray (Hidden on mobile) */}
      <div className="hidden md:block shrink-0">
        <AssetTray
          assets={state.assets}
          onAddAsset={addAsset}
          onRemoveAsset={removeAsset}
          onLoadSamplePhotos={loadSamplePhotos}
        />
      </div>

      {/* High-Resolution Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        state={state}
      />

      {/* Keyboard Shortcuts & Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Dedicated Interactive Photo Crop Modal */}
      {cropModalData && (
        <CropModal
          isOpen={!!cropModalData}
          onClose={() => setCropModalData(null)}
          cell={cropModalData.cell}
          asset={cropModalData.asset}
          onCommitCell={commitCellParams}
        />
      )}

      {/* Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        onOpenProject={loadProject}
        onNewProject={() => {
          setIsProjectManagerOpen(false);
          startNewProject(false);
        }}
        onDuplicateProject={duplicateCurrentProject}
        onDeleteProject={deleteProject}
        onImportProjectFile={(file) => {
          setIsProjectManagerOpen(false);
          importProjectFile(file);
        }}
        currentProjectId={projectId}
      />

      {/* General Confirmation Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={!!confirmModalData}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmText={confirmModalData.confirmText}
          cancelText={confirmModalData.cancelText || 'Cancel'}
          isDanger={confirmModalData.isDanger}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </div>
  );
}
