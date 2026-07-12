export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string; // ISO date (YYYY-MM-DD)
  tags: string[];
}

export interface AnnotationImage {
  id: number;
  file: string; // URL
  uploaded_at: string;
}

// Must match backend CLASS_CHOICES in annotate/constants.py
export type PolygonLabel = 'tumor' | 'lesion' | 'other';

export interface Polygon {
  id: number;
  image: number;
  label: PolygonLabel;
  points: [number, number][];
  color?: string;
}

export interface User {
  id: number;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
