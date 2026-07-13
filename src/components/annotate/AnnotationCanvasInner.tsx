'use client';

import { useEffect, useRef, useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  Circle,
  Image as KonvaImage,
  Layer,
  Line,
  Stage,
} from 'react-konva';
import { toast } from 'sonner';

import { useAnnotationStore } from '@/store/useAnnotationStore';
import { imageToScreen, screenToImage } from '@/lib/imageCoords';
import { LABEL_COLORS } from '@/lib/labelColors';
import type { Polygon } from '@/lib/types';

const CLOSE_HIT_RADIUS = 10;
const DRAG_THRESHOLD = 4;
const EMPTY_POLYGONS: Polygon[] = [];

function clampOffset(
  base: number,
  contentSize: number,
  containerSize: number,
) {
  if (contentSize <= containerSize) return base;
  const min = containerSize - contentSize;
  return Math.min(Math.max(base, min), 0);
}

function useHtmlImage(src: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>(undefined);

  // Adjust state during render (React's documented pattern for resetting
  // state when a prop changes) instead of setState-in-effect, so switching
  // to a new/no image clears the stale one immediately, not one tick late.
  if (src !== loadedSrc) {
    setLoadedSrc(src);
    setImage(null);
  }

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);

  return image;
}

// Measures the container's box size and devicePixelRatio together, from the
// same event, so they can never go out of sync. Keeping them in separate
// effects let browser zoom remount the Konva Stage (see `pixelRatio` below)
// with a `size` that ResizeObserver hadn't caught up to yet, permanently
// wedging the stage at the wrong dimensions until a full page reload.
function useStageMetrics(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pixelRatio, setPixelRatio] = useState(
    () => window.devicePixelRatio || 1,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const rect = container!.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
      setPixelRatio(window.devicePixelRatio || 1);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    // Browser zoom always fires 'resize', and doing so guards against the
    // rare case where zoom changes devicePixelRatio without changing this
    // container's own box size (so ResizeObserver alone wouldn't fire).
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef]);

  return { size, pixelRatio };
}

interface AnnotationCanvasInnerProps {
  hideAnnotations?: boolean;
  // The image this canvas should display. Falls back to the store's global
  // `activeImageId` when omitted, so a panel can show its own slice
  // independently of whichever image other panels currently have active.
  imageId?: number | null;
  // Multiplier on top of the "fit to container" scale. 1 = fit exactly.
  zoom?: number;
  // When false, dragging pans the (possibly zoomed-in) image instead of
  // drawing a polygon. Resolves the "is this click a draw or a pan?"
  // ambiguity by reusing the toolbar's draw-mode toggle as a pan toggle.
  drawMode?: boolean;
}

