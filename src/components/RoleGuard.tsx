import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/rbac';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface RoleGuardProps {
  children: React.ReactNode;
}

export function RoleGuard({ children }: RoleGuardProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  if (!canAccessRoute(user.role, location.pathname)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="p-4 bg-destructive/10 rounded-full mb-4">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Your role (<span className="font-medium capitalize">{user.role.replace(/_/g, ' ')}</span>) does not have permission to access this page.
        </p>
        <Link to="/"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    );
  }

  return <>{children}</>;
}
