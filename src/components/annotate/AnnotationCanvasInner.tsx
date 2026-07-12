'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage, Layer, Stage } from 'react-konva';

import { useAnnotationStore } from '@/store/useAnnotationStore';

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

  return (
    <div ref={containerRef} className="h-full min-h-[400px] w-full">
      {size.width > 0 && size.height > 0 && (
        <Stage width={size.width} height={size.height}>
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
          </Layer>
        </Stage>
      )}
    </div>
  );
}
