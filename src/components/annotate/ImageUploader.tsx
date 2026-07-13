'use client';

import { useRef, useState } from 'react';
import { UploadIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnnotationStore } from '@/store/useAnnotationStore';

export function ImageUploader() {
  const uploadImage = useAnnotationStore((state) => state.uploadImage);
  const hasImages = useAnnotationStore((state) => state.images.length > 0);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadImage(file);
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(event) => handleFiles(event.target.files)}
    />
  );

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    handleFiles(event.dataTransfer.files);
  }

  // Once there's at least one image, the panels are the focus — shrink the
  // uploader down to a small button instead of a full dropzone taking up
  // header space. Drag-and-drop still lands on it, just onto a smaller target.
  if (hasImages) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex items-center gap-2 self-start rounded-md',
          isDragOver && 'ring-2 ring-primary/50',
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon />
          {uploading ? 'Uploading…' : 'Add image'}
        </Button>
        {fileInput}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors',
        isDragOver && 'border-primary bg-primary/5',
      )}
    >
      <UploadIcon className="size-6" />
      <p>Drag and drop an image, or</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Choose file'}
      </Button>
      {fileInput}
    </div>
  );
}