export default function AnnotationCanvasInner({
  hideAnnotations = false,
  imageId,
  zoom = 1,
  drawMode = true,
}: AnnotationCanvasInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { size, pixelRatio } = useStageMetrics(containerRef);

  const images = useAnnotationStore((state) => state.images);
  const globalActiveImageId = useAnnotationStore(
    (state) => state.activeImageId,
  );
  const effectiveImageId = imageId ?? globalActiveImageId;
  const activeImage = images.find((image) => image.id === effectiveImageId);
  const activePolygons = useAnnotationStore((state) =>
    effectiveImageId
      ? (state.polygons[effectiveImageId] ?? EMPTY_POLYGONS)
      : EMPTY_POLYGONS,
  );

  const drawing = useAnnotationStore((state) => state.drawing);
  const selectedLabel = useAnnotationStore((state) => state.selectedLabel);
  const selectedPolygonId = useAnnotationStore(
    (state) => state.selectedPolygonId,
  );
  const setSelectedPolygonId = useAnnotationStore(
    (state) => state.setSelectedPolygonId,
  );
  const setActiveImageId = useAnnotationStore(
    (state) => state.setActiveImageId,
  );
  const startDrawing = useAnnotationStore((state) => state.startDrawing);
  const addDrawingPoint = useAnnotationStore(
    (state) => state.addDrawingPoint,
  );
  const closeDrawing = useAnnotationStore((state) => state.closeDrawing);
  const cancelDrawing = useAnnotationStore((state) => state.cancelDrawing);

  const htmlImage = useHtmlImage(activeImage?.file);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // A new slice, or dropping back to "fit", has nothing meaningful to pan
  // relative to — start it centered rather than carrying over an offset
  // from whatever the previous image/zoom level had. Adjusted during render
  // (same pattern as useHtmlImage above) rather than in an effect.
  const panResetKey = `${effectiveImageId}:${zoom <= 1}`;
  const [lastPanResetKey, setLastPanResetKey] = useState(panResetKey);
  if (panResetKey !== lastPanResetKey) {
    setLastPanResetKey(panResetKey);
    setPan({ x: 0, y: 0 });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        cancelDrawing();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelDrawing]);

  // Fit the image inside the container while preserving aspect ratio, then
  // apply the panel's zoom on top. This scale/offset is recomputed from
  // current `size` on every render, so a resize automatically re-maps
  // image-space points to the right place. When zoomed in, `pan` shifts the
  // centered position, clamped so the image can't be dragged out of view.
  let scale = 0;
  let drawWidth = 0;
  let drawHeight = 0;
  if (htmlImage && size.width > 0 && size.height > 0) {
    const fitScale = Math.min(
      size.width / htmlImage.width,
      size.height / htmlImage.height,
    );
    scale = fitScale * zoom;
    drawWidth = htmlImage.width * scale;
    drawHeight = htmlImage.height * scale;
  }
  const offsetX = clampOffset(
    (size.width - drawWidth) / 2 + pan.x,
    drawWidth,
    size.width,
  );
  const offsetY = clampOffset(
    (size.height - drawHeight) / 2 + pan.y,
    drawHeight,
    size.height,
  );
  const transform = { scale, offsetX, offsetY };

  function handlePanMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (drawMode) return;
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;

    let dragged = false;
    let totalMoved = 0;

    function handleWindowMouseMove(moveEvent: MouseEvent) {
      totalMoved += Math.hypot(moveEvent.movementX, moveEvent.movementY);
      // Only commit to "this is a drag" once the pointer has actually moved
      // a bit, so a plain click still reaches handleStageClick's
      // polygon-select logic instead of being swallowed as a zero-length pan.
      if (!dragged) {
        if (totalMoved < DRAG_THRESHOLD) return;
        dragged = true;
        setIsDragging(true);
      }
      setPan((current) => ({
        x: current.x + moveEvent.movementX,
        y: current.y + moveEvent.movementY,
      }));
    }

    function handleWindowMouseUp() {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      setIsDragging(false);
    }

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  }

  function handleStageClick(event: KonvaEventObject<MouseEvent>) {
    if (!drawMode || !htmlImage || scale === 0) return;
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    const screenPoint: [number, number] = [pointer.x, pointer.y];

    if (!drawing) {
      // `closeDrawing` saves against the store's `activeImageId`, so make
      // sure it points at whatever image *this* panel is showing before a
      // new shape starts (panels can each be on a different image now).
      if (
        effectiveImageId !== null &&
        effectiveImageId !== globalActiveImageId
      ) {
        setActiveImageId(effectiveImageId);
      }
      startDrawing(screenToImage(screenPoint, transform), selectedLabel);
      return;
    }
    if (drawing.closed) return;

    if (drawing.points.length >= 3) {
      const firstScreen = imageToScreen(drawing.points[0], transform);
      const distance = Math.hypot(
        screenPoint[0] - firstScreen[0],
        screenPoint[1] - firstScreen[1],
      );
      if (distance <= CLOSE_HIT_RADIUS) {
        closeDrawing().then((polygon) => {
          if (polygon) {
            toast.success('Polygon saved');
          } else {
            toast.error('Failed to save polygon.');
          }
        });
        return;
      }
    }
    addDrawingPoint(screenToImage(screenPoint, transform));
  }

  const canRenderShapes = htmlImage && scale > 0;
  const drawingScreenPoints = drawing
    ? drawing.points.map((point) => imageToScreen(point, transform))
    : [];
  const drawingColor = drawing ? LABEL_COLORS[drawing.label] : undefined;
  const canPan = !drawMode && (drawWidth > size.width || drawHeight > size.height);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[556px] w-full min-w-0 overflow-hidden"
      style={{
        cursor: canPan ? (isDragging ? 'grabbing' : 'grab') : undefined,
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Stage
          key={pixelRatio}
          width={size.width}
          height={size.height}
          onClick={handleStageClick}
          onMouseDown={handlePanMouseDown}
        >
          <Layer>
            {htmlImage && (
              <KonvaImage
                image={htmlImage}
                x={offsetX}
                y={offsetY}
                width={drawWidth}
                height={drawHeight}
              />
            )}

            {canRenderShapes &&
              !hideAnnotations &&
              activePolygons.map((polygon) => {
                const screenPoints = polygon.points.map((point) =>
                  imageToScreen(point, transform),
                );
                const isSelected = polygon.id === selectedPolygonId;
                return (
                  <Line
                    key={polygon.id}
                    points={screenPoints.flat()}
                    closed
                    stroke={LABEL_COLORS[polygon.label]}
                    strokeWidth={isSelected ? 4 : 2}
                    fill={`${LABEL_COLORS[polygon.label]}${isSelected ? 'aa' : '66'}`}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      setSelectedPolygonId(polygon.id);
                    }}
                  />
                );
              })}

            {canRenderShapes && drawing && (
              <>
                <Line
                  points={drawingScreenPoints.flat()}
                  closed={drawing.closed}
                  stroke={drawingColor}
                  strokeWidth={2}
                  fill={drawing.closed ? `${drawingColor}66` : undefined}
                />
                {drawingScreenPoints.map(([x, y], index) => (
                  <Circle
                    key={index}
                    x={x}
                    y={y}
                    radius={4}
                    fill={drawingColor}
                  />
                ))}
              </>
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
