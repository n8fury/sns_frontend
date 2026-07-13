'use client';

import dynamic from 'next/dynamic';

// react-konva touches `window`/canvas APIs that don't exist during SSR,
// so this must only ever mount on the client.
const AnnotationCanvasInner = dynamic(
  () => import('@/components/annotate/AnnotationCanvasInner'),
  { ssr: false },
);

interface AnnotationCanvasProps {
  hideAnnotations?: boolean;
  imageId?: number | null;
  zoom?: number;
  drawMode?: boolean;
}

export function AnnotationCanvas({
  hideAnnotations,
  imageId,
  zoom,
  drawMode,
}: AnnotationCanvasProps) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
      <AnnotationCanvasInner
        hideAnnotations={hideAnnotations}
        imageId={imageId}
        zoom={zoom}
        drawMode={drawMode}
      />
    </div>
  );
}
