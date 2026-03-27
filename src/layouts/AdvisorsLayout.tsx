import { NavLink, Outlet } from 'react-router-dom';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2.5 text-sm transition-colors ${
    isActive
      ? 'text-fx-blue font-medium underline decoration-fx-blue'
      : 'text-fx-600 hover:text-fx-black no-underline'
  }`;

export function AdvisorsLayout() {
  return (
    <div>
      <div className="sketch-border-bottom bg-fx-50/100">
        <div className="mx-auto max-w-7xl px-2">
          <nav className="flex gap-1 -mb-px">
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
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
