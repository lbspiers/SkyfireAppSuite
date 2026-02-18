/**
 * Canvas API service
 * Handles server-side save/load of SkyfireCanvas drawing state per project.
 *
 * Backend endpoints (Logan creates these via SSH):
 *   GET  /project/:projectUuid/canvas  → { success, data: CanvasState | null }
 *   PUT  /project/:projectUuid/canvas  → { success, data: { version, savedAt, objectCount } }
 */

import axiosInstance from '../api/axiosInstance';
import apiEndpoints from '../config/apiEndpoints';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface CanvasPoint {
  lat: number;
  lng: number;
}

export interface CanvasObject {
  type: 'line' | 'polyline' | 'rect' | 'circle' | 'dimension' | 'equipment' | 'text';
  layer: string;
  lineStyle?: string;
  closed?: boolean;
  // line / dimension
  p1?: CanvasPoint;
  p2?: CanvasPoint;
  // polyline
  points?: CanvasPoint[];
  // rect corners
  nw?: CanvasPoint;
  ne?: CanvasPoint;
  se?: CanvasPoint;
  sw?: CanvasPoint;
  // circle
  center?: CanvasPoint;
  edge?: CanvasPoint;
  // equipment
  pos?: CanvasPoint;
  label?: string;
}

export interface CanvasLayerState {
  visible: boolean;
  locked: boolean;
}

export interface CanvasViewport {
  center: CanvasPoint;
  zoom: number;
}

export interface CanvasState {
  objects: CanvasObject[];
  layerVisibility: Record<string, boolean>;
  layerLocked: Record<string, boolean>;
  viewport?: CanvasViewport;
  version: number;
}

export interface CanvasSaveResponse {
  success: boolean;
  data: {
    version: number;
    savedAt: string;
    objectCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// Fetch
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch saved canvas state for a project.
 * Returns null if no canvas data exists yet (404) or data is empty.
 */
export async function fetchCanvasState(projectUuid: string): Promise<CanvasState | null> {
  const path = apiEndpoints.PROJECT.CANVAS.GET(projectUuid);
  console.debug('[canvasAPI] GET', path);

  try {
    const resp = await axiosInstance.get(path);
    if (resp.status === 200 && resp.data?.data) {
      const state = resp.data.data as CanvasState;
      console.debug(`[canvasAPI] Loaded ${state.objects?.length ?? 0} objects (v${state.version})`);
      return state;
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No canvas data yet — normal for new projects
      return null;
    }
    console.error('[canvasAPI] Failed to fetch canvas state:', error?.message ?? error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────
// Save
// ─────────────────────────────────────────────────────────────────

/**
 * Save (upsert) canvas state for a project.
 */
export async function saveCanvasState(
  projectUuid: string,
  state: CanvasState
): Promise<CanvasSaveResponse> {
  const path = apiEndpoints.PROJECT.CANVAS.SAVE(projectUuid);
  console.debug(
    `[canvasAPI] PUT ${path} (${state.objects.length} objects, v${state.version})`
  );

  const resp = await axiosInstance.put(path, state);
  return resp.data as CanvasSaveResponse;
}
