import { createBrowserRouter, Navigate } from "react-router";
import { type ReactElement } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { HomePage } from "@/pages/HomePage";
import { CreateCompanyPage } from "@/pages/CreateCompanyPage";
import { CreateDashboardPage } from "@/pages/CreateDashboardPage";
import { ViewDashboardPage } from "@/pages/ViewDashboardPage";
import { UsersManagementPage } from "@/pages/UsersManagementPage";
import { AIAssistantPage } from "@/pages/AIAssistantPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { CompanySettingsPage } from "@/pages/CompanySettingsPage";
import { OpenRouterSettingsPage } from "@/pages/OpenRouterSettingsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { PermissionsPage } from "@/pages/PermissionsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AccessDeniedPage } from "@/pages/AccessDeniedPage";
import { SessionExpiredPage } from "@/pages/SessionExpiredPage";
import { AboutSystemPage } from "@/pages/AboutSystemPage";

function isAuthenticated(): boolean {
  try {
    const rawUser = localStorage.getItem("nexora_user");
    if (!rawUser) return false;

    const user = JSON.parse(rawUser) as { authenticated?: boolean };
    return user.authenticated === true;
  } catch {
    return false;
  }
}

function RequireAuth({ children }: { children: ReactElement }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
}

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "session-expired", element: <SessionExpiredPage /> },
    ],
  },
  {
    path: "/sobre",
    element: <AboutSystemPage />,
  },
  {
    path: "/",
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { path: "home", element: <Navigate to="/dashboards" replace /> },
      { path: "dashboards", element: <HomePage /> },
      { path: "company/create", element: <CreateCompanyPage /> },
      { path: "dashboards/create", element: <CreateDashboardPage /> },
      { path: "dashboards/:id", element: <ViewDashboardPage /> },
      { path: "users", element: <UsersManagementPage /> },
      { path: "ai-assistant", element: <AIAssistantPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "admin", element: <AdminDashboardPage /> },
      { path: "settings/company", element: <CompanySettingsPage /> },
      { path: "settings/openrouter", element: <OpenRouterSettingsPage /> },
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
