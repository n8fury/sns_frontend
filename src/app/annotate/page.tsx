import { ImageCarousel } from '@/components/annotate/ImageCarousel';
import { ImageUploader } from '@/components/annotate/ImageUploader';

export default function AnnotatePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Annotate</h1>
      <ImageUploader />
      <ImageCarousel />
    </div>
  );
}
