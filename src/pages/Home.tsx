import { Link } from 'react-router-dom';
import { failedChecks } from '../mocks/advisorsData';

const severityCounts = {
  critical: failedChecks.filter((c) => c.severity === 'critical').length,
  warning: failedChecks.filter((c) => c.severity === 'warning').length,
};

export function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-fx-black">
        Home dashboard
      </h1>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* ── Advisors Widget ───────────────────────────────────── */}
        <div className="rounded-lg border border-fx-200 bg-white p-5 shadow-sm col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-fx-600 uppercase tracking-wide">
              Advisors
            </h2>
            <Link
              to="/advisors/feed"
              className="text-sm font-medium text-fx-blue hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold text-fx-black">{failedChecks.length}</span>
            <span className="mb-1 text-sm text-fx-600">failed checks</span>
          </div>

          <div className="mt-3 flex gap-3">
            {severityCounts.critical > 0 && (
              <span className="inline-flex items-center rounded-full bg-fx-red/10 px-2.5 py-0.5 text-xs font-medium text-fx-red">
                {severityCounts.critical} critical
              </span>
            )}
            {severityCounts.warning > 0 && (
              <span className="inline-flex items-center rounded-full bg-fx-orange/10 px-2.5 py-0.5 text-xs font-medium text-fx-orange">
                {severityCounts.warning} warning
              </span>
            )}
          </div>

          <ul className="mt-4 divide-y divide-fx-150">
            {failedChecks.slice(0, 3).map((check) => (
              <li key={check.id} className="py-2.5 first:pt-0 last:pb-0">
                <Link to="/advisors/feed" className="group block">
                  <p className="text-sm font-medium text-fx-black group-hover:text-fx-blue truncate">
                    {check.name}
                  </p>
                  <p className="mt-0.5 text-xs text-fx-500 truncate">{check.target}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Placeholder widgets ───────────────────────────────── */}
        <PlaceholderCard title="Services panel" />
        <PlaceholderCard title="Instances panel" />
        <PlaceholderCard title="OS panel" />
        <PlaceholderCard title="Another summary panel" />
        <PlaceholderCard title="etc." />
      </div>
    </main>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-fx-50/100 p-5 flex items-center justify-center min-h-[200px]">
      <span className="text-sm text-fx-600 text-center">{title}</span>
    </div>
  );
}
