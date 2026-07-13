import type { PolygonLabel } from '@/lib/types';

// Display-only names. The underlying values ('tumor'/'lesion'/'other') stay
// as-is since they're validated against the backend's CLASS_CHOICES
// (annotate/constants.py) — changing them would need a migration.
export const LABEL_DISPLAY_NAMES: Record<PolygonLabel, string> = {
  tumor: 'Label 1',
  lesion: 'Label 2',
  other: 'Label 3',
};
