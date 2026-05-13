export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type RecurrenceType =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly_nth_weekday"
  | "yearly";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  task_date: string; // YYYY-MM-DD (en instancias expandidas, es la fecha de la instancia)
  task_time: string | null; // HH:MM:SS
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  recurrence_type: RecurrenceType;
  recurrence_until: string | null; // YYYY-MM-DD
  // Calculado en cliente al expandir recurrencias (no viene de la DB):
  series_anchor_date?: string; // la fecha original de la tarea recurrente
  // Joined desde profiles
  assignee?: Profile | null;
  creator?: Profile | null;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  task_date: string;
  task_time?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  assigned_to?: string | null;
  recurrence_type?: RecurrenceType;
  recurrence_until?: string | null;
}
