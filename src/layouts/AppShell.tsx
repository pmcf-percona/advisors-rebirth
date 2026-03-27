import { Link, NavLink, Outlet } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-4 px-3 py-2 text-sm rounded-md transition-colors ${
    isActive
      ? 'bg-fx-150/50 text-fx-black font-medium'
      : 'text-fx-600 hover:text-fx-black hover:bg-fx-150/50'
  }`;

function GhostItem({ width }: { width: string }) {
  return (
    <div className="px-3 py-1 pointer-events-none select-none">
      <div className={`h-3 ${width} rounded bg-fx-200/50`} />
    </div>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-fx-paper">
      <aside className="w-48 shrink-0 flex flex-col">
        <div className="px-6 h-14 flex items-center">
          <Link to="/" className="text-lg font-semibold tracking-tight text-fx-black">
            PMM
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-3 px-3 py-0">
          <NavLink to="/" end className={navLinkClass}>
            Home dashboard
          </NavLink>
          <GhostItem width="w-24" />
          <GhostItem width="w-20" />
          <GhostItem width="w-28" />
          <GhostItem width="w-16" />
          <NavLink to="/advisors" className={navLinkClass}>
            Advisors
          </NavLink>
          <GhostItem width="w-22" />
          <GhostItem width="w-20" />
          <GhostItem width="w-26" />
        </nav>

        <div className="px-6 py-5">
          <span className="text-xs text-fx-600">
            This is a dummy prototype to help us with feedback on ideas for the PMM Advisors feature.
          </span>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
