'use client';

import { useEffect } from 'react';
import { TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnnotationStore } from '@/store/useAnnotationStore';

export function ImageCarousel() {
  const images = useAnnotationStore((state) => state.images);
  const activeImageId = useAnnotationStore((state) => state.activeImageId);
  const setActiveImageId = useAnnotationStore(
    (state) => state.setActiveImageId,
  );
  const deleteImage = useAnnotationStore((state) => state.deleteImage);
  const fetchImages = useAnnotationStore((state) => state.fetchImages);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  function handleDelete(event: React.MouseEvent, id: number) {
    event.stopPropagation();
    if (window.confirm('Delete this image? Its polygons will be removed too.')) {
      deleteImage(id).catch(() => {
        // rollback already applied inside the store
      });
    }
  }

  if (images.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-muted-foreground">
        No images uploaded yet.
      </p>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto p-2">
      {images.map((image) => (
        <div key={image.id} className="group relative shrink-0">
          <button
            type="button"
            onClick={() => setActiveImageId(image.id)}
            className={cn(
              'block overflow-hidden rounded-md border-2 transition-colors',
              image.id === activeImageId
                ? 'border-primary'
                : 'border-transparent',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.file}
              alt=""
              className="h-20 w-20 object-cover"
            />
          </button>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            aria-label="Delete image"
            onClick={(event) => handleDelete(event, image.id)}
            className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
    </div>
  );
}
