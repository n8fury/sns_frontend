import { create } from 'zustand';

import { api } from '@/lib/api';
import type { AnnotationImage, Polygon, PolygonLabel } from '@/lib/types';

interface DrawingState {
  points: [number, number][];
  label: PolygonLabel;
}

interface AnnotationState {
  images: AnnotationImage[];
  activeImageId: number | null;
  polygons: Record<number, Polygon[]>;
  drawing: DrawingState | null;

  loading: boolean;
  error: string | null;

  fetchImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  setActiveImageId: (id: number | null) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  images: [],
  activeImageId: null,
  polygons: {},
  drawing: null,

  loading: false,
  error: null,

  fetchImages: async () => {
    set({ loading: true, error: null });
    try {
      const images = await api<AnnotationImage[]>('/api/images/');
      if (!Array.isArray(images)) {
        throw new Error('Unexpected response shape');
      }
      set({
        images,
        loading: false,
        activeImageId: get().activeImageId ?? images[0]?.id ?? null,
      });
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
    set((state) => ({
      images: [...state.images, image],
      activeImageId: state.activeImageId ?? image.id,
    }));
  },

  setActiveImageId: (id) => set({ activeImageId: id }),
}));
