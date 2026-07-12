'use client';

import dynamic from 'next/dynamic';

// react-konva touches `window`/canvas APIs that don't exist during SSR,
// so this must only ever mount on the client.
const AnnotationCanvasInner = dynamic(
  () => import('@/components/annotate/AnnotationCanvasInner'),
  { ssr: false },
);

export function AnnotationCanvas() {
  return <AnnotationCanvasInner />;
}
