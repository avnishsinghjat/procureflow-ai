import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { RoleGuard } from "@/components/RoleGuard";
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

function Guarded({ children }: { children: React.ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
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
              <Route path="/" element={<Guarded><DashboardPage /></Guarded>} />
              <Route path="/cases" element={<Guarded><CasesPage /></Guarded>} />
              <Route path="/cases/new" element={<Guarded><CreateCasePage /></Guarded>} />
              <Route path="/cases/:id" element={<Guarded><CaseDetailPage /></Guarded>} />
              <Route path="/pipeline" element={<Guarded><PipelinePage /></Guarded>} />
              <Route path="/upload" element={<Guarded><UploadPage /></Guarded>} />
              <Route path="/ai-review" element={<Guarded><AIReviewPage /></Guarded>} />
              <Route path="/approvals" element={<Guarded><ApprovalsPage /></Guarded>} />
              <Route path="/audit" element={<Guarded><AuditTrailPage /></Guarded>} />
              <Route path="/archive" element={<Guarded><ArchivePage /></Guarded>} />
              <Route path="/settings" element={<Guarded><SettingsPage /></Guarded>} />
              <Route path="/users" element={<Guarded><UsersPage /></Guarded>} />
              <Route path="/checklists" element={<Guarded><ChecklistsPage /></Guarded>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
