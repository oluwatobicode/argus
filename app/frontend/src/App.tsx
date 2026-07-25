import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthLayout } from "./components/layout/AuthLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { RequireAuth } from "./components/layout/RequireAuth";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { VerifyOtpPage } from "./features/auth/VerifyOtpPage";
import { ProjectsConsolePage } from "./features/projects/ProjectsConsolePage";
import { CreateOrgPage } from "./features/organizations/CreateOrgPage";
import { OnboardingPage } from "./features/projects/OnboardingPage";
import { IssuesPage } from "./features/issues/IssuesPage";
import { IssueDetailPage } from "./features/issues/IssueDetailPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { UsagePage } from "./features/usage/UsagePage";
import { BillingPage } from "./features/billing/BillingPage";
import { MembersPage } from "./features/members/MembersPage";
import { AlertsPage } from "./features/alerts/AlertsPage";
import { PerformancePage } from "./features/performance/PerformancePage";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminLoginPage } from "./features/admin/AdminLoginPage";
import { OverviewPage } from "./features/admin/OverviewPage";
import { AdminUsersPage } from "./features/admin/AdminUsersPage";
import { AdminOrganizationsPage } from "./features/admin/AdminOrganizationsPage";
import { AdminBillingPage } from "./features/admin/AdminBillingPage";
import { LandingPage } from "./landing/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
          {/* org-less onboarding — guards itself (needs session, must NOT have an org) */}
          <Route path="/welcome" element={<CreateOrgPage />} />
        </Route>

        {/* console — authed, no app sidebar */}
        <Route element={<RequireAuth />}>
          <Route path="/projects" element={<ProjectsConsolePage />} />
          <Route
            path="/projects/:projectId/onboarding"
            element={<OnboardingPage />}
          />
        </Route>

        {/* platform admin — own login, own sidebar (guards itself) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
        </Route>

        {/* app — project-scoped, with sidebar (guards session itself) */}
        <Route element={<DashboardLayout />}>
          <Route path="/projects/:projectId/issues" element={<IssuesPage />} />
          <Route
            path="/projects/:projectId/issues/:issueId"
            element={<IssueDetailPage />}
          />
          <Route
            path="/projects/:projectId/settings"
            element={<SettingsPage />}
          />
          <Route
            path="/projects/:projectId/performance"
            element={<PerformancePage />}
          />
          <Route path="/projects/:projectId/usage" element={<UsagePage />} />
          <Route path="/projects/:projectId/billing" element={<BillingPage />} />
          <Route path="/projects/:projectId/members" element={<MembersPage />} />
          <Route path="/projects/:projectId/alerts" element={<AlertsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
