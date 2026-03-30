import { Link } from 'react-router-dom';
import { failedChecks, getFleetSummary, type CheckResult, type CheckSeverity } from '../mocks/advisorsData';

function shortRunTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const severityDot: Record<CheckSeverity, string> = {
  critical: 'bg-fx-red',
  warning: 'bg-fx-yellow',
  notice: 'bg-fx-blue',
};

function AdvisorsFleetStrip({
  totalActive,
  passing,
  critical,
  warning,
  notice,
  hasActionable,
}: {
  totalActive: number;
  passing: number;
  critical: number;
  warning: number;
  notice: number;
  hasActionable: boolean;
}) {
  const displayPassing = hasActionable ? passing : totalActive;

  return (
    <div className="rounded-lg border border-fx-200 px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fx-green/15 text-fx-green">
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.5 5 9l4.5-6" />
            </svg>
          </span>
          <span className="text-2xl font-semibold text-fx-green">{displayPassing}</span>
          <span className="text-sm font-semibold text-fx-green/100">passed</span>
        </div>

        {hasActionable ? (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fx-red/15 text-fx-red">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </span>
              <span className="text-2xl font-semibold text-fx-red">{critical}</span>
              <span className="text-sm font-semibold text-fx-red/100">critical</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fx-yellow/15 text-fx-yellow">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 1v5" />
                  <circle cx="6" cy="10" r="1.25" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="text-2xl font-semibold text-fx-yellow">{warning}</span>
              <span className="text-sm font-semibold text-fx-yellow/100">warning</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fx-blue/15 text-fx-blue">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="3" r="1.25" fill="currentColor" stroke="none" />
                  <path d="M6 6v5" />
                </svg>
              </span>
              <span className="text-2xl font-semibold text-fx-blue">{notice}</span>
              <span className="text-sm font-semibold text-fx-blue/100">notice</span>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-10 gap-y-1 text-xs text-fx-500">
        <div className="flex items-center gap-2">
          <span>From {totalActive} active checks</span>
          <span>&middot;</span>
          <Link to="/advisors/available" className="text-fx-blue">
            Manage checks
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span>Last checked: 1 min. ago</span>
        </div>
      </div>
    </div>
  );
}

function RecentNotificationRow({ check }: { check: CheckResult }) {
  return (
    <li>
      <Link
        to="/advisors/feed"
        className="group flex gap-3 rounded-md py-1 pl-1 pr-1 transition-colors hover:bg-fx-100/60 -mx-1"
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 ${severityDot[check.severity]}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fx-black group-hover:text-fx-blue truncate">{check.name}</p>
          <p className="mt-0 text-xs text-fx-500 truncate">
            <span className="text-fx-600">{check.target}</span>
            <span className="mx-1.5 text-fx-300">&middot;</span>
            <span>{shortRunTime(check.lastRun)}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

export function Home() {
  const fleet = getFleetSummary();
  const hasActionable = failedChecks.length > 0;
  const recentNotifications = [...failedChecks]
    .sort((a, b) => new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime())
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-fx-black">
        Home dashboard
      </h1>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {/* ── Advisors Widget ───────────────────────────────────── */}
        <div className="rounded-lg border border-fx-200 bg-fx-50 p-5 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-medium text-fx-600 uppercase tracking-wide">
              Advisors
            </h2>
            <Link
              to="/advisors/feed"
              className="text-sm font-medium text-fx-blue hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="mt-2">
            <AdvisorsFleetStrip
              totalActive={fleet.totalActive}
              passing={fleet.passing}
              critical={fleet.critical}
              warning={fleet.warning}
              notice={fleet.notice}
              hasActionable={hasActionable}
            />
          </div>

          {recentNotifications.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs font-medium text-fx-500">
                Recent notifications
              </h3>
              <ul className="mt-0">
                {recentNotifications.map((check) => (
                  <RecentNotificationRow key={check.id} check={check} />
                ))}
              </ul>
            </div>
          ) : null}
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
