'use client';

import { useEffect } from 'react';

import { ImageCarousel } from '@/components/annotate/ImageCarousel';
import { ImageUploader } from '@/components/annotate/ImageUploader';
import { SliceViewerPanel } from '@/components/annotate/SliceViewerPanel';
import { useAnnotationStore } from '@/store/useAnnotationStore';

export function AnnotateWorkspace() {
  const hasImages = useAnnotationStore((state) => state.images.length > 0);
  const fetchImages = useAnnotationStore((state) => state.fetchImages);

  // Lives here (not in ImageCarousel) so it always runs, even when the
  // empty state below skips rendering the carousel entirely.
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  if (!hasImages) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ImageUploader />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <SliceViewerPanel title="Image" />
      </div>
      <ImageUploader />
      <ImageCarousel />
    </div>
  );
}
