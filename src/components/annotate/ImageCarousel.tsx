'use client';

import { TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnnotationStore } from '@/store/useAnnotationStore';

// Only ever rendered once AnnotateWorkspace confirms images exist — the
// initial fetch lives there so it always runs, even in the empty state.
export function ImageCarousel() {
  const images = useAnnotationStore((state) => state.images);
  const activeImageId = useAnnotationStore((state) => state.activeImageId);
  const setActiveImageId = useAnnotationStore(
    (state) => state.setActiveImageId,
  );
  const deleteImage = useAnnotationStore((state) => state.deleteImage);

  function handleDelete(event: React.MouseEvent, id: number) {
    event.stopPropagation();
    if (window.confirm('Delete this image? Its polygons will be removed too.')) {
      deleteImage(id)
        .then(() => toast.success('Image deleted'))
        .catch(() => toast.error('Failed to delete image.'));
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto p-2">
      {images.map((image) => (
        <div key={image.id} className="group relative shrink-0">
          <button
            type="button"
            onClick={() => setActiveImageId(image.id)}
            className={cn(
              'block cursor-pointer overflow-hidden rounded-md border-2 transition-colors',
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
            variant="ghost"
            size="icon-xs"
            aria-label="Delete image"
            onClick={(event) => handleDelete(event, image.id)}
            className="absolute top-1 right-1 bg-black/60 text-white opacity-0 shadow-md transition-opacity hover:bg-black/80 hover:text-white group-hover:opacity-100"
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
    </div>
  );
}
