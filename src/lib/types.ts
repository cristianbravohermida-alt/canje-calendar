export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

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
  task_date: string; // YYYY-MM-DD
  task_time: string | null; // HH:MM:SS
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields (cuando vienen con perfil del asignado)
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
}
