import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  availableChecks as seedAvailableChecks,
  type AvailableCheck,
  type DatabaseType,
} from '../../mocks/advisorsData';
import { CheckFullScreenEditor } from './CheckFullScreenEditor';

const dbLabel: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
};

const selectClass =
  'w-full min-w-0 rounded-md border-0 bg-fx-100 px-2 py-2 text-sm text-fx-black shadow-none outline-none focus:ring-2 focus:ring-fx-blue/35 focus:ring-offset-0';

const inputClass =
  'w-full rounded-md border-0 bg-fx-100 px-3 py-2 text-sm text-fx-black shadow-none placeholder:text-fx-400 outline-none focus:ring-2 focus:ring-fx-blue/35 focus:ring-offset-0';

type CatalogFilterState = {
  search: string;
  enabled: '' | 'enabled' | 'disabled';
  databaseType: '' | DatabaseType;
  category: string;
  advisor: string;
};

type CatalogSortMode = 'name-az' | 'category-az' | 'database-az' | 'interval-asc';

const DEFAULT_CATALOG_SORT: CatalogSortMode = 'name-az';

function collectCatalogFilterOptions(checks: AvailableCheck[]) {
  const categories = new Set<string>();
  const advisors = new Set<string>();
  const databaseTypes = new Set<DatabaseType>();
  for (const c of checks) {
    categories.add(c.category);
    advisors.add(c.advisor);
    databaseTypes.add(c.databaseType);
  }
  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    advisors: [...advisors].sort((a, b) => a.localeCompare(b)),
    databaseTypes: [...databaseTypes].sort((a, b) => a.localeCompare(b)),
  };
}

