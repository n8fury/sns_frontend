'use client';

import { TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnnotationStore } from '@/store/useAnnotationStore';

export function PolygonList() {
  const activeImageId = useAnnotationStore((state) => state.activeImageId);
  const polygons = useAnnotationStore((state) =>
    state.activeImageId ? (state.polygons[state.activeImageId] ?? []) : [],
  );
  const selectedPolygonId = useAnnotationStore(
    (state) => state.selectedPolygonId,
  );
  const setSelectedPolygonId = useAnnotationStore(
    (state) => state.setSelectedPolygonId,
  );
  const deletePolygon = useAnnotationStore((state) => state.deletePolygon);

  function handleDelete(event: React.MouseEvent, id: number) {
    event.stopPropagation();
    if (window.confirm('Delete this polygon?')) {
      deletePolygon(id).catch(() => {
        // rollback already applied inside the store
      });
    }
  }

  if (!activeImageId) return null;

  if (polygons.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-muted-foreground">
        No polygons on this image yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {polygons.map((polygon) => (
        <div
          key={polygon.id}
          onMouseEnter={() => setSelectedPolygonId(polygon.id)}
          className={cn(
            'flex items-center justify-between rounded-md border px-2 py-1.5 text-sm transition-colors',
            polygon.id === selectedPolygonId
              ? 'border-primary bg-primary/5'
              : 'border-transparent hover:bg-muted',
          )}
        >
          <button
            type="button"
            onClick={() => setSelectedPolygonId(polygon.id)}
            className="flex-1 cursor-pointer text-left"
          >
            {polygon.label}{' '}
            <span className="text-muted-foreground">
              ({polygon.points.length} pts)
            </span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Delete polygon"
            onClick={(event) => handleDelete(event, polygon.id)}
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
    </div>
  );
}
