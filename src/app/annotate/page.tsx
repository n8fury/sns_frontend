import { AnnotationCanvas } from '@/components/annotate/AnnotationCanvas';
import { ImageCarousel } from '@/components/annotate/ImageCarousel';
import { ImageUploader } from '@/components/annotate/ImageUploader';
import { PolygonList } from '@/components/annotate/PolygonList';

export default function AnnotatePage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">Annotate</h1>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ImageUploader />
        <ImageCarousel />
        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="min-h-[400px] flex-1">
            <AnnotationCanvas />
          </div>
          <aside className="w-full shrink-0 border-t pt-4 lg:w-64 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
            <PolygonList />
          </aside>
        </div>
      </div>
    </div>
  );
}
