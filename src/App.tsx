import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CasesPage from "@/pages/CasesPage";
import CreateCasePage from "@/pages/CreateCasePage";
import CaseDetailPage from "@/pages/CaseDetailPage";
import PipelinePage from "@/pages/PipelinePage";
import UploadPage from "@/pages/UploadPage";
import AIReviewPage from "@/pages/AIReviewPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import AuditTrailPage from "@/pages/AuditTrailPage";
import ArchivePage from "@/pages/ArchivePage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import ChecklistsPage from "@/pages/ChecklistsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function LoginGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/new" element={<CreateCasePage />} />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/ai-review" element={<AIReviewPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/audit" element={<AuditTrailPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/checklists" element={<ChecklistsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