function filterCatalogChecks(checks: AvailableCheck[], f: CatalogFilterState): AvailableCheck[] {
  const q = f.search.trim().toLowerCase();
  return checks.filter((c) => {
    if (f.enabled === 'enabled' && !c.enabled) return false;
    if (f.enabled === 'disabled' && c.enabled) return false;
    if (f.databaseType && c.databaseType !== f.databaseType) return false;
    if (f.category && c.category !== f.category) return false;
    if (f.advisor && c.advisor !== f.advisor) return false;
    if (q) {
      const hay = `${c.name} ${c.description} ${c.advisor}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function intervalSeconds(s: string): number {
  const m = /^(\d+)s$/.exec(s);
  return m ? Number(m[1]) : 0;
}

function sortCatalogChecks(checks: AvailableCheck[], mode: CatalogSortMode): AvailableCheck[] {
  const out = [...checks];
  switch (mode) {
    case 'name-az':
      out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      break;
    case 'category-az':
      out.sort((a, b) => {
        const byCat = a.category.localeCompare(b.category, undefined, { sensitivity: 'base' });
        if (byCat !== 0) return byCat;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      break;
    case 'database-az':
      out.sort((a, b) => {
        const byDb = a.databaseType.localeCompare(b.databaseType);
        if (byDb !== 0) return byDb;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      break;
    case 'interval-asc':
      out.sort((a, b) => {
        const byI = intervalSeconds(a.interval) - intervalSeconds(b.interval);
        if (byI !== 0) return byI;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      break;
    default:
      break;
  }
  return out;
}

function isCatalogFilterStateActive(f: CatalogFilterState, sortMode: CatalogSortMode): boolean {
  return (
    f.search.trim() !== '' ||
    f.enabled !== '' ||
    f.databaseType !== '' ||
    f.category !== '' ||
    f.advisor !== '' ||
    sortMode !== DEFAULT_CATALOG_SORT
  );
}

type CatalogToolbarOptions = ReturnType<typeof collectCatalogFilterOptions>;

function CatalogChecksToolbar(props: {
  search: string;
  onSearchChange: (v: string) => void;
  enabled: '' | 'enabled' | 'disabled';
  onEnabledChange: (v: '' | 'enabled' | 'disabled') => void;
  databaseType: '' | DatabaseType;
  onDatabaseTypeChange: (v: '' | DatabaseType) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  advisor: string;
  onAdvisorChange: (v: string) => void;
  sortMode: CatalogSortMode;
  onSortModeChange: (v: CatalogSortMode) => void;
  options: CatalogToolbarOptions;
  onReset: () => void;
  resetDisabled: boolean;
  /** Show reset row when any filter, search, or non-default sort is active */
  controlsActive: boolean;
}) {
  const {
    search,
    onSearchChange,
    enabled,
    onEnabledChange,
    databaseType,
    onDatabaseTypeChange,
    category,
    onCategoryChange,
    advisor,
    onAdvisorChange,
    sortMode,
    onSortModeChange,
    options,
    onReset,
    resetDisabled,
    controlsActive,
  } = props;

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:max-w-full">
          <input
            id="catalog-checks-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, description, or advisor..."
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Enabled</span>
            <select
              className={selectClass}
              value={enabled}
              onChange={(e) => onEnabledChange(e.target.value as '' | 'enabled' | 'disabled')}
            >
              <option value="">All checks</option>
              <option value="enabled">Enabled only</option>
              <option value="disabled">Disabled only</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Category</span>
            <select
              className={selectClass}
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">All categories</option>
              {options.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Database</span>
            <select
              className={selectClass}
              value={databaseType}
              onChange={(e) => onDatabaseTypeChange(e.target.value as '' | DatabaseType)}
            >
              <option value="">All databases</option>
              {options.databaseTypes.map((t) => (
                <option key={t} value={t}>
                  {dbLabel[t] ?? t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Advisor</span>
            <select
              className={selectClass}
              value={advisor}
              onChange={(e) => onAdvisorChange(e.target.value)}
            >
              <option value="">All advisors</option>
              {options.advisors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fx-700">Sort by</span>
            <select
              className={selectClass}
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as CatalogSortMode)}
            >
              <option value="name-az">Name (A–Z)</option>
              <option value="category-az">Category (A–Z)</option>
              <option value="database-az">Database (A–Z)</option>
              <option value="interval-asc">Interval (shortest first)</option>
            </select>
          </label>
        </div>

        {controlsActive ? (
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

function nextDuplicateId(existing: AvailableCheck[]) {
  let max = 0;
  for (const c of existing) {
    const m = /^avchk-dup-(\d+)$/.exec(c.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `avchk-dup-${max + 1}`;
}

const ROW_MENU_MIN_WIDTH = 160;

function collectScrollParents(el: HTMLElement | null): HTMLElement[] {
  const out: HTMLElement[] = [];
  let node: HTMLElement | null = el;
  while (node) {
    const { overflow, overflowX, overflowY } = getComputedStyle(node);
    const ox = `${overflow} ${overflowX} ${overflowY}`;
    if (/(auto|scroll|overlay)/.test(ox)) out.push(node);
    node = node.parentElement;
  }
  return out;
}

function RowOverflowMenu({
  onEditCode,
  onRunNow,
  onDuplicate,
}: {
  onEditCode: () => void;
  onRunNow: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const updateMenuPosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const left = Math.min(Math.max(8, r.right - ROW_MENU_MIN_WIDTH), Math.max(8, vw - ROW_MENU_MIN_WIDTH - 8));
    setMenuPos({ top: r.bottom + 4, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scrollParents = collectScrollParents(buttonRef.current);
    const onScrollOrResize = () => updateMenuPosition();
    scrollParents.forEach((el) => el.addEventListener('scroll', onScrollOrResize, { passive: true }));
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      scrollParents.forEach((el) => el.removeEventListener('scroll', onScrollOrResize));
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updateMenuPosition]);

  const menu =
    open &&
    createPortal(
      <ul
        ref={menuRef}
        role="menu"
        style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          minWidth: ROW_MENU_MIN_WIDTH,
          zIndex: 60,
        }}
        className="rounded-lg border border-fx-200 bg-fx-50/100 py-1"
      >
        <li role="none">
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-fx-black hover:bg-fx-100"
            onClick={() => {
              setOpen(false);
              onEditCode();
            }}
          >
            Edit Code
          </button>
        </li>
        <li role="none">
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-fx-black hover:bg-fx-100"
            onClick={() => {
              setOpen(false);
              onRunNow();
            }}
          >
            Run Now
          </button>
        </li>
        <li role="none">
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-fx-black hover:bg-fx-100"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          >
            Duplicate
          </button>
        </li>
      </ul>,
      document.body,
    );

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        className="rounded-md p-1.5 text-fx-500 hover:bg-fx-100 hover:text-fx-black"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {menu}
    </div>
  );
}

export function AvailableChecks() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<AvailableCheck[]>(() => [...seedAvailableChecks]);
  const [editorCheckId, setEditorCheckId] = useState<string | null>(null);
  /** Where to go when closing the editor: listing stays on page; feed returns to status feed. */
  const editorReturnTargetRef = useRef<'list' | 'feed' | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<'' | 'enabled' | 'disabled'>('');
  const [filterDatabaseType, setFilterDatabaseType] = useState<'' | DatabaseType>('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAdvisor, setFilterAdvisor] = useState('');
  const [sortMode, setSortMode] = useState<CatalogSortMode>(DEFAULT_CATALOG_SORT);

  const filterState: CatalogFilterState = useMemo(
    () => ({
      search,
      enabled: enabledFilter,
      databaseType: filterDatabaseType,
      category: filterCategory,
      advisor: filterAdvisor,
    }),
    [search, enabledFilter, filterDatabaseType, filterCategory, filterAdvisor],
  );

  const filterOptions = useMemo(() => collectCatalogFilterOptions(checks), [checks]);

  const visibleChecks = useMemo(() => {
    const filtered = filterCatalogChecks(checks, filterState);
    return sortCatalogChecks(filtered, sortMode);
  }, [checks, filterState, sortMode]);

  const controlsActive = isCatalogFilterStateActive(filterState, sortMode);

  const editingCheck = editorCheckId ? checks.find((c) => c.id === editorCheckId) : undefined;

  useEffect(() => {
    const raw = searchParams.get('edit');
    if (raw == null || raw.trim() === '') return;
    const id = raw.trim();
    if (checks.some((c) => c.id === id)) {
      editorReturnTargetRef.current = 'feed';
      setEditorCheckId(id);
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('edit');
        return next;
      },
      { replace: true },
    );
  }, [searchParams, checks, setSearchParams]);

  const toggle = useCallback((id: string) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  }, []);

  const exitEditor = useCallback(() => {
    const target = editorReturnTargetRef.current;
    editorReturnTargetRef.current = null;
    setEditorCheckId(null);
    if (target === 'feed') {
      navigate('/advisors/feed', { replace: true });
    }
  }, [navigate]);

  const saveCheck = useCallback((next: AvailableCheck) => {
    setChecks((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    window.alert('wireframe: changes saved locally in this prototype only.');
  }, []);

  const disableFromEditor = useCallback(() => {
    if (!editorCheckId) return;
    setChecks((prev) =>
      prev.map((c) => (c.id === editorCheckId ? { ...c, enabled: false } : c)),
    );
    exitEditor();
  }, [editorCheckId, exitEditor]);

  const deleteFromEditor = useCallback(() => {
    if (!editorCheckId) return;
    if (!window.confirm('wireframe: remove this check from the list?')) return;
    setChecks((prev) => prev.filter((c) => c.id !== editorCheckId));
    exitEditor();
  }, [editorCheckId, exitEditor]);

  const duplicateCheck = useCallback((check: AvailableCheck) => {
    setChecks((prev) => {
      const copy: AvailableCheck = {
        ...check,
        id: nextDuplicateId(prev),
        name: `${check.name} (copy)`,
        enabled: false,
      };
      return [...prev, copy];
    });
    window.alert(`wireframe: duplicated "${check.name}" as a new row (copy).`);
  }, []);

  const runNow = useCallback((check: AvailableCheck) => {
    window.alert(`wireframe: would queue immediate run for "${check.name}".`);
  }, []);

  const totalCount = checks.length;
  const visibleCount = visibleChecks.length;
  const enabledCount = checks.filter((c) => c.enabled).length;

  function resetFiltersAndSort() {
    setSearch('');
    setEnabledFilter('');
    setFilterDatabaseType('');
    setFilterCategory('');
    setFilterAdvisor('');
    setSortMode(DEFAULT_CATALOG_SORT);
  }

  return (
    <div className="relative min-w-0">
      <div aria-hidden={editorCheckId ? true : undefined} className="min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-fx-black">Available Checks</h1>
            <p className="mt-1 text-sm text-fx-600">
              {controlsActive ? (
                <>
                  {visibleCount} of {totalCount} checks match your filters.
                  <span className="mx-1">&middot;</span>
                  {enabledCount} of {totalCount} enabled overall.
                </>
              ) : (
                <>
                  {enabledCount} of {totalCount} checks enabled.
                </>
              )}
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-xl font-semibold text-fx-black">
          {controlsActive
            ? `${visibleCount} of ${totalCount} check${totalCount !== 1 ? 's' : ''}`
            : `${totalCount} available check${totalCount !== 1 ? 's' : ''}`}
        </h2>

        <CatalogChecksToolbar
          search={search}
          onSearchChange={setSearch}
          enabled={enabledFilter}
          onEnabledChange={setEnabledFilter}
          databaseType={filterDatabaseType}
          onDatabaseTypeChange={setFilterDatabaseType}
          category={filterCategory}
          onCategoryChange={setFilterCategory}
          advisor={filterAdvisor}
          onAdvisorChange={setFilterAdvisor}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          options={filterOptions}
          onReset={resetFiltersAndSort}
          resetDisabled={!controlsActive}
          controlsActive={controlsActive}
        />

        {visibleCount === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-fx-300 bg-fx-100/50 py-14 px-4 text-center">
            <p className="text-sm font-medium text-fx-600">
              {totalCount === 0 ? 'No checks in catalog' : 'No checks match your filters'}
            </p>
            {totalCount > 0 ? (
              <p className="mt-1 max-w-sm text-xs text-fx-500">
                Try clearing search or widening filter criteria.
              </p>
            ) : null}
            {totalCount > 0 ? (
              <button
                type="button"
                onClick={resetFiltersAndSort}
                className="mt-4 rounded-md border border-fx-300 bg-fx-paper px-3 py-1.5 text-sm font-medium text-fx-black hover:bg-fx-100"
              >
                Reset filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-lg border border-fx-200 pf-inset-1">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-max text-sm text-left">
                <thead>
                  <tr className="border-b border-fx-200 bg-fx-100/70">
                    <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">
                      Check
                    </th>
                    <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">
                      Database
                    </th>
                    <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">
                      Interval
                    </th>
                    <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide text-center">
                      Enabled
                    </th>
                    <th className="px-4 py-3 w-12 font-medium text-fx-600 text-xs uppercase tracking-wide text-right">
                      {/* actions */}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fx-150">
                  {visibleChecks.map((check) => (
                    <CheckRow
                      key={check.id}
                      check={check}
                      onToggle={toggle}
                      onEditCode={() => {
                        editorReturnTargetRef.current = 'list';
                        setEditorCheckId(check.id);
                      }}
                      onRunNow={() => runNow(check)}
                      onDuplicate={() => duplicateCheck(check)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editingCheck ? (
        <div
          className="fixed z-40 flex flex-col bg-fx-paper left-48 top-0 right-0 bottom-0"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit check: ${editingCheck.name}`}
        >
          <CheckFullScreenEditor
            check={editingCheck}
            onBack={exitEditor}
            onSave={saveCheck}
            onDisable={disableFromEditor}
            onDelete={deleteFromEditor}
          />
        </div>
      ) : null}
    </div>
  );
}

