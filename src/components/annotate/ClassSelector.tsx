'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PolygonLabel } from '@/lib/types';
import { useAnnotationStore } from '@/store/useAnnotationStore';

const LABELS: PolygonLabel[] = ['tumor', 'lesion', 'other'];

export function ClassSelector() {
  const selectedLabel = useAnnotationStore((state) => state.selectedLabel);
  const setSelectedLabel = useAnnotationStore(
    (state) => state.setSelectedLabel,
  );

  return (
    <Select
      value={selectedLabel}
      onValueChange={(value) => setSelectedLabel(value as PolygonLabel)}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LABELS.map((label) => (
          <SelectItem key={label} value={label}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
