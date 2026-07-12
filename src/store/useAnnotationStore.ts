import { create } from 'zustand';

import { api } from '@/lib/api';
import type { AnnotationImage, Polygon, PolygonLabel } from '@/lib/types';

interface DrawingState {
  points: [number, number][];
  label: PolygonLabel;
  closed: boolean;
}

interface AnnotationState {
  images: AnnotationImage[];
  activeImageId: number | null;
  polygons: Record<number, Polygon[]>;
  drawing: DrawingState | null;
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
  deletePolygon: (id: number) => Promise<void>;

  setSelectedLabel: (label: PolygonLabel) => void;
  startDrawing: (point: [number, number], label: PolygonLabel) => void;
  addDrawingPoint: (point: [number, number]) => void;
  closeDrawing: () => Promise<void>;
  cancelDrawing: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  images: [],
  activeImageId: null,
  polygons: {},
  drawing: null,
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
        const { [id]: _removed, ...rest } = state.polygons;
        return { polygons: rest };
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
    set({ drawing: { points: [point], label, closed: false } }),

  addDrawingPoint: (point) =>
    set((state) =>
      state.drawing
        ? {
            drawing: {
              ...state.drawing,
              points: [...state.drawing.points, point],
            },
          }
        : {},
    ),

  closeDrawing: async () => {
    const { drawing, activeImageId } = get();
    if (!drawing || activeImageId === null) return;

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
      set((state) => ({
        polygons: {
          ...state.polygons,
          [activeImageId]: [...(state.polygons[activeImageId] ?? []), polygon],
        },
        drawing: null,
      }));
    } catch {
      set({ error: 'Failed to save polygon.' });
      // leave the closed-but-unsaved shape visible; Escape discards it
    }
  },

  cancelDrawing: () => set({ drawing: null }),

  setSelectedPolygonId: (id) => set({ selectedPolygonId: id }),

  deletePolygon: async (id) => {
    const { activeImageId, polygons, selectedPolygonId } = get();
    if (activeImageId === null) return;
    const previous = polygons[activeImageId] ?? [];
    set({
      polygons: {
        ...polygons,
        [activeImageId]: previous.filter((polygon) => polygon.id !== id),
      },
      selectedPolygonId: selectedPolygonId === id ? null : selectedPolygonId,
    });
    try {
      await api(`/api/polygons/${id}/`, { method: 'DELETE' });
    } catch (err) {
      set((state) => ({
        polygons: { ...state.polygons, [activeImageId]: previous },
        selectedPolygonId,
      }));
      throw err;
    }
  },
}));
