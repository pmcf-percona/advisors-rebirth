import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  getScenarioChecks,
  getFleetSummary,
  type CheckResult,
  type CheckSeverity,
  type DatabaseType,
} from '../../mocks/advisorsData';

const severityConfig: Record<CheckSeverity, { dot: string; badge: string; label: string }> = {
  critical: {
    dot: 'bg-fx-red',
    badge: 'bg-fx-red/10 text-fx-red',
    label: 'Critical',
  },
  warning: {
    dot: 'bg-fx-yellow',
    badge: 'bg-fx-yellow/10 text-fx-yellow',
    label: 'Warning',
  },
  notice: {
    dot: 'bg-fx-blue',
    badge: 'bg-fx-blue/10 text-fx-blue',
    label: 'Notice',
  },
};

const dbLabels: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
};

const LIST_DESCRIPTION_MAX = 140;

function truncateForList(text: string, max = LIST_DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

const SEVERITY_SORT_RANK: Record<CheckSeverity, number> = {
  critical: 0,
  warning: 1,
  notice: 2,
};

type SortMode = 'severity' | 'time-newest' | 'time-oldest' | 'service-az';

const DEFAULT_SORT_MODE: SortMode = 'severity';

const selectClass =
  'w-full min-w-0 rounded-md border-0 bg-fx-100 px-2 py-2 text-sm text-fx-black shadow-none outline-none focus:ring-2 focus:ring-fx-blue/35 focus:ring-offset-0';

const inputClass =
  'w-full rounded-md border-0 bg-fx-100 px-3 py-2 text-sm text-fx-black shadow-none placeholder:text-fx-400 outline-none focus:ring-2 focus:ring-fx-blue/35 focus:ring-offset-0';

function collectFilterOptions(checks: CheckResult[]) {
  const environments = new Set<string>();
  const serviceTypes = new Set<DatabaseType>();
  const clusterOrRegion = new Set<string>();
  for (const c of checks) {
    environments.add(c.meta.environment);
    serviceTypes.add(c.databaseType);
    clusterOrRegion.add(c.meta.cluster);
    clusterOrRegion.add(c.meta.region);
  }
  return {
    environments: [...environments].sort((a, b) => a.localeCompare(b)),
    serviceTypes: [...serviceTypes].sort((a, b) => a.localeCompare(b)),
    clusterOrRegion: [...clusterOrRegion].sort((a, b) => a.localeCompare(b)),
  };
}

type AlertFilterState = {
  search: string;
  severity: '' | CheckSeverity;
  environment: string;
  serviceType: '' | DatabaseType;
  clusterRegion: string;
};

function filterChecks(checks: CheckResult[], f: AlertFilterState): CheckResult[] {
  const q = f.search.trim().toLowerCase();
  return checks.filter((c) => {
    if (f.severity && c.severity !== f.severity) return false;
    if (f.environment && c.meta.environment !== f.environment) return false;
    if (f.serviceType && c.databaseType !== f.serviceType) return false;
    if (f.clusterRegion && c.meta.cluster !== f.clusterRegion && c.meta.region !== f.clusterRegion) return false;
    if (q) {
      const inName = c.name.toLowerCase().includes(q);
      const inService = c.meta.service_name.toLowerCase().includes(q);
      if (!inName && !inService) return false;
    }
    return true;
  });
}

function sortChecks(checks: CheckResult[], mode: SortMode): CheckResult[] {
  const out = [...checks];
  switch (mode) {
    case 'severity':
      out.sort((a, b) => {
        const bySev = SEVERITY_SORT_RANK[a.severity] - SEVERITY_SORT_RANK[b.severity];
        if (bySev !== 0) return bySev;
        return new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime();
      });
      break;
    case 'time-newest':
      out.sort((a, b) => new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime());
      break;
    case 'time-oldest':
      out.sort((a, b) => new Date(a.lastRun).getTime() - new Date(b.lastRun).getTime());
      break;
    case 'service-az':
      out.sort((a, b) =>
        a.meta.service_name.localeCompare(b.meta.service_name, undefined, { sensitivity: 'base' }),
      );
      break;
    default:
      break;
  }
  return out;
}

function hasActiveFiltersOnly(f: AlertFilterState): boolean {
  return (
    f.search.trim() !== '' ||
    f.severity !== '' ||
    f.environment !== '' ||
    f.serviceType !== '' ||
    f.clusterRegion !== ''
  );
}

function isFilterStateActive(f: AlertFilterState, sortMode: SortMode): boolean {
  return hasActiveFiltersOnly(f) || sortMode !== DEFAULT_SORT_MODE;
}

function FleetSummary({
  allClear,
  onRefreshMock,
}: {
  allClear: boolean;
  /** wireframe: toggles between “all passed” and “has actionable failures” mock data */
  onRefreshMock: () => void;
}) {
  const { totalActive, passing, critical, warning, notice } = getFleetSummary();
  const displayPassing = allClear ? totalActive : passing;

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

        {!allClear && (
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
        )}
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
          <span>&middot;</span>
          <button
            type="button"
            className="text-fx-blue"
            onClick={onRefreshMock}
            title="Prototype: switch between all-clear and sample failures"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export function Feed() {
  /** When true, mock fleet has no failures (47 passed); Refresh toggles this. */
  const [mockFleetAllClear, setMockFleetAllClear] = useState(false);
  const sourceChecks = useMemo(
    () => (mockFleetAllClear ? [] : getScenarioChecks()),
    [mockFleetAllClear],
  );
  const [selected, setSelected] = useState<CheckResult | null>(null);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'' | CheckSeverity>('');
  const [environment, setEnvironment] = useState('');
  const [serviceType, setServiceType] = useState<'' | DatabaseType>('');
  const [clusterRegion, setClusterRegion] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE);

  const filterState: AlertFilterState = useMemo(
    () => ({ search, severity, environment, serviceType, clusterRegion }),
    [search, severity, environment, serviceType, clusterRegion],
  );

  const filterOptions = useMemo(() => collectFilterOptions(sourceChecks), [sourceChecks]);

  const visibleChecks = useMemo(() => {
    const filtered = filterChecks(sourceChecks, filterState);
    return sortChecks(filtered, sortMode);
  }, [sourceChecks, filterState, sortMode]);

  const controlsActive = isFilterStateActive(filterState, sortMode);

  useEffect(() => {
    if (selected && !visibleChecks.some((c) => c.id === selected.id)) {
      setSelected(null);
    }
  }, [selected, visibleChecks]);

  useEffect(() => {
    if (mockFleetAllClear) setSelected(null);
  }, [mockFleetAllClear]);

  function resetFiltersAndSort() {
    setSearch('');
    setSeverity('');
    setEnvironment('');
    setServiceType('');
    setClusterRegion('');
    setSortMode(DEFAULT_SORT_MODE);
  }

  const totalCount = sourceChecks.length;
  const visibleCount = visibleChecks.length;

  return (
    <div>
      <FleetSummary
        allClear={mockFleetAllClear}
        onRefreshMock={() => setMockFleetAllClear((v) => !v)}
      />

      {mockFleetAllClear ? (
        <>
          <h2 className="mt-6 text-xl font-semibold text-fx-black">No actionable checks</h2>
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-fx-300 bg-fx-100/50 py-14 px-6 text-center">
            <p className="text-sm font-medium text-fx-600">Nothing needs attention right now.</p>
            <p className="mt-2 max-w-md text-xs text-fx-500 leading-relaxed">
              All active checks are passing. Use{' '}
              <Link to="/advisors/available" className="text-fx-blue font-medium">
                Manage checks
              </Link>{' '}
              to add stricter rules, tune thresholds, or disable checks you don&apos;t need.
            </p>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-6 text-xl font-semibold text-fx-black">
            {controlsActive
              ? `${visibleCount} of ${totalCount} actionable check${totalCount !== 1 ? 's' : ''}`
              : `${totalCount} actionable check${totalCount !== 1 ? 's' : ''}`}
          </h2>

          <AlertsToolbar
            search={search}
            onSearchChange={setSearch}
            severity={severity}
            onSeverityChange={setSeverity}
            environment={environment}
            onEnvironmentChange={setEnvironment}
            serviceType={serviceType}
            onServiceTypeChange={setServiceType}
            clusterRegion={clusterRegion}
            onClusterRegionChange={setClusterRegion}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            options={filterOptions}
            onReset={resetFiltersAndSort}
            resetDisabled={!controlsActive}
          />

          {visibleCount === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-fx-300 bg-fx-100/50 py-14 px-4 text-center">
              <p className="text-sm font-medium text-fx-600">No checks match your filters</p>
              <p className="mt-1 max-w-sm text-xs text-fx-500">
                Try clearing search or widening filter criteria.
              </p>
              <button
                type="button"
                onClick={resetFiltersAndSort}
                className="mt-4 rounded-md border border-fx-300 bg-fx-paper px-3 py-1.5 text-sm font-medium text-fx-black hover:bg-fx-100"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {visibleChecks.map((check) => (
                <CheckCard key={check.id} check={check} onSelect={setSelected} />
              ))}
            </ul>
          )}
        </>
      )}

      <CheckDrawer check={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

type ToolbarOptions = ReturnType<typeof collectFilterOptions>;

function AlertsToolbar(props: {
  search: string;
  onSearchChange: (v: string) => void;
  severity: '' | CheckSeverity;
  onSeverityChange: (v: '' | CheckSeverity) => void;
  environment: string;
  onEnvironmentChange: (v: string) => void;
  serviceType: '' | DatabaseType;
  onServiceTypeChange: (v: '' | DatabaseType) => void;
  clusterRegion: string;
  onClusterRegionChange: (v: string) => void;
  sortMode: SortMode;
  onSortModeChange: (v: SortMode) => void;
  options: ToolbarOptions;
  onReset: () => void;
  resetDisabled: boolean;
}) {
  const {
    search,
    onSearchChange,
    severity,
    onSeverityChange,
    environment,
    onEnvironmentChange,
    serviceType,
    onServiceTypeChange,
    clusterRegion,
    onClusterRegionChange,
    sortMode,
    onSortModeChange,
    options,
    onReset,
    resetDisabled,
  } = props;

  const filtersOrSearchActive =
    search.trim() !== '' ||
    severity !== '' ||
    environment !== '' ||
    serviceType !== '' ||
    clusterRegion !== '';

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:max-w-full">
          <input
            id="alerts-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name or service..."
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Severity</span>
            <select
              className={selectClass}
              value={severity}
              onChange={(e) => onSeverityChange(e.target.value as '' | CheckSeverity)}
            >
              <option value="">All severities</option>
              <option value="critical">Error (Critical)</option>
              <option value="warning">Warning</option>
              <option value="notice">Notice</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Environment</span>
            <select
              className={selectClass}
              value={environment}
              onChange={(e) => onEnvironmentChange(e.target.value)}
            >
              <option value="">All environments</option>
              {options.environments.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Service type</span>
            <select
              className={selectClass}
              value={serviceType}
              onChange={(e) => onServiceTypeChange(e.target.value as '' | DatabaseType)}
            >
              <option value="">All types</option>
              {options.serviceTypes.map((t) => (
                <option key={t} value={t}>
                  {dbLabels[t] ?? t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Cluster / region</span>
            <select
              className={selectClass}
              value={clusterRegion}
              onChange={(e) => onClusterRegionChange(e.target.value)}
            >
              <option value="">All clusters &amp; regions</option>
              {options.clusterOrRegion.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Sort by</span>
            <select
              className={selectClass}
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as SortMode)}
            >
              <option value="severity">Severity (highest first)</option>
              <option value="time-newest">Time detected — newest first</option>
              <option value="time-oldest">Time detected — oldest first</option>
              <option value="service-az">Service name (A–Z)</option>
            </select>
          </label>
        </div>

        {filtersOrSearchActive ? (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onReset}
              disabled={resetDisabled}
              className="rounded-md border border-fx-300 bg-fx-paper px-3 py-1.5 text-sm font-medium text-fx-black hover:bg-fx-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Reset filters
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CheckCard({ check, onSelect }: { check: CheckResult; onSelect: (c: CheckResult) => void }) {
  const sev = severityConfig[check.severity];
  const dbLabel = dbLabels[check.databaseType] ?? check.databaseType;
  const time = new Date(check.lastRun).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li
      className="rounded-lg border p-4 cursor-pointer transition-colors hover:border-fx-400 hover:bg-fx-50/60"
      onClick={() => onSelect(check)}
    >
      <span className="block text-xs text-fx-500">{check.target}</span>
      <h3 className="mt-1 text-md font-semibold text-fx-black">{check.name}</h3>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sev.badge}`}>
          {sev.label}
        </span>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-fx-200/50 text-fx-700">
          {check.advisor}
        </span>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-fx-200/50 text-fx-700">
          {dbLabel}
        </span>
        <time className="text-xs text-fx-500">{time}</time>
      </div>
      <p className="mt-1.5 text-sm text-fx-700 leading-relaxed">{truncateForList(check.description)}</p>
    </li>
  );
}

const metaLabels: Record<string, string> = {
  environment: 'Environment',
  cluster: 'Cluster',
  region: 'Region',
  node_name: 'Node',
  service_name: 'Service',
  version: 'Version',
  agent_id: 'Agent ID',
};

function CheckDrawer({ check, onClose }: { check: CheckResult | null; onClose: () => void }) {
  const isOpen = check !== null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-fx-950/50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      {/* `div` not `aside`: global `aside { position: relative }` in index.css targets the app shell only and was overriding absolute positioning here. */}
      <div
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        className={`absolute top-0 right-0 bottom-0 z-10 flex w-full max-w-lg flex-col overflow-y-auto bg-fx-50/100 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {check && <CheckDrawerContent check={check} onClose={onClose} />}
      </div>
    </div>,
    document.body,
  );
}

function CheckDrawerContent({ check, onClose }: { check: CheckResult; onClose: () => void }) {
  const sev = severityConfig[check.severity];
  const dbLabel = dbLabels[check.databaseType] ?? check.databaseType;
  const time = new Date(check.lastRun).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div>
      <div className="flex items-start gap-0 px-4 py-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sev.badge}`}>
              {sev.label}
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-fx-200/50 text-fx-700">
              {dbLabel}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-fx-black leading-snug">{check.name}</h2>
          <p className="mt-1 text-sm text-fx-700 leading-relaxed">{check.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-sm p-1 text-fx-400 transition-colors hover:bg-fx-200/33 hover:text-fx-black"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-4">
        <h3 className="text-ms font-semibold">Metadata</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
          <MetaRow label="Target" value={check.target} />
          <MetaRow label="Category" value={check.category} />
          <MetaRow label="Advisor" value={check.advisor} />
          <MetaRow label="Last Run" value={time} />
          {Object.entries(check.meta).map(([key, value]) => (
            <MetaRow key={key} label={metaLabels[key] ?? key} value={value} />
          ))}
        </dl>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-fx-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-fx-black">{value}</dd>
    </div>
  );
}
