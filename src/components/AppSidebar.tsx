import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, GitBranch, FileUp, Brain,
  CheckSquare, History, Search, Settings, Users, ListChecks,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/rbac';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  section?: 'admin';
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Cases', icon: FolderOpen, path: '/cases' },
  { label: 'Pipeline', icon: GitBranch, path: '/pipeline' },
  { label: 'Upload & OCR', icon: FileUp, path: '/upload' },
  { label: 'AI Review', icon: Brain, path: '/ai-review' },
  { label: 'Approvals', icon: CheckSquare, path: '/approvals' },
  { label: 'Audit Trail', icon: History, path: '/audit' },
  { label: 'Archive', icon: Search, path: '/archive' },
  { label: 'Settings', icon: Settings, path: '/settings', section: 'admin' },
  { label: 'Users', icon: Users, path: '/users', section: 'admin' },
  { label: 'Checklists', icon: ListChecks, path: '/checklists', section: 'admin' },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const visibleItems = allNavItems.filter(item => canAccessRoute(user.role, item.path));
  const mainItems = visibleItems.filter(i => !i.section);
  const adminItems = visibleItems.filter(i => i.section === 'admin');

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0 transition-all duration-200`}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-heading font-bold text-sm">
          PF
        </div>
        {!collapsed && <span className="font-heading font-bold text-sm text-sidebar-accent-foreground">ProcureFlow AI</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {mainItems.map(item => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {adminItems.length > 0 && (
          <>
            <div className={`${collapsed ? 'mx-2' : 'mx-3'} my-3 border-t border-sidebar-border`} />
            {!collapsed && <p className="px-3 text-[10px] uppercase tracking-widest text-sidebar-foreground/50 mb-1">Admin</p>}
            {adminItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User & collapse */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {user && !collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate capitalize">{user.role.replace(/_/g, ' ')}</p>
          </div>
        )}
        <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full">
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
