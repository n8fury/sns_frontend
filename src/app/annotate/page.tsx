import { AnnotationCanvas } from '@/components/annotate/AnnotationCanvas';
import { ImageCarousel } from '@/components/annotate/ImageCarousel';
import { ImageUploader } from '@/components/annotate/ImageUploader';
import { PolygonList } from '@/components/annotate/PolygonList';

export default function AnnotatePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Annotate</h1>
      <ImageUploader />
      <ImageCarousel />
      <div className="flex flex-1 gap-4">
        <div className="flex-1">
          <AnnotationCanvas />
        </div>
        <aside className="w-64 shrink-0 border-l pl-4">
          <PolygonList />
        </aside>
      </div>
    </div>
  );
}
