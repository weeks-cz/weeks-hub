export type UserRole = 'admin' | 'member';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EventType = 'camp' | 'meeting' | 'reminder' | 'deadline';
export type ActionType =
  | 'task_created' | 'task_updated' | 'task_moved' | 'task_deleted'
  | 'subtask_created' | 'subtask_completed' | 'subtask_deleted'
  | 'event_created' | 'event_updated' | 'event_deleted'
  | 'user_updated';
export type EntityType = 'task' | 'subtask' | 'event' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string;
  position: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  assignee?: User | null;
  creator?: User;
  labels?: Label[];
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  color: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: User;
  attendees?: User[];
}

export interface EventAttendee {
  event_id: string;
  user_id: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined
  user?: User;
}

// Column config for Kanban board
export const TASK_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#64748B' },
  medium: { label: 'Medium', color: '#F59E0B' },
  high: { label: 'High', color: '#F97316' },
  urgent: { label: 'Urgent', color: '#EF4444' },
};

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string }> = {
  camp: { label: 'Camp', color: '#10B981' },
  meeting: { label: 'Schůzka', color: '#6366F1' },
  reminder: { label: 'Připomínka', color: '#F59E0B' },
  deadline: { label: 'Deadline', color: '#EF4444' },
};

export const DEFAULT_LABELS = [
  { name: 'Bug', color: '#EF4444' },
  { name: 'Feature', color: '#6366F1' },
  { name: 'Design', color: '#EC4899' },
  { name: 'Urgent', color: '#F97316' },
  { name: 'Camp Prep', color: '#10B981' },
  { name: 'Marketing', color: '#06B6D4' },
];
