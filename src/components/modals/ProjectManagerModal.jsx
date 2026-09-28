import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderOpen, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Clock, 
  Layers, 
  FileText,
  Check,
  Upload
} from 'lucide-react';
import { listProjects, deleteProject } from '../../utils/indexedDbStorage';
import { duplicateProjectData } from '../../utils/projectPersistence';
import ConfirmModal from './ConfirmModal';

export default function ProjectManagerModal({
  isOpen,
  onClose,
  onOpenProject,
  onNewProject,
  onDuplicateProject,
  onDeleteProject,
  onImportProjectFile,
  currentProjectId,
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadProjectsList();
    }
  }, [isOpen]);

  const loadProjectsList = async () => {
    setLoading(true);
    try {
      const list = await listProjects();
      // Sort by updatedAt descending
      const sorted = (list || []).sort(
        (a, b) => new Date(b.metadata?.updatedAt || 0) - new Date(a.metadata?.updatedAt || 0)
      );
      setProjects(sorted);
    } catch (e) {
      console.error('Failed to load project list:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (proj) => {
    setEditingId(proj.metadata.projectId);
    setEditName(proj.metadata.projectName || 'Untitled Collage');
  };

  const handleSaveName = (proj) => {
    if (editName.trim()) {
      proj.metadata.projectName = editName.trim();
      proj.metadata.updatedAt = new Date().toISOString();
      // update projects list state
      setProjects([...projects]);
    }
    setEditingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await onDeleteProject(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadProjectsList();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white border border-stone-200/90 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#c25e40]/10 border border-[#c25e40]/20 flex items-center justify-center text-[#c25e40]">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Project Manager</h2>
              <p className="text-xs text-stone-500">Manage, open, duplicate and organize saved collages</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewProject}
              className="py-1.5 px-3 bg-[#c25e40] hover:bg-[#a84e32] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body / Project Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">Loading saved projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-700">No saved projects found</p>
                <p className="text-xs text-stone-400">Create a new project or import an existing .collage file</p>
              </div>
              <button
                onClick={onNewProject}
                className="mt-2 py-2 px-4 bg-[#c25e40] text-white text-xs font-semibold rounded-xl"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {projects.map((proj) => {
                const meta = proj.metadata || {};
                const isCurrent = meta.projectId === currentProjectId;
                const formattedDate = meta.updatedAt
                  ? new Date(meta.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recently';

                return (
                  <div
                    key={meta.projectId}
                    className={`border rounded-xl p-4 flex flex-col justify-between transition-all bg-white hover:shadow-md ${
                      isCurrent ? 'border-[#c25e40] ring-2 ring-[#c25e40]/10 bg-[#c25e40]/5' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      {/* Top Row: Name / Editable */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {editingId === meta.projectId ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(proj);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="flex-1 py-1 px-2 border border-stone-300 rounded text-xs font-semibold text-stone-900 outline-none focus:border-[#c25e40]"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveName(proj)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <h3 className="text-xs font-bold text-stone-900 truncate">
                              {meta.projectName || 'Untitled Collage'}
                            </h3>
                            <button
                              onClick={() => handleStartEdit(proj)}
                              className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                              title="Rename project"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {isCurrent && (
                          <span className="py-0.5 px-2 bg-[#c25e40]/10 text-[#c25e40] text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Details Meta */}
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-stone-400" />
                          {meta.elementCount ?? proj.document?.elements?.length ?? 0} elements
                        </span>
                        <span>{meta.aspectRatio || '1:1'}</span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2">
                      <button
                        onClick={() => onOpenProject(meta.projectId)}
                        disabled={isCurrent}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>{isCurrent ? 'Open' : 'Open'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            await onDuplicateProject(meta.projectId);
                            await loadProjectsList();
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate Project"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(meta.projectId)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-stone-200/80 bg-stone-50/70 flex items-center justify-between">
          <label className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Import .collage File</span>
            <input
              type="file"
              accept=".collage,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onImportProjectFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>

          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Project?"
        message="Are you sure you want to delete this saved project? This action cannot be undone."
        confirmText="Delete Project"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
