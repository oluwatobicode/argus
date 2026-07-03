import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthLayout } from "./components/layout/AuthLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { RequireAuth } from "./components/layout/RequireAuth";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { VerifyOtpPage } from "./features/auth/VerifyOtpPage";
import { ProjectsConsolePage } from "./features/projects/ProjectsConsolePage";
import { OnboardingPage } from "./features/projects/OnboardingPage";
import { IssuesPage } from "./features/issues/IssuesPage";
import { IssueDetailPage } from "./features/issues/IssueDetailPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { UsagePage } from "./features/usage/UsagePage";
import { AlertsPage } from "./features/alerts/AlertsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
        </Route>

        {/* console — authed, no app sidebar */}
        <Route element={<RequireAuth />}>
          <Route path="/projects" element={<ProjectsConsolePage />} />
          <Route
            path="/projects/:projectId/onboarding"
            element={<OnboardingPage />}
          />
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
          <Route path="/projects/:projectId/usage" element={<UsagePage />} />
          <Route path="/projects/:projectId/alerts" element={<AlertsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
