import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { PipelineRibbon } from './PipelineRibbon';
import { GlobalSearch } from './GlobalSearch';

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header with search + pipeline */}
        <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <PipelineRibbon />
          </div>
          <GlobalSearch />
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
