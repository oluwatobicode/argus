import { BrowserRouter, Route, Routes } from "react-router";
import { AuthLayout } from "./components/layout/AuthLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { VerifyOtpPage } from "./features/auth/VerifyOtpPage";
import { IssuesPage } from "./features/issues/IssuesPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
        </Route>

        {/* DashboardLayout redirects to /login when the session probe fails */}
        <Route element={<DashboardLayout />}>
          <Route index element={<IssuesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
