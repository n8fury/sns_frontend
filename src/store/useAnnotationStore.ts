import { create } from 'zustand';

import { api } from '@/lib/api';
import type { AnnotationImage, Polygon, PolygonLabel } from '@/lib/types';

interface DrawingState {
  points: [number, number][];
  label: PolygonLabel;
  closed: boolean;
}

// A reversible create/delete action. Undo and redo are the same operation —
// toggle whether this polygon currently exists — so one entry object,
// mutated in place as its `id` changes, serves both directions without ever
// needing to "rebase" stale ids across a multi-step undo/redo sequence.
interface HistoryEntry {
  label: PolygonLabel;
  points: [number, number][];
  id: number | null;
}

interface HistoryStack {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

// A point undone off the in-progress shape. `label` is only actually needed
// for the last one — the one that empties `drawing` entirely — so redo can
// restart the shape via `startDrawing`; it's harmless to carry on the rest.
interface DrawingRedoEntry {
  point: [number, number];
  label: PolygonLabel;
}

interface AnnotationState {
  images: AnnotationImage[];
  activeImageId: number | null;
  polygons: Record<number, Polygon[]>;
  history: Record<number, HistoryStack>;
  drawing: DrawingState | null;
  drawingRedoStack: DrawingRedoEntry[];
  selectedLabel: PolygonLabel;
  selectedPolygonId: number | null;

  loading: boolean;
  error: string | null;

  fetchImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  setActiveImageId: (id: number | null) => void;
  fetchPolygonsForImage: (imageId: number) => Promise<void>;
  setSelectedPolygonId: (id: number | null) => void;
  deletePolygon: (id: number, imageId: number) => Promise<void>;

