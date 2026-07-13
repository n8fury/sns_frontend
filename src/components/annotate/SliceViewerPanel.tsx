'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  Redo2Icon,
  RefreshCwIcon,
  SaveIcon,
  Trash2Icon,
  Undo2Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { AnnotationCanvas } from '@/components/annotate/AnnotationCanvas';
import { ClassSelector } from '@/components/annotate/ClassSelector';
import { Button } from '@/components/ui/button';
import { useAnnotationStore } from '@/store/useAnnotationStore';

interface SliceViewerPanelProps {
  title: string;
}

function notImplemented() {
  toast('Not implemented yet.');
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;

export function SliceViewerPanel({ title }: SliceViewerPanelProps) {
  const images = useAnnotationStore((state) => state.images);
  const fetchPolygonsForImage = useAnnotationStore(
    (state) => state.fetchPolygonsForImage,
  );
  const selectedPolygonId = useAnnotationStore(
    (state) => state.selectedPolygonId,
  );
  const drawing = useAnnotationStore((state) => state.drawing);
  const drawingRedoStack = useAnnotationStore(
    (state) => state.drawingRedoStack,
  );
  const history = useAnnotationStore((state) => state.history);
  const deletePolygon = useAnnotationStore((state) => state.deletePolygon);
  const undoDrawingPoint = useAnnotationStore(
    (state) => state.undoDrawingPoint,
  );
  const redoDrawingPoint = useAnnotationStore(
    (state) => state.redoDrawingPoint,
  );
  const undo = useAnnotationStore((state) => state.undo);
  const redo = useAnnotationStore((state) => state.redo);

  const [hideAnnotations, setHideAnnotations] = useState(false);
  // Starts off: a plain click shouldn't accidentally start a polygon until
  // the pencil is explicitly turned on.
  const [drawMode, setDrawMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  // Each panel tracks which image it's showing independently, so navigating
  // one panel doesn't move the others.
  const [localImageId, setLocalImageId] = useState<number | null>(null);

  // Adjust state during render (same pattern as useHtmlImage in
  // AnnotationCanvasInner) rather than in an effect, so a deleted or
  // not-yet-loaded image resolves to a valid one on the very next render.
  const imageId =
    localImageId !== null && images.some((image) => image.id === localImageId)
      ? localImageId
      : (images[0]?.id ?? null);
  if (imageId !== localImageId) {
    setLocalImageId(imageId);
  }

  useEffect(() => {
    if (imageId !== null) {
      fetchPolygonsForImage(imageId);
    }
  }, [imageId, fetchPolygonsForImage]);

  const index = images.findIndex((image) => image.id === imageId);
  const total = images.length;

  function goTo(nextIndex: number) {
    const image = images[nextIndex];
    if (image) setLocalImageId(image.id);
  }

  function handleDelete() {
    if (selectedPolygonId === null) {
      toast.error('Select a polygon first.');
      return;
    }
    if (imageId === null) return;
    deletePolygon(selectedPolygonId, imageId)
      .then(() => toast.success('Polygon deleted'))
      .catch(() => toast.error('Failed to delete polygon.'));
  }

  const historyBucket = imageId !== null ? history[imageId] : undefined;
  const canUndo = drawing !== null || (historyBucket?.past.length ?? 0) > 0;
  const canRedo =
    drawingRedoStack.length > 0 || (historyBucket?.future.length ?? 0) > 0;

  function handleUndo() {
    // An in-progress shape takes priority: step back one point at a time
    // before falling back to popping the committed-polygon history.
    if (drawing) {
      undoDrawingPoint();
      return;
    }
    if (imageId === null) return;
    undo(imageId).catch(() => toast.error('Failed to undo.'));
  }

  function handleRedo() {
    // Mirror handleUndo's priority: restore an undone point (even one that
    // emptied the shape entirely) before redoing a committed polygon.
    if (drawingRedoStack.length > 0) {
      redoDrawingPoint();
      return;
    }
    if (imageId === null) return;
    redo(imageId).catch(() => toast.error('Failed to redo.'));
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <span className="text-center text-sm font-semibold">
        {title}
        {total > 0 ? ` (${index + 1}/${total})` : ''}
      </span>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <ClassSelector />
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={hideAnnotations}
            onChange={(event) => setHideAnnotations(event.target.checked)}
          />
          Hide Annotations
        </label>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1">
        <AnnotationCanvas
          hideAnnotations={hideAnnotations}
          imageId={imageId}
          zoom={zoom}
          drawMode={drawMode}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Previous ${title.toLowerCase()} slice`}
          disabled={index <= 0}
          onClick={() => goTo(index - 1)}
          className="absolute top-1/2 left-2 -translate-y-1/2"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Next ${title.toLowerCase()} slice`}
          disabled={index < 0 || index >= total - 1}
          onClick={() => goTo(index + 1)}
          className="absolute top-1/2 right-2 -translate-y-1/2"
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(total - 1, 0)}
        value={Math.max(index, 0)}
        disabled={total === 0}
        onChange={(event) => goTo(Number(event.target.value))}
        className="mx-auto w-full max-w-xs"
        aria-label={`${title} slice position`}
      />

      <div className="flex items-center justify-center gap-1 border-t pt-2">
        <Button
          type="button"
          variant={drawMode ? 'secondary' : 'ghost'}
          size="icon-sm"
          aria-label={
            drawMode ? 'Switch to pan mode' : 'Switch to draw mode'
          }
          title={
            drawMode
              ? 'Draw mode: click to add polygons'
              : 'Pan mode: drag to move the zoomed image'
          }
          onClick={() => setDrawMode((value) => !value)}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() =>
            setZoom((value) => Math.min(value * ZOOM_STEP, MAX_ZOOM))
          }
        >
          <ZoomInIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() =>
            setZoom((value) => Math.max(value / ZOOM_STEP, MIN_ZOOM))
          }
        >
          <ZoomOutIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete selected polygon"
          onClick={handleDelete}
        >
          <Trash2Icon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={handleUndo}
        >
          <Undo2Icon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={handleRedo}
        >
          <Redo2Icon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Sync"
          onClick={notImplemented}
        >
          <RefreshCwIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Save"
          onClick={notImplemented}
        >
          <SaveIcon />
        </Button>
      </div>
    </div>
  );
}
