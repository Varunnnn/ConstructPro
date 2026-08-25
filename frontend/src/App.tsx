import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute, AdminRoute } from './routes/guards';
import AdminLayout from './layouts/AdminLayout';

// Contractor & Marketing Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectFormPage from './pages/projects/ProjectFormPage';
import AssignWorkerPage from './pages/projects/AssignWorkerPage';
import WorkersPage from './pages/workers/WorkersPage';
import WorkerFormPage from './pages/workers/WorkerFormPage';
import AttendancePage from './pages/attendance/AttendancePage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import ExpenseFormPage from './pages/expenses/ExpenseFormPage';
import MaterialsPage from './pages/materials/MaterialsPage';
import MaterialFormPage from './pages/materials/MaterialFormPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import PricingPage from './pages/PricingPage';
import CustomerBillingPage from './pages/settings/CustomerBillingPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import SupportPage from './pages/SupportPage';
import EstimatesPage from './pages/estimates/EstimatesPage';
import SiteUpdatesPage from './pages/site-updates/SiteUpdatesPage';
import ClientsPage from './pages/clients/ClientsPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrganizationsPage from './pages/admin/AdminOrganizationsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AdminPortalRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="organizations" element={<AdminOrganizationsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing & Legal routes */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />

            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Admin portal routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/*" element={<AdminPortalRoutes />} />
            </Route>

            {/* Protected contractor routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<ProjectFormPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
              <Route path="/projects/:id/assign-worker" element={<AssignWorkerPage />} />
              <Route path="/workers" element={<WorkersPage />} />
              <Route path="/workers/new" element={<WorkerFormPage />} />
              <Route path="/workers/:id" element={<WorkerFormPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/expenses/new" element={<ExpenseFormPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/materials/new" element={<MaterialFormPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/estimates" element={<EstimatesPage />} />
              <Route path="/site-updates" element={<SiteUpdatesPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/billing" element={<CustomerBillingPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
