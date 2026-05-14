export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type RecurrenceType =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly_nth_weekday"
  | "yearly"
  | "custom";

export type CustomFreq = "day" | "week" | "month" | "year";

export interface CustomRecurrenceConfig {
  interval: number; // cada N (>=1)
  freq: CustomFreq;
  weekdays: number[]; // 0=Dom..6=Sáb, solo se usa cuando freq="week"
  endType: "never" | "until" | "count";
  endDate?: string; // YYYY-MM-DD, cuando endType="until"
  endCount?: number; // cuando endType="count"
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  color: string;
  created_at: string;
}

// Override del estado de UNA instancia de una tarea recurrente.
export interface TaskException {
  id: string;
  task_id: string;
  exception_date: string; // YYYY-MM-DD, la fecha de la instancia afectada
  status: TaskStatus | null;
  created_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  task_date: string; // YYYY-MM-DD (en instancias expandidas, fecha de la instancia)
  task_time: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  recurrence_type: RecurrenceType;
  recurrence_until: string | null;
  // Campos para "custom"
  recurrence_interval: number;
  recurrence_freq: CustomFreq | null;
  recurrence_weekdays: number[] | null;
  recurrence_count: number | null;
  // Calculado en cliente al expandir (no viene de la DB)
  series_anchor_date?: string; // fecha original de la serie
  is_recurring_instance?: boolean; // true si es una instancia expandida
  has_status_exception?: boolean; // true si esta instancia tiene override de estado
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
  recurrence_interval?: number;
  recurrence_freq?: CustomFreq | null;
  recurrence_weekdays?: number[] | null;
  recurrence_count?: number | null;
}