function CheckRow({
  check,
  onToggle,
  onEditCode,
  onRunNow,
  onDuplicate,
}: {
  check: AvailableCheck;
  onToggle: (id: string) => void;
  onEditCode: () => void;
  onRunNow: () => void;
  onDuplicate: () => void;
}) {
  return (
    <tr className="hover:bg-fx-100/40 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-fx-black">{check.name}</p>
        <p className="mt-0.5 max-w-md truncate text-xs text-fx-500">{check.description}</p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded border border-fx-200 bg-fx-100 px-2 py-0.5 font-mono text-xs text-fx-700">
          {dbLabel[check.databaseType]}
        </span>
      </td>
      <td className="px-4 py-3 text-fx-600">{check.category}</td>
      <td className="px-4 py-3 font-mono text-xs text-fx-600">{check.interval}</td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => onToggle(check.id)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            check.enabled ? 'bg-fx-green' : 'bg-fx-300'
          }`}
          aria-label={`${check.enabled ? 'Disable' : 'Enable'} ${check.name}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-fx-100/100 shadow-sm transition-transform ${
              check.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
      </td>
      <td className="px-2 py-3 align-middle">
        <RowOverflowMenu
          onEditCode={onEditCode}
          onRunNow={onRunNow}
          onDuplicate={onDuplicate}
        />
      </td>
    </tr>
  );
}
