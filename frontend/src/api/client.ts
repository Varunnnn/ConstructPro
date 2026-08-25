import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const resp = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          const newAccess = resp.data.data.access_token;
          const newRefresh = resp.data.data.refresh_token;
          localStorage.setItem('access_token', newAccess);
          localStorage.setItem('refresh_token', newRefresh);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: object) => api.post('/auth/register', data),
  login: (data: object) => api.post('/auth/login', data),
  googleLogin: (data: { email: string; full_name: string; firebase_uid?: string }) => api.post('/auth/google', data),
  me: () => api.get('/auth/me'),
  refresh: (token: string) => api.post('/auth/refresh', { refresh_token: token }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// ── Projects ──────────────────────────────────────────────────────────────

export const projectsApi = {
  list: (params?: object) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: object) => api.post('/projects', data),
  update: (id: string, data: object) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getFinancials: (id: string) => api.get(`/projects/${id}/financials`),
  getWorkers: (id: string) => api.get(`/projects/${id}/workers`),
  assignWorker: (id: string, data: object) => api.post(`/projects/${id}/workers`, data),
  removeWorker: (projectId: string, workerId: string) => api.delete(`/projects/${projectId}/workers/${workerId}`),
};

// ── Workers ───────────────────────────────────────────────────────────────

export const workersApi = {
  list: (params?: object) => api.get('/workers', { params }),
  get: (id: string) => api.get(`/workers/${id}`),
  create: (data: object) => api.post('/workers', data),
  update: (id: string, data: object) => api.put(`/workers/${id}`, data),
  delete: (id: string) => api.delete(`/workers/${id}`),
};

// ── Attendance ────────────────────────────────────────────────────────────

export const attendanceApi = {
  list: (params?: object) => api.get('/attendance', { params }),
  getByProjectDate: (projectId: string, date: string) =>
    api.get(`/attendance/project/${projectId}/date/${date}`),
  bulkSave: (data: object) => api.post('/attendance', data),
};

// ── Expenses ──────────────────────────────────────────────────────────────

export const expensesApi = {
  list: (params?: object) => api.get('/expenses', { params }),
  create: (data: object) => api.post('/expenses', data),
  update: (id: string, data: object) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// ── Materials ─────────────────────────────────────────────────────────────

export const materialsApi = {
  list: (params?: object) => api.get('/materials', { params }),
  create: (data: object) => api.post('/materials', data),
  update: (id: string, data: object) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
};

export const reportsApi = {
  projectProfit: (params?: object) => api.get('/reports/project-profit', { params }),
  labour: (params?: object) => api.get('/reports/labour', { params }),
  expenses: (params?: object) => api.get('/reports/expenses', { params }),
  materials: (params?: object) => api.get('/reports/materials', { params }),
  exportCsv: (type: string, params?: object) =>
    api.get(`/reports/${type}/csv`, { params, responseType: 'blob' }),
};

export const masterDataApi = {
  projectTypes: () => api.get('/master-data/project-types'),
  stages: () => api.get('/master-data/construction-stages'),
  workerCategories: () => api.get('/master-data/worker-categories'),
  workerTypes: (params?: object) => api.get('/master-data/worker-types', { params }),
  units: () => api.get('/master-data/units'),
  materialCategories: () => api.get('/master-data/material-categories'),
  materials: (params?: object) => api.get('/master-data/materials', { params }),
  expenseCategories: () => api.get('/master-data/expense-categories'),
};

export const billingApi = {
  getPlans: () => api.get('/billing/plans'),
  getSubscription: () => api.get('/billing/subscription'),
  createCheckout: (data: object) => api.post('/billing/checkout', data),
  verifyPayment: (data: object) => api.post('/billing/verify-payment', data),
  cancel: () => api.post('/billing/cancel'),
  reactivate: () => api.post('/billing/reactivate'),
  getInvoices: () => api.get('/billing/invoices'),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrganizations: (params?: object) => api.get('/admin/organizations', { params }),
  assignPlan: (orgId: string, data: object) => api.post(`/admin/organizations/${orgId}/assign-plan`, data),
  extendTrial: (orgId: string, data: object) => api.post(`/admin/organizations/${orgId}/extend-trial`, data),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

export const clientsApi = {
  list: () => api.get('/new-modules/clients'),
  create: (data: object) => api.post('/new-modules/clients', data),
  delete: (id: string) => api.delete(`/new-modules/clients/${id}`),
};

export const estimatesApi = {
  list: () => api.get('/new-modules/estimates'),
  create: (data: object) => api.post('/new-modules/estimates', data),
};

export const siteUpdatesApi = {
  list: (params?: object) => api.get('/new-modules/site-updates', { params }),
  create: (data: object) => api.post('/new-modules/site-updates', data),
};

export const clientInvoicesApi = {
  list: () => api.get('/new-modules/client-invoices'),
  create: (data: object) => api.post('/new-modules/client-invoices', data),
};

