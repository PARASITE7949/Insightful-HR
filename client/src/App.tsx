import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompanyRegister from "./pages/CompanyRegister";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

// Employee Pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeAttendance from "./pages/employee/Attendance";
import EmployeeTasks from "./pages/employee/Tasks";
import EmployeePerformance from "./pages/employee/Performance";
import DailyReport from "./pages/employee/DailyReport";

// HR Pages
import HRDashboard from "./pages/hr/Dashboard";
import HREmployees from "./pages/hr/Employees";
import HRReports from "./pages/hr/Reports";
import HRAppraisals from "./pages/hr/Appraisals";
import HRDailyReports from "./pages/hr/DailyReports";
import HRCalendar from "./pages/hr/Calendar";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import PendingApprovals from "./pages/admin/PendingApprovals";

import SecurityLogs from "./pages/admin/SecurityLogs";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/company-register" element={<CompanyRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={["hr_manager", "admin_staff", "employee"]}><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute allowedRoles={["hr_manager", "admin_staff", "employee"]}><Notifications /></ProtectedRoute>} />

            {/* Employee Routes */}
            <Route path="/employee" element={<ProtectedRoute allowedRoles={["employee"]}><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/employee/attendance" element={<ProtectedRoute allowedRoles={["employee"]}><EmployeeAttendance /></ProtectedRoute>} />
            <Route path="/employee/tasks" element={<ProtectedRoute allowedRoles={["employee"]}><EmployeeTasks /></ProtectedRoute>} />
            <Route path="/employee/performance" element={<ProtectedRoute allowedRoles={["employee"]}><EmployeePerformance /></ProtectedRoute>} />
            <Route path="/employee/daily-report" element={<ProtectedRoute allowedRoles={["employee"]}><DailyReport /></ProtectedRoute>} />

            {/* HR Routes */}
            <Route path="/hr" element={<ProtectedRoute allowedRoles={["hr_manager"]}><HRDashboard /></ProtectedRoute>} />
            <Route path="/hr/employees" element={<ProtectedRoute allowedRoles={["hr_manager"]}><HREmployees /></ProtectedRoute>} />
            <Route path="/hr/reports" element={<ProtectedRoute allowedRoles={["hr_manager"]}><HRReports /></ProtectedRoute>} />
            <Route path="/hr/appraisals" element={<ProtectedRoute allowedRoles={["hr_manager"]}><HRAppraisals /></ProtectedRoute>} />
            <Route path="/hr/daily-reports" element={<ProtectedRoute allowedRoles={["hr_manager"]}><HRDailyReports /></ProtectedRoute>} />
            <Route path="/hr/calendar" element={<ProtectedRoute allowedRoles={["hr_manager"]}><HRCalendar /></ProtectedRoute>} />

            {/* Admin Staff Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin_staff"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin_staff"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={["admin_staff"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin_staff"]}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/pending-approvals" element={<ProtectedRoute allowedRoles={["admin_staff"]}><PendingApprovals /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin_staff"]}><HRReports /></ProtectedRoute>} />
            <Route path="/admin/security" element={<ProtectedRoute allowedRoles={["admin_staff"]}><SecurityLogs /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