  setSelectedLabel: (label: PolygonLabel) => void;
  startDrawing: (point: [number, number], label: PolygonLabel) => void;
  addDrawingPoint: (point: [number, number]) => void;
  undoDrawingPoint: () => void;
  redoDrawingPoint: () => void;
  closeDrawing: () => Promise<Polygon | null>;
  cancelDrawing: () => void;
  undo: (imageId: number) => Promise<void>;
  redo: (imageId: number) => Promise<void>;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => {
  // Shared by undo and redo: flips a history entry between "exists on the
  // server" and "doesn't", performing whichever API call that requires.
  async function toggleHistoryEntry(imageId: number, entry: HistoryEntry) {
    if (entry.id !== null) {
      const removedId = entry.id;
      await api(`/api/polygons/${removedId}/`, { method: 'DELETE' });
      set((state) => ({
        polygons: {
          ...state.polygons,
          [imageId]: (state.polygons[imageId] ?? []).filter(
            (polygon) => polygon.id !== removedId,
          ),
        },
        selectedPolygonId:
          state.selectedPolygonId === removedId
            ? null
            : state.selectedPolygonId,
      }));
      entry.id = null;
    } else {
      const created = await api<Polygon>('/api/polygons/', {
        method: 'POST',
        body: { image: imageId, label: entry.label, points: entry.points },
      });
      set((state) => ({
        polygons: {
          ...state.polygons,
          [imageId]: [...(state.polygons[imageId] ?? []), created],
        },
      }));
      entry.id = created.id;
    }
  }

  return {
  images: [],
  activeImageId: null,
  polygons: {},
  history: {},
  drawing: null,
  drawingRedoStack: [],
  selectedLabel: 'tumor',
  selectedPolygonId: null,

  loading: false,
  error: null,

  fetchImages: async () => {
    set({ loading: true, error: null });
    try {
      const images = await api<AnnotationImage[]>('/api/images/');
      if (!Array.isArray(images)) {
        throw new Error('Unexpected response shape');
      }
      set({ images, loading: false });
      get().setActiveImageId(get().activeImageId ?? images[0]?.id ?? null);
    } catch {
      set({ error: 'Failed to load images.', loading: false, images: [] });
    }
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const image = await api<AnnotationImage>('/api/images/', {
      method: 'POST',
      body: formData,
    });
    set((state) => ({ images: [...state.images, image] }));
    if (get().activeImageId === null) {
      get().setActiveImageId(image.id);
    }
  },

  deleteImage: async (id) => {
    const previousImages = get().images;
    const previousActiveId = get().activeImageId;
    const remaining = previousImages.filter((image) => image.id !== id);
    const nextActiveId =
      previousActiveId === id ? (remaining[0]?.id ?? null) : previousActiveId;
    set({ images: remaining, activeImageId: nextActiveId });
    try {
      await api(`/api/images/${id}/`, { method: 'DELETE' });
      set((state) => {
        const rest = { ...state.polygons };
        delete rest[id];
        const restHistory = { ...state.history };
        delete restHistory[id];
        return { polygons: rest, history: restHistory };
      });
      if (nextActiveId !== null && nextActiveId !== previousActiveId) {
        get().fetchPolygonsForImage(nextActiveId);
      }
    } catch (err) {
      set({ images: previousImages, activeImageId: previousActiveId });
      throw err;
    }
  },

  setActiveImageId: (id) => {
    set({ activeImageId: id, selectedPolygonId: null });
    if (id !== null) {
      get().fetchPolygonsForImage(id);
    }
  },

  fetchPolygonsForImage: async (imageId) => {
    try {
      const polygons = await api<Polygon[]>(`/api/polygons/?image=${imageId}`);
      if (!Array.isArray(polygons)) {
        throw new Error('Unexpected response shape');
      }
      set((state) => ({
        polygons: { ...state.polygons, [imageId]: polygons },
      }));
    } catch {
      // non-fatal: leave whatever polygons (if any) are already cached
    }
  },

  setSelectedLabel: (label) =>
    set((state) => ({
      selectedLabel: label,
      drawing: state.drawing ? { ...state.drawing, label } : state.drawing,
    })),

  startDrawing: (point, label) =>
    set({
      drawing: { points: [point], label, closed: false },
      drawingRedoStack: [],
    }),

  addDrawingPoint: (point) =>
    set((state) =>
      state.drawing
        ? {
            drawing: {
              ...state.drawing,
              points: [...state.drawing.points, point],
            },
            // A genuinely new point invalidates whatever was undone before.
            drawingRedoStack: [],
          }
        : {},
    ),

  undoDrawingPoint: () => {
    const { drawing } = get();
    if (!drawing) return;
    const lastPoint = drawing.points[drawing.points.length - 1];
    const redoEntry: DrawingRedoEntry = {
      point: lastPoint,
      label: drawing.label,
    };
    if (drawing.points.length > 1) {
      set((state) => ({
        drawing: state.drawing
          ? { ...state.drawing, points: state.drawing.points.slice(0, -1) }
          : state.drawing,
        drawingRedoStack: [...state.drawingRedoStack, redoEntry],
      }));
    } else {
      // Undoing the only point leaves nothing to draw — discard the shape
      // entirely, but remember it so redo can restart it from scratch.
      set((state) => ({
        drawing: null,
        drawingRedoStack: [...state.drawingRedoStack, redoEntry],
      }));
    }
  },

  redoDrawingPoint: () => {
    const { drawingRedoStack, drawing } = get();
    const entry = drawingRedoStack[drawingRedoStack.length - 1];
    if (!entry) return;
    if (drawing) {
      set((state) => ({
        drawing: state.drawing
          ? {
              ...state.drawing,
              points: [...state.drawing.points, entry.point],
            }
          : state.drawing,
        drawingRedoStack: state.drawingRedoStack.slice(0, -1),
      }));
    } else {
      set((state) => ({
        drawing: { points: [entry.point], label: entry.label, closed: false },
        drawingRedoStack: state.drawingRedoStack.slice(0, -1),
      }));
    }
  },

  closeDrawing: async () => {
    const { drawing, activeImageId } = get();
    if (!drawing || activeImageId === null) return null;

    set({ drawing: { ...drawing, closed: true } });

    try {
      const polygon = await api<Polygon>('/api/polygons/', {
        method: 'POST',
        body: {
          image: activeImageId,
          label: drawing.label,
          points: drawing.points,
        },
      });
      const entry: HistoryEntry = {
        label: polygon.label,
        points: polygon.points,
        id: polygon.id,
      };
      set((state) => {
        const existing = state.history[activeImageId] ?? {
          past: [],
          future: [],
        };
        return {
          polygons: {
            ...state.polygons,
            [activeImageId]: [
              ...(state.polygons[activeImageId] ?? []),
              polygon,
            ],
          },
          drawing: null,
          drawingRedoStack: [],
          history: {
            ...state.history,
            [activeImageId]: { past: [...existing.past, entry], future: [] },
          },
        };
      });
      return polygon;
    } catch {
      set({ error: 'Failed to save polygon.' });
      // leave the closed-but-unsaved shape visible; Escape discards it
      return null;
    }
  },

  cancelDrawing: () => set({ drawing: null, drawingRedoStack: [] }),

  setSelectedPolygonId: (id) => set({ selectedPolygonId: id }),

  deletePolygon: async (id, imageId) => {
    const { polygons, selectedPolygonId } = get();
    const previous = polygons[imageId] ?? [];
    const target = previous.find((polygon) => polygon.id === id);
    set({
      polygons: {
        ...polygons,
        [imageId]: previous.filter((polygon) => polygon.id !== id),
      },
      selectedPolygonId: selectedPolygonId === id ? null : selectedPolygonId,
    });
    try {
      await api(`/api/polygons/${id}/`, { method: 'DELETE' });
      if (target) {
        const entry: HistoryEntry = {
          label: target.label,
          points: target.points,
          id: null,
        };
        set((state) => {
          const existing = state.history[imageId] ?? { past: [], future: [] };
          return {
            history: {
              ...state.history,
              [imageId]: { past: [...existing.past, entry], future: [] },
            },
          };
        });
      }
    } catch (err) {
      set((state) => ({
        polygons: { ...state.polygons, [imageId]: previous },
        selectedPolygonId,
      }));
      throw err;
    }
  },

  undo: async (imageId) => {
    const bucket = get().history[imageId];
    const entry = bucket?.past.at(-1);
    if (!entry) return;
    await toggleHistoryEntry(imageId, entry);
    set((state) => {
      const current = state.history[imageId] ?? { past: [], future: [] };
      return {
        history: {
          ...state.history,
          [imageId]: {
            past: current.past.slice(0, -1),
            future: [...current.future, entry],
          },
        },
      };
    });
  },

  redo: async (imageId) => {
    const bucket = get().history[imageId];
    const entry = bucket?.future.at(-1);
    if (!entry) return;
    await toggleHistoryEntry(imageId, entry);
    set((state) => {
      const current = state.history[imageId] ?? { past: [], future: [] };
      return {
        history: {
          ...state.history,
          [imageId]: {
            past: [...current.past, entry],
            future: current.future.slice(0, -1),
          },
        },
      };
    });
  },
  };
});
