export type UserRole = 'developer' | 'admin' | 'member';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EventType = 'camp' | 'meeting' | 'reminder' | 'deadline';
export type CampStatus = 'collecting_interest' | 'open_no_link' | 'open_with_link' | 'full' | 'closed';
export type FormSubmissionType = 'waitlist' | 'contact' | 'shop_interest';
export type FormSubmissionStatus = 'new' | 'processed' | 'archived';
export type ShopProductType = 'set' | 'upgrade-kit' | 'project';

export type ActionType =
  | 'task_created' | 'task_updated' | 'task_moved' | 'task_deleted'
  | 'subtask_created' | 'subtask_completed' | 'subtask_deleted'
  | 'event_created' | 'event_updated' | 'event_deleted'
  | 'camp_created' | 'camp_updated' | 'camp_deleted' | 'camp_enrollment_changed'
  | 'submission_processed' | 'submission_archived' | 'submission_deleted' | 'submission_note_added'
  | 'shop_product_created' | 'shop_product_updated' | 'shop_product_deleted'
  | 'user_updated';
export type EntityType = 'task' | 'subtask' | 'event' | 'camp' | 'form_submission' | 'shop_product' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  custom_avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  position: string | null;
  phone: string | null;
  favorite_sport: string | null;
  favorite_color: string | null;
  favorite_food: string | null;
  motto: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  developer: { label: 'Developer', color: '#8B5CF6' },
  admin: { label: 'Admin', color: '#6366F1' },
  member: { label: 'Člen', color: '#64748B' },
};

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
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assignee?: User | null;
  creator?: User;
  labels?: Label[];
  subtasks?: Subtask[];
  child_tasks?: Task[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  assignee_id: string | null;
  description: string | null;
  parent_subtask_id: string | null;
  created_at: string;
  // Joined
  assignee?: User | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined
  user?: User;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  comment_id: string | null;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
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

export type CampProgram = '3d-tisk' | 'iot' | 'tech' | 'blender' | 'web' | 'hry' | 'csharp';
export type CampType = 'weekend' | 'oneday';

export interface Camp {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  location_detail: string | null;
  capacity: number;
  enrolled_count: number;
  status: CampStatus;
  registration_url: string | null;
  color: string | null;
  web_source_id: string | null;
  // Fields used by weeks.cz (added in migration 009)
  program: CampProgram | null;
  camp_type: CampType | null;
  price: number | null;
  ddm_id: string | null;
  day_label: string | null;
  display_order: number;
  single_day_option: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: User;
}

export const CAMP_PROGRAM_CONFIG: Record<CampProgram, { label: string; color: string }> = {
  '3d-tisk': { label: '3D tisk', color: '#8B5CF6' },
  'iot': { label: 'IoT & elektronika', color: '#06B6D4' },
  'tech': { label: 'MIX (3D + IoT + VR)', color: '#10B981' },
  'blender': { label: '3D modelování', color: '#F59E0B' },
  'web': { label: 'Tvorba webu', color: '#3B82F6' },
  'hry': { label: 'Vývoj her', color: '#EC4899' },
  'csharp': { label: 'Programování C#', color: '#6366F1' },
};

export const CAMP_TYPE_CONFIG: Record<CampType, { label: string }> = {
  weekend: { label: 'Víkendový (So+Ne)' },
  oneday: { label: 'Jednodenní' },
};

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  type: ShopProductType;
  price: number;
  age_range: string;
  level: string;
  lead_time: string;
  image_url: string;
  description: string;
  long_description: string;
  includes: string[];
  highlights: string[];
  ideal_for: string[];
  projects: string[];
  badge: string;
  category_label: string;
  unlocks: string;
  compatibility: string | null;
  published: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: User | null;
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

export type NotificationType = 'task_assigned' | 'new_submission' | 'camp_enrollment';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
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

export const CAMP_STATUS_CONFIG: Record<CampStatus, { label: string; color: string; icon: string }> = {
  collecting_interest: { label: 'Sbíráme zájem', color: '#F59E0B', icon: 'Search' },
  open_no_link: { label: 'Otevřeno', color: '#3B82F6', icon: 'DoorOpen' },
  open_with_link: { label: 'Registrace otevřena', color: '#10B981', icon: 'ExternalLink' },
  full: { label: 'Plný', color: '#EF4444', icon: 'UserX' },
  closed: { label: 'Uzavřeno', color: '#64748B', icon: 'Lock' },
};

// Form submissions
export interface FormSubmission {
  id: string;
  form_type: FormSubmissionType;
  email: string;
  submitted_at: string;
  // Waitlist fields
  child_name: string | null;
  child_age: string | null;
  program: string | null;
  gdpr_consent: boolean | null;
  // Contact fields
  sender_name: string | null;
  message: string | null;
  // Shop interest fields
  product_slug: string | null;
  product_name: string | null;
  product_type: ShopProductType | null;
  // Workflow
  status: FormSubmissionStatus;
  notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  processor?: User | null;
}

export const FORM_TYPE_CONFIG: Record<FormSubmissionType, { label: string; color: string }> = {
  waitlist: { label: 'Waitlist', color: '#8B5CF6' },
  contact: { label: 'Kontakt', color: '#3B82F6' },
  shop_interest: { label: 'E-shop zájem', color: '#10B981' },
};

export const SHOP_PRODUCT_TYPE_CONFIG: Record<ShopProductType, { label: string; color: string }> = {
  set: { label: 'Celá sada', color: '#3B82F6' },
  'upgrade-kit': { label: 'Navazující kit', color: '#F59E0B' },
  project: { label: 'Samostatný projekt', color: '#10B981' },
};

export const FORM_STATUS_CONFIG: Record<FormSubmissionStatus, { label: string; color: string }> = {
  new: { label: 'Nový', color: '#F59E0B' },
  processed: { label: 'Zpracováno', color: '#10B981' },
  archived: { label: 'Archivováno', color: '#64748B' },
};

export const PROGRAM_CONFIG: Record<string, string> = {
  'mix': 'MIX - Ochutnej vše',
  '3d-tisk': '3D tisk',
  'iot': 'IoT & Arduino',
  'blender': '3D modelování (Blender)',
  'web': 'Tvorba webu',
  'hry': 'Vývoj her',
  'csharp': 'Programování C#',
  'nevim': 'Ještě nevím',
};

// --- Registrations (interní KV registrace, sdílená tabulka s weeks_web) ---
export type RegistrationStatus = 'pending' | 'paid' | 'confirmed' | 'cancelled';
export type RegistrationPaymentStatus = 'pending' | 'completed' | 'refunded';
export type PickupMethod = 'solo' | 'named_persons';

export interface Registration {
  id: string;
  created_at: string;
  status: RegistrationStatus;
  location_id: string;
  program: string;
  term_id: string;
  term_start: string;
  term_end: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  parent_address: string;
  child_name: string;
  child_birthdate: string;
  child_insurance: string;
  child_health_notes: string | null;
  child_experience: string | null;
  pickup_method: PickupMethod | null;
  pickup_time: string | null;
  pickup_persons: string | null;
  vop_consent: boolean;
  gdpr_consent: boolean;
  photo_consent: boolean | null;
  marketing_consent: boolean | null;
  payment_status: RegistrationPaymentStatus;
  payment_method: string | null;
  payment_amount: number | null;
  payment_completed_at: string | null;
  comgate_payment_id: string | null;
  comgate_status: string | null;
  fakturoid_invoice_id: string | null;
  confirmation_sent_at: string | null;
  nastupni_sent_at: string | null;
  payment_reminder_sent_at: string | null;
  vop_accepted_at: string | null;
  vop_accepted_ip: string | null;
  notes: string | null;
}

export const REGISTRATION_STATUS_CONFIG: Record<RegistrationStatus, { label: string; color: string }> = {
  pending: { label: 'Čeká', color: '#F59E0B' },
  paid: { label: 'Zaplaceno', color: '#10B981' },
  confirmed: { label: 'Potvrzeno', color: '#6366F1' },
  cancelled: { label: 'Zrušeno', color: '#64748B' },
};

export const PAYMENT_STATUS_CONFIG: Record<RegistrationPaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Čeká na platbu', color: '#F59E0B' },
  completed: { label: 'Zaplaceno', color: '#10B981' },
  refunded: { label: 'Vráceno', color: '#64748B' },
};
