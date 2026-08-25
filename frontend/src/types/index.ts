// Utility type helpers and shared TypeScript types

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  role: 'contractor_owner' | 'contractor_member' | 'super_admin';
  organization_id?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
}

export interface AuthData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  organization: Organization;
}

// ── Projects ──────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  customer_name?: string;
  customer_phone?: string;
  site_address?: string;
  contract_value: string;
  start_date?: string;
  expected_end_date?: string;
  status: ProjectStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  financials?: ProjectFinancials;
  worker_count?: number;
  attendance_days?: number;
}

export interface ProjectFinancials {
  contract_value: string;
  labour_cost: string;
  material_cost: string;
  other_expenses: string;
  total_cost: string;
  profit: string;
  profit_margin: number;
  budget_used_pct: number;
}

export interface ProjectFormData {
  name: string;
  customer_name?: string;
  customer_phone?: string;
  site_address?: string;
  contract_value: string;
  start_date?: string;
  expected_end_date?: string;
  status: ProjectStatus;
  notes?: string;
}

// ── Workers ───────────────────────────────────────────────────────────────

export type WorkerType = 'mason' | 'helper' | 'carpenter' | 'electrician' | 'plumber' | 'painter' | 'other';
export type WorkerStatus = 'active' | 'inactive';

export interface Worker {
  id: string;
  name: string;
  mobile?: string;
  worker_type: WorkerType;
  daily_wage: string;
  joining_date?: string;
  status: WorkerStatus;
  notes?: string;
  created_at: string;
}

export interface ProjectWorker {
  id: string;
  worker: Worker;
  assigned_date?: string;
  is_active: boolean;
}

// ── Attendance ────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'half_day' | 'absent';

export interface AttendanceRecord {
  worker_id: string;
  worker_name: string;
  worker_type: WorkerType;
  daily_wage: string;
  status: AttendanceStatus;
  labour_cost: string;
}

export interface AttendanceEntry {
  id?: string;
  project_id: string;
  worker_id: string;
  date: string;
  status: AttendanceStatus;
  labour_cost: string;
  worker_name?: string;
  worker_type?: string;
}

// ── Expenses ──────────────────────────────────────────────────────────────

export type ExpenseCategory = 'transport' | 'fuel' | 'electricity' | 'tools' | 'food' | 'equipment' | 'labour_advance' | 'miscellaneous';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

export interface Expense {
  id: string;
  project_id: string;
  date: string;
  category: ExpenseCategory;
  amount: string;
  description?: string;
  payment_method: PaymentMethod;
  created_at: string;
  project_name?: string;
}

// ── Materials ─────────────────────────────────────────────────────────────

export type MaterialCategory = 'cement' | 'steel' | 'sand' | 'bricks' | 'stone' | 'plumbing' | 'electrical' | 'paint' | 'hardware' | 'other';
export type PaymentStatus = 'paid' | 'pending' | 'partial';

export interface Material {
  id: string;
  project_id: string;
  material_name: string;
  category: MaterialCategory;
  quantity: string;
  unit: string;
  unit_price: string;
  total_amount: string;
  supplier?: string;
  purchase_date: string;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  project_name?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardFinancials {
  total_contract_value: string;
  total_labour_cost: string;
  total_material_cost: string;
  total_other_expenses: string;
  total_cost: string;
  estimated_profit: string;
}

export interface DashboardProjectSummary {
  active: number;
  completed: number;
  planning: number;
  on_hold: number;
  over_budget: number;
}

export interface ActivityItem {
  id: string;
  description: string;
  entity_type: string;
  created_at: string;
  project_name?: string;
}

export interface Dashboard {
  financials: DashboardFinancials;
  project_summary: DashboardProjectSummary;
  recent_activity: ActivityItem[];
}

// ── Reports ───────────────────────────────────────────────────────────────

export interface ProjectProfitRow {
  project_id: string;
  project_name: string;
  contract_value: string;
  labour_cost: string;
  material_cost: string;
  other_expenses: string;
  total_cost: string;
  profit: string;
  profit_margin: number;
  status: string;
}

export interface LabourRow {
  worker_id: string;
  worker_name: string;
  worker_type: string;
  project_id: string;
  project_name: string;
  days_present: number;
  half_days: number;
  days_absent: number;
  total_labour_cost: string;
}

export interface ExpenseRow {
  id: string;
  date: string;
  project_name: string;
  category: string;
  amount: string;
  payment_method: string;
  description?: string;
}

export interface MaterialRow {
  id: string;
  purchase_date: string;
  project_name: string;
  material_name: string;
  supplier?: string;
  quantity: string;
  unit: string;
  unit_price: string;
  total_amount: string;
  payment_status: string;
}
