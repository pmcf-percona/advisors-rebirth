import { NavLink, Outlet } from 'react-router-dom';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 whitespace-nowrap px-4 py-2.5 text-sm transition-colors ${
    isActive
      ? 'text-fx-blue font-medium underline decoration-fx-blue'
      : 'text-fx-600 hover:text-fx-black no-underline'
  }`;

export function AdvisorsLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 sketch-border-bottom bg-fx-50 z-10">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-2">
          <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain">
            <nav className="flex w-max max-w-none flex-nowrap gap-1 -mb-px">
              <NavLink to="/advisors/feed" className={tabClass}>
                Status feed
              </NavLink>
              <NavLink to="/advisors/available" className={tabClass}>
                Manage checks
              </NavLink>
              <NavLink to="/advisors/settings" className={tabClass}>
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <main className="mx-auto max-w-7xl min-w-0 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
