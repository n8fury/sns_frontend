'use client';

import dynamic from 'next/dynamic';

import { ClassSelector } from '@/components/annotate/ClassSelector';

// react-konva touches `window`/canvas APIs that don't exist during SSR,
// so this must only ever mount on the client.
const AnnotationCanvasInner = dynamic(
  () => import('@/components/annotate/AnnotationCanvasInner'),
  { ssr: false },
);

export function AnnotationCanvas() {
  return (
    <div className="flex h-full flex-col gap-2">
      <ClassSelector />
      <div className="flex-1">
        <AnnotationCanvasInner />
      </div>
    </div>
  );
}
