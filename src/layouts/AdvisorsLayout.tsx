import { NavLink, Outlet } from 'react-router-dom';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2.5 text-sm border-b-2 transition-colors ${
    isActive
      ? 'border-fx-blue text-fx-blue font-medium'
      : 'border-transparent text-fx-600 hover:text-fx-black hover:border-fx-300'
  }`;

export function AdvisorsLayout() {
  return (
    <div>
      <div className="border-b border-fx-200 bg-fx-100/50">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-1 -mb-px">
            <NavLink to="/advisors/feed" className={tabClass}>
              Checks Feed
            </NavLink>
            <NavLink to="/advisors/available" className={tabClass}>
              Available Checks
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
