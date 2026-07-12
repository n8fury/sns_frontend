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

import { useAnnotationStore } from '@/store/useAnnotationStore';
import type { PolygonLabel } from '@/lib/types';

// Replaced by ClassSelector's bound value in Task 4.6.
const DEFAULT_LABEL: PolygonLabel = 'tumor';

const CLOSE_HIT_RADIUS = 10;

export const LABEL_COLORS: Record<PolygonLabel, string> = {
  tumor: '#ef4444',
  lesion: '#f59e0b',
  other: '#3b82f6',
};

function useHtmlImage(src: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
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

  const drawing = useAnnotationStore((state) => state.drawing);
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

  // Fit the image inside the container while preserving aspect ratio;
  // scale/offset here is also what Task 4.5's coordinate conversion uses.
  let drawWidth = 0;
  let drawHeight = 0;
  let offsetX = 0;
  let offsetY = 0;
  if (htmlImage && size.width > 0 && size.height > 0) {
    const scale = Math.min(
      size.width / htmlImage.width,
      size.height / htmlImage.height,
    );
    drawWidth = htmlImage.width * scale;
    drawHeight = htmlImage.height * scale;
    offsetX = (size.width - drawWidth) / 2;
    offsetY = (size.height - drawHeight) / 2;
  }

  function handleStageClick(event: KonvaEventObject<MouseEvent>) {
    if (!htmlImage) return;
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    const point: [number, number] = [pointer.x, pointer.y];

    if (!drawing) {
      startDrawing(point, DEFAULT_LABEL);
      return;
    }
    if (drawing.closed) return;

    if (drawing.points.length >= 3) {
      const [firstX, firstY] = drawing.points[0];
      const distance = Math.hypot(point[0] - firstX, point[1] - firstY);
      if (distance <= CLOSE_HIT_RADIUS) {
        closeDrawing();
        return;
      }
    }
    addDrawingPoint(point);
  }

  const fillColor = drawing ? LABEL_COLORS[drawing.label] : undefined;

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
            {drawing && (
              <>
                <Line
                  points={drawing.points.flat()}
                  closed={drawing.closed}
                  stroke={fillColor}
                  strokeWidth={2}
                  fill={drawing.closed ? `${fillColor}66` : undefined}
                />
                {drawing.points.map(([x, y], index) => (
                  <Circle key={index} x={x} y={y} radius={4} fill={fillColor} />
                ))}
              </>
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
