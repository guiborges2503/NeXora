import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "@/components/layouts/MainLayout";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { HomePage } from "@/pages/HomePage";
import { CreateCompanyPage } from "@/pages/CreateCompanyPage";
import { CreateDashboardPage } from "@/pages/CreateDashboardPage";
import { ViewDashboardPage } from "@/pages/ViewDashboardPage";
import { UsersManagementPage } from "@/pages/UsersManagementPage";
import { AIAssistantPage } from "@/pages/AIAssistantPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { CompanySettingsPage } from "@/pages/CompanySettingsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { PermissionsPage } from "@/pages/PermissionsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AccessDeniedPage } from "@/pages/AccessDeniedPage";
import { SessionExpiredPage } from "@/pages/SessionExpiredPage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "session-expired", element: <SessionExpiredPage /> },
    ],
  },
  {
    path: "/",
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "home", element: <HomePage /> },
      { path: "company/create", element: <CreateCompanyPage /> },
      { path: "dashboards/create", element: <CreateDashboardPage /> },
      { path: "dashboards/:id", element: <ViewDashboardPage /> },
      { path: "users", element: <UsersManagementPage /> },
      { path: "ai-assistant", element: <AIAssistantPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "admin", element: <AdminDashboardPage /> },
      { path: "settings/company", element: <CompanySettingsPage /> },
      { path: "settings/profile", element: <ProfilePage /> },
      { path: "audit", element: <AuditLogsPage /> },
      { path: "permissions", element: <PermissionsPage /> },
      { path: "access-denied", element: <AccessDeniedPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
