/**
 * Professional Project Persistence & Serialization Utilities
 */
import { normalizeLegacyStateToDocument } from './elementNormalizer';

export const CURRENT_PROJECT_VERSION = 1;
export const APP_VERSION = '1.0.0';

/**
 * Generates a unique project ID
 */
export function generateProjectId() {
  return `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Creates a clean, versioned project data structure
 */
export function createProjectData(document, assets = [], metadataOverride = {}) {
  const normalizedDoc = normalizeLegacyStateToDocument(document);

  const now = new Date().toISOString();
  const projectId = metadataOverride.projectId || generateProjectId();
  const projectName = metadataOverride.projectName || normalizedDoc.title || 'Untitled Collage';

  return {
    projectVersion: CURRENT_PROJECT_VERSION,
    metadata: {
      projectId,
      projectName,
      createdAt: metadataOverride.createdAt || now,
      updatedAt: now,
      appVersion: APP_VERSION,
      aspectRatio: normalizedDoc.aspectRatio || '1:1',
      elementCount: normalizedDoc.elements?.length || 0,
    },
    document: normalizedDoc,
    assets: Array.isArray(assets) ? assets : [],
  };
}

/**
 * Serializes project data safely into JSON string
 */
export function serializeProject(projectData) {
  return JSON.stringify(projectData, null, 2);
}

/**
 * Parses, validates, and normalizes a raw project object/JSON
 */
export function parseAndValidateProject(rawData) {
  if (!rawData) {
    throw new Error('Project data is empty or invalid.');
  }

  let parsed = rawData;
  if (typeof rawData === 'string') {
    try {
      parsed = JSON.parse(rawData);
    } catch (e) {
      throw new Error('Failed to parse project file: Invalid JSON structure.');
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Project data structure is malformed.');
  }

  // Version check and legacy normalization
  const version = parsed.projectVersion || 1;
  const rawDoc = parsed.document || parsed;
  const normalizedDoc = normalizeLegacyStateToDocument(rawDoc);

  const rawMeta = parsed.metadata || {};
  const projectId = rawMeta.projectId || generateProjectId();
  const projectName = rawMeta.projectName || normalizedDoc.title || 'Untitled Collage';

  const validAssets = Array.isArray(parsed.assets) ? parsed.assets : [];

  return createProjectData(normalizedDoc, validAssets, {
    projectId,
    projectName,
    createdAt: rawMeta.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Duplicates a project data object with new IDs and "Copy" suffix
 */
export function duplicateProjectData(originalProject) {
  const validated = parseAndValidateProject(originalProject);
  const newProjectId = generateProjectId();
  const newProjectName = `${validated.metadata.projectName} Copy`;

  return createProjectData(validated.document, validated.assets, {
    projectId: newProjectId,
    projectName: newProjectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Triggers a browser download of the `.collage` project file
 */
export function exportProjectFile(projectData, filename) {
  const validated = parseAndValidateProject(projectData);
  const jsonStr = serializeProject(validated);
  const safeName = (filename || validated.metadata.projectName || 'collage-project')
    .replace(/[^a-z0-9_-]/gi, '_')
    .toLowerCase();

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.collage`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses an uploaded `.collage` or `.json` file from disk
 */
export function importProjectFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const project = parseAndValidateProject(text);
        resolve(project);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsText(file);
  });
}
