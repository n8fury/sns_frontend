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

const CLOSE_HIT_RADIUS = 10;

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

export default function AnnotationCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const images = useAnnotationStore((state) => state.images);
  const activeImageId = useAnnotationStore((state) => state.activeImageId);
  const activeImage = images.find((image) => image.id === activeImageId);
  const activePolygons = useAnnotationStore((state) =>
    state.activeImageId ? (state.polygons[state.activeImageId] ?? []) : [],
  );

  const drawing = useAnnotationStore((state) => state.drawing);
  const selectedLabel = useAnnotationStore((state) => state.selectedLabel);
  const selectedPolygonId = useAnnotationStore(
    (state) => state.selectedPolygonId,
  );
  const setSelectedPolygonId = useAnnotationStore(
    (state) => state.setSelectedPolygonId,
  );
  const startDrawing = useAnnotationStore((state) => state.startDrawing);
  const addDrawingPoint = useAnnotationStore(
    (state) => state.addDrawingPoint,
  );
  const closeDrawing = useAnnotationStore((state) => state.closeDrawing);
  const cancelDrawing = useAnnotationStore((state) => state.cancelDrawing);

  const htmlImage = useHtmlImage(activeImage?.file);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        cancelDrawing();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelDrawing]);

  // Fit the image inside the container while preserving aspect ratio. This
  // scale/offset is recomputed from current `size` on every render, so a
  // resize automatically re-maps image-space points to the right place.
  let scale = 0;
  let drawWidth = 0;
  let drawHeight = 0;
  let offsetX = 0;
  let offsetY = 0;
  if (htmlImage && size.width > 0 && size.height > 0) {
    scale = Math.min(
      size.width / htmlImage.width,
      size.height / htmlImage.height,
    );
    drawWidth = htmlImage.width * scale;
    drawHeight = htmlImage.height * scale;
    offsetX = (size.width - drawWidth) / 2;
    offsetY = (size.height - drawHeight) / 2;
  }
  const transform = { scale, offsetX, offsetY };

  function handleStageClick(event: KonvaEventObject<MouseEvent>) {
    if (!htmlImage || scale === 0) return;
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    const screenPoint: [number, number] = [pointer.x, pointer.y];

    if (!drawing) {
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

  return (
    <div ref={containerRef} className="h-full min-h-[400px] w-full">
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          onClick={handleStageClick}
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
