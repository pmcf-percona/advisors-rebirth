import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';
import CodeEditorImport from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-yaml.js';
import type { AvailableCheck, DatabaseType } from '../../mocks/advisorsData';

/** Vite + CJS: default import can be `{ default: Component }` instead of the component. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CodeEditor = ((CodeEditorImport as any)?.default ?? CodeEditorImport) as typeof CodeEditorImport;

const STARLARK_TEXTAREA_ID = 'starlark-check-editor';

/** wireframe: mirrors PMM v2 check YAML fields */
interface CheckV2Object {
  name: string;
  summary: string;
  description: string;
  family: DatabaseType;
  advisor: string;
  interval: string;
  queries: string[];
  script: string;
}

function checkToV2(check: AvailableCheck): CheckV2Object {
  return {
    name: check.name,
    summary: check.summary,
    description: check.description,
    family: check.databaseType,
    advisor: 'dev',
    interval: check.interval,
    queries: [],
    script: check.configuration,
  };
}

function v2ToCheck(v2: CheckV2Object, source: AvailableCheck): AvailableCheck {
  return {
    ...source,
    name: v2.name,
    summary: v2.summary,
    description: v2.description,
    databaseType: v2.family,
    interval: v2.interval,
    configuration: v2.script,
  };
}

function v2ToYaml(v2: CheckV2Object): string {
  const indent = '    ';
  const scriptBlock = v2.script
    .split('\n')
    .map((line) => (line.length ? indent + line : ''))
    .join('\n');

  return [
    'checks:',
    `  version: 2`,
    `  name: ${v2.name}`,
    `  summary: ${v2.summary}`,
    `  description: ${v2.description}`,
    `  family: ${v2.family}`,
    `  interval: ${v2.interval}`,
    `  advisor: ${v2.advisor}`,
    `  queries: []`,
    `  script: |`,
    scriptBlock,
  ].join('\n');
}

const HEADER_MENU_MIN_WIDTH = 176;

const MOCK_METRICS = [
  { name: 'table_size', hint: 'Relation / collection size on disk' },
  { name: 'dead_tuples', hint: 'Estimated dead row count (PostgreSQL)' },
  { name: 'last_vacuum_time', hint: 'Epoch or RFC3339 last vacuum' },
  { name: 'last_autovacuum_time', hint: 'Last autovacuum run timestamp' },
  { name: 'host_cpu_percent', hint: 'Host CPU utilization %' },
  { name: 'threads_connected', hint: 'MySQL Threads_connected' },
  { name: 'max_connections', hint: 'MySQL max_connections' },
  { name: 'replication_lag_bytes', hint: 'Replica byte lag' },
  { name: 'replication_lag_seconds', hint: 'Replica time lag' },
  { name: 'slow_op_p99_ms', hint: 'P99 slow operation latency' },
  { name: 'binlog_retention_hours', hint: 'Binary log retention window' },
  { name: 'table_bloat_estimate_mb', hint: 'Heuristic bloat estimate' },
] as const;

const RECIPE_SNIPPETS = {
  bloat: `def check_bloat(metrics):
    """Recipe: table / index bloat watch (wireframe)"""
    est = metrics.get("table_bloat_estimate_mb", 0)
    dead = metrics.get("dead_tuples", 0)
    if est > 512 or dead > 1_000_000:
        return fail("bloat risk est_mb=" + str(est) + " dead=" + str(dead))
    return ok()
`,
  latency: `def check_latency(metrics):
    """Recipe: tail latency guard (wireframe)"""
    p99 = metrics.get("query_latency_p99_ms", 0)
    if p99 > 800:
        return fail("p99 latency " + str(p99) + "ms exceeds 800ms")
    return ok()
`,
  connections: `def check_connections(metrics):
    """Recipe: connection saturation (wireframe)"""
    u = metrics.get("threads_connected", 0)
    m = metrics.get("max_connections", 1)
    if float(u) / float(m) > 0.85:
        return fail("connections " + str(u) + "/" + str(m))
    return ok()
`,
} as const;

function highlightStarlark(code: string): string {
  const lang = Prism.languages.python;
  if (!lang) return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  try {
    return Prism.highlight(code, lang, 'python');
  } catch {
    return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

function highlightYaml(code: string): string {
  const lang = Prism.languages.yaml;
  if (!lang) return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  try {
    return Prism.highlight(code, lang, 'yaml');
  } catch {
    return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

function v2ToConfigYaml(v2: CheckV2Object): string {
  return [
    `version: 2`,
    `name: ${v2.name}`,
    `summary: ${v2.summary}`,
    `description: ${v2.description}`,
    `family: ${v2.family}`,
    `advisor: ${v2.advisor}`,
    `interval: ${v2.interval}`,
    `queries: []`,
  ].join('\n');
}

function parseConfigYaml(yaml: string, current: CheckV2Object): CheckV2Object {
  const kv: Record<string, string> = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (m) kv[m[1]] = m[2].trim();
  }
  const validFamilies = ['postgresql', 'mysql', 'mongodb'];
  return {
    ...current,
    name: kv.name ?? current.name,
    summary: kv.summary ?? current.summary,
    description: kv.description ?? current.description,
    family: (validFamilies.includes(kv.family) ? kv.family : current.family) as DatabaseType,
    advisor: kv.advisor ?? current.advisor,
    interval: kv.interval ?? current.interval,
  };
}

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

function OverflowMenu({
  align = 'right',
  items,
}: {
  align?: 'left' | 'right';
  items: { label: string; onSelect: () => void; danger?: boolean }[];
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
    const left =
      align === 'right'
        ? Math.min(
            Math.max(8, r.right - HEADER_MENU_MIN_WIDTH),
            Math.max(8, vw - HEADER_MENU_MIN_WIDTH - 8),
          )
        : Math.min(Math.max(8, r.left), Math.max(8, vw - HEADER_MENU_MIN_WIDTH - 8));
    setMenuPos({ top: r.bottom + 4, left });
  }, [align]);

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
          minWidth: HEADER_MENU_MIN_WIDTH,
          zIndex: 70,
        }}
        className="rounded-lg border border-fx-200 bg-fx-50/100 py-1"
      >
        {items.map((item) => (
          <li key={item.label} role="none">
            <button
              type="button"
              role="menuitem"
              className={`w-full px-3 py-2 text-left text-sm hover:bg-fx-100 ${
                item.danger ? 'text-fx-red' : 'text-fx-black'
              }`}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>,
      document.body,
    );

  return (
    <div className="flex shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className="rounded-md border border-fx-300 bg-fx-paper p-1.5 text-fx-600 hover:bg-fx-100 hover:text-fx-black"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
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

function StarlarkCopilotModal({
  open,
  onClose,
  onApplyStub,
}: {
  open: boolean;
  onClose: () => void;
  onApplyStub: (userLine: string) => void;
}) {
  const [nl, setNl] = useState('');

  useEffect(() => {
    if (open) setNl('');
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="copilot-modal-title">
      <button type="button" className="absolute inset-0 bg-fx-black/40" aria-label="Close" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border border-fx-200 bg-fx-paper p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="copilot-modal-title" className="text-base font-semibold text-fx-black">
          Generate with AI
        </h3>
        <p className="mt-2 text-sm text-fx-600 leading-relaxed">
          wireframe: describe what you want this check to do. In a real product, an LLM would emit Starlark; here we only
          drop in a placeholder function.
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-medium text-fx-600">Natural language</span>
          <textarea
            className="mt-1 min-h-[6rem] w-full resize-y rounded-md border border-fx-200 bg-fx-50/100 px-3 py-2 text-sm text-fx-black"
            placeholder='e.g. "Alert when dead tuples exceed 500k on public.users"'
            value={nl}
            onChange={(e) => setNl(e.target.value)}
          />
        </label>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-md border border-fx-300 bg-fx-paper px-4 py-2 text-sm font-medium text-fx-black hover:bg-fx-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-fx-blue px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            onClick={() => {
              const line = nl.trim().slice(0, 120) || 'user request';
              onApplyStub(line);
              onClose();
            }}
          >
            Generate (wireframe)
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type MetricRow = (typeof MOCK_METRICS)[number];

function MetricsDrawer({
  open,
  onClose,
  insertAtCursor,
  metricQuery,
  setMetricQuery,
  filteredMetrics,
}: {
  open: boolean;
  onClose: () => void;
  insertAtCursor: (text: string) => void;
  metricQuery: string;
  setMetricQuery: (v: string) => void;
  filteredMetrics: readonly MetricRow[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sketch-border-left flex w-56 shrink-0 flex-col border-l border-transparent bg-fx-50">
      <div className="sketch-border-bottom flex shrink-0 items-center justify-between border-b border-transparent px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-fx-500">
          Metrics
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-fx-400 hover:bg-fx-100 hover:text-fx-600"
          aria-label="Close metrics"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <input
          type="search"
          placeholder="Search metrics…"
          className="w-full rounded-md border border-fx-200 bg-fx-paper px-2 py-1.5 text-xs text-fx-black placeholder:text-fx-400"
          value={metricQuery}
          onChange={(e) => setMetricQuery(e.target.value)}
        />
        <ul className="mt-2 space-y-1">
          {filteredMetrics.map((m) => (
            <li key={m.name}>
              <button
                type="button"
                className="w-full rounded-md px-2 py-1.5 text-left hover:bg-fx-100"
                onClick={() => insertAtCursor(m.name)}
                title={m.hint}
              >
                <span className="font-mono text-[11px] font-medium text-fx-blue">{m.name}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-fx-500">{m.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecipesDrawer({
  open,
  onClose,
  setV2,
  onGenerateAI,
}: {
  open: boolean;
  onClose: () => void;
  setV2: Dispatch<SetStateAction<CheckV2Object>>;
  onGenerateAI: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sketch-border-left flex w-56 shrink-0 flex-col border-l border-transparent bg-fx-50">
      <div className="sketch-border-bottom flex shrink-0 items-center justify-between border-b border-transparent px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-fx-500">
          Recipes & AI
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-fx-400 hover:bg-fx-100 hover:text-fx-600"
          aria-label="Close recipes"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="flex flex-col gap-2">
          <button type="button" className="rounded-md border border-fx-200 bg-fx-paper px-2 py-2 text-left text-xs font-medium text-fx-black hover:bg-fx-100" onClick={() => setV2((d) => ({ ...d, script: RECIPE_SNIPPETS.bloat }))}>
            Check bloat
          </button>
          <button type="button" className="rounded-md border border-fx-200 bg-fx-paper px-2 py-2 text-left text-xs font-medium text-fx-black hover:bg-fx-100" onClick={() => setV2((d) => ({ ...d, script: RECIPE_SNIPPETS.latency }))}>
            Monitor latency
          </button>
          <button type="button" className="rounded-md border border-fx-200 bg-fx-paper px-2 py-2 text-left text-xs font-medium text-fx-black hover:bg-fx-100" onClick={() => setV2((d) => ({ ...d, script: RECIPE_SNIPPETS.connections }))}>
            Alert on connections
          </button>
          <button type="button" className="rounded-md border border-dashed border-fx-300 bg-fx-paper px-2 py-2 text-left text-xs font-medium text-fx-600 hover:bg-fx-100 hover:text-fx-blue" onClick={onGenerateAI}>
            ✨ Generate with AI
          </button>
        </div>
      </div>
    </div>
  );
}

export function CheckFullScreenEditor({
  check,
  onBack,
  onSave,
  onDisable,
  onDelete,
}: {
  check: AvailableCheck;
  onBack: () => void;
  onSave: (next: AvailableCheck) => void;
  onDisable: () => void;
  onDelete: () => void;
}) {
  const [v2, setV2] = useState<CheckV2Object>(() => checkToV2(check));
  const [configYaml, setConfigYaml] = useState(() => v2ToConfigYaml(checkToV2(check)));
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('dark');
  const [configOpen, setConfigOpen] = useState(false);
  const [logicOpen, setLogicOpen] = useState(true);
  const [testOpen, setTestOpen] = useState(false);
  const [metricsDrawerOpen, setMetricsDrawerOpen] = useState(false);
  const [recipesDrawerOpen, setRecipesDrawerOpen] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [metricQuery, setMetricQuery] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const dryRunCountRef = useRef(0);

  useEffect(() => {
    const next = checkToV2(check);
    setV2(next);
    setConfigYaml(v2ToConfigYaml(next));
  }, [check.id, check]);

  const handleConfigChange = useCallback((yaml: string) => {
    setConfigYaml(yaml);
    setV2((prev) => parseConfigYaml(yaml, prev));
  }, []);

  const syncSelection = useCallback(() => {
    const ta = document.getElementById(STARLARK_TEXTAREA_ID) as HTMLTextAreaElement | null;
    if (!ta) return;
    selectionRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const ta = document.getElementById(STARLARK_TEXTAREA_ID) as HTMLTextAreaElement | null;
    const s = ta ? ta.selectionStart : selectionRef.current.start;
    const e = ta ? ta.selectionEnd : selectionRef.current.end;
    const insertPos = s + text.length;
    setV2((d) => ({
      ...d,
      script: d.script.slice(0, s) + text + d.script.slice(e),
    }));
    requestAnimationFrame(() => {
      const el = document.getElementById(STARLARK_TEXTAREA_ID) as HTMLTextAreaElement | null;
      if (!el) return;
      el.focus();
      const p = Math.min(insertPos, el.value.length);
      el.setSelectionRange(p, p);
      selectionRef.current = { start: p, end: p };
    });
  }, []);

  const runDryRun = useCallback(async () => {
    setTestOpen(true);
    setTestBusy(true);
    setTestOutput(null);
    await new Promise((r) => setTimeout(r, 950));
    dryRunCountRef.current += 1;
    const wantFail = dryRunCountRef.current % 2 === 0;
    const payload = wantFail
      ? {
          dry_run: true,
          outcome: 'fail',
          evaluated_at: new Date().toISOString(),
          check_id: check.id,
          details: {
            reason: 'threshold_breached',
            metrics_sample: { dead_tuples: 1_800_000, table_bloat_estimate_mb: 640 },
          },
        }
      : {
          dry_run: true,
          outcome: 'pass',
          evaluated_at: new Date().toISOString(),
          check_id: check.id,
          details: { message: 'All predicates satisfied in sandbox snapshot.' },
        };
    setTestOutput(JSON.stringify(payload, null, 2));
    setTestBusy(false);
  }, [check.id]);

  const prismWrap = editorTheme === 'dark' ? 'studio-prism-dark' : 'studio-prism-light';
  const textareaCaret = editorTheme === 'dark' ? 'studio-editor-textarea-dark' : 'studio-editor-textarea-light';
  const editorBg = editorTheme === 'dark' ? '#282726' : '#FFFCF0';
  const filteredMetrics = MOCK_METRICS.filter(
    (m) =>
      m.name.toLowerCase().includes(metricQuery.trim().toLowerCase()) ||
      m.hint.toLowerCase().includes(metricQuery.trim().toLowerCase()),
  );

  const chevron = (open: boolean) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`shrink-0 text-fx-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-fx-paper">
      {/* ── Header ── */}
      <header className="sketch-border-bottom shrink-0 border-b border-transparent bg-fx-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md p-2 text-fx-600 hover:bg-fx-100 hover:text-fx-black"
            aria-label="Back to list"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-fx-black">{v2.name}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-md border border-fx-200 bg-fx-50/100 p-0.5 text-[11px]">
              <button
                type="button"
                className={`rounded px-2 py-0.5 ${editorTheme === 'light' ? 'bg-fx-150 font-medium text-fx-black' : 'text-fx-500'}`}
                onClick={() => setEditorTheme('light')}
              >
                Light
              </button>
              <button
                type="button"
                className={`rounded px-2 py-0.5 ${editorTheme === 'dark' ? 'bg-fx-850 font-medium text-fx-100' : 'text-fx-500'}`}
                onClick={() => setEditorTheme('dark')}
              >
                Dark
              </button>
            </div>
            <button
              type="button"
              className="rounded-md bg-fx-blue px-3 py-1 text-sm font-medium text-white hover:opacity-95"
              onClick={() => {
                const yaml = v2ToYaml(v2);
                setTestOutput('# ── Generated v2 YAML ──\n\n' + yaml);
                setTestOpen(true);
                onSave(v2ToCheck(v2, check));
              }}
            >
              Save
            </button>
            <OverflowMenu
              items={[
                {
                  label: 'Revert to Default',
                  onSelect: () => {
                    setV2((d) => ({ ...d, script: check.defaultConfiguration }));
                  },
                },
                { label: 'Disable check', onSelect: onDisable },
                { label: 'Delete check', danger: true, onSelect: onDelete },
              ]}
            />
          </div>
        </div>
      </header>

      {/* ── Accordion stack ── */}
      <div className="flex flex-col">
        {/* Section 1 — Configuration (YAML) */}
        <div className="sketch-border-bottom shrink-0 border-b border-transparent bg-fx-100">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-fx-100/50"
            onClick={() => setConfigOpen((o) => !o)}
            aria-expanded={configOpen}
          >
            {chevron(configOpen)}
            <span className="text-xs font-semibold uppercase tracking-wider text-fx-600">
              Configuration
            </span>
            <span className="rounded bg-fx-150 px-1.5 py-0.5 text-[12px] text-fx-500">
              yaml
            </span>
          </button>
          {configOpen && (
            <div className={`sketch-border-top max-h-72 overflow-auto border-t border-transparent ${prismWrap}`} style={{ backgroundColor: editorBg }}>
              <CodeEditor
                value={configYaml}
                onValueChange={handleConfigChange}
                highlight={highlightYaml}
                padding={16}
                className="font-mono text-sm leading-relaxed"
                style={{ minHeight: '120px' }}
                textareaClassName={`!outline-none focus:!ring-2 focus:!ring-inset focus:!ring-fx-blue/40 ${textareaCaret} !text-transparent !bg-transparent`}
                preClassName="!m-0 !bg-transparent"
              />
            </div>
          )}
        </div>

        {/* Section 2 — Logic (Starlark) */}
        <div
          className="sketch-border-bottom flex shrink-0 flex-col border-b border-transparent bg-fx-100"
        >
          <div className="flex shrink-0 items-center gap-2.5 px-4 py-2.5">
            <button
              type="button"
              className="flex flex-1 items-center gap-2.5 text-left"
              onClick={() => setLogicOpen((o) => !o)}
              aria-expanded={logicOpen}
            >
              {chevron(logicOpen)}
              <span className="text-xs font-semibold uppercase tracking-wider text-fx-600">
                Logic
              </span>
              <span className="rounded bg-fx-150 px-1.5 py-0.5 text-[12px] text-fx-500">
                starlark
              </span>
            </button>
            {logicOpen && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-fx-100 ${metricsDrawerOpen ? 'border-fx-blue bg-fx-blue/5 text-fx-blue' : 'border-fx-200 bg-fx-paper text-fx-600'}`}
                  onClick={() => { setMetricsDrawerOpen((o) => !o); setRecipesDrawerOpen(false); }}
                >
                  Metrics
                </button>
                <button
                  type="button"
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-fx-100 ${recipesDrawerOpen ? 'border-fx-blue bg-fx-blue/5 text-fx-blue' : 'border-fx-200 bg-fx-paper text-fx-600'}`}
                  onClick={() => { setRecipesDrawerOpen((o) => !o); setMetricsDrawerOpen(false); }}
                >
                  Recipes
                </button>
              </div>
            )}
          </div>
          {logicOpen && (
            <div className="sketch-border-top flex border-t border-transparent">
              <div
                className={`min-w-0 flex-1 ${prismWrap}`}
                style={{ backgroundColor: editorBg }}
              >
                <CodeEditor
                  value={v2.script}
                  onValueChange={(v) => setV2((d) => ({ ...d, script: v }))}
                  onKeyUp={syncSelection}
                  onMouseUp={syncSelection}
                  onClick={syncSelection}
                  highlight={highlightStarlark}
                  padding={16}
                  textareaId={STARLARK_TEXTAREA_ID}
                  className="font-mono text-sm leading-relaxed"
                  style={{}}
                  textareaClassName={`!outline-none focus:!ring-2 focus:!ring-inset focus:!ring-fx-blue/40 ${textareaCaret} !text-transparent !bg-transparent`}
                  preClassName="!m-0 !bg-transparent"
                />
              </div>
              <MetricsDrawer
                open={metricsDrawerOpen}
                onClose={() => setMetricsDrawerOpen(false)}
                insertAtCursor={insertAtCursor}
                metricQuery={metricQuery}
                setMetricQuery={setMetricQuery}
                filteredMetrics={filteredMetrics}
              />
              <RecipesDrawer
                open={recipesDrawerOpen}
                onClose={() => setRecipesDrawerOpen(false)}
                setV2={setV2}
                onGenerateAI={() => setCopilotOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Section 3 — Test Results */}
        <div className="sketch-border-bottom shrink-0 border-b border-transparent bg-fx-100">
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <button
              type="button"
              className="flex flex-1 items-center gap-2.5 text-left"
              onClick={() => setTestOpen((o) => !o)}
              aria-expanded={testOpen}
            >
              {chevron(testOpen)}
              <span className="text-xs font-semibold uppercase tracking-wider text-fx-600">
                Test Results
              </span>
            </button>
            <button
              type="button"
              className="rounded-md border border-fx-300 bg-fx-paper px-2.5 py-1 text-[11px] font-medium text-fx-700 hover:bg-fx-100 disabled:opacity-50"
              disabled={testBusy}
              onClick={() => void runDryRun()}
            >
              {testBusy ? 'Running…' : 'Test / Dry Run'}
            </button>
          </div>
          {testOpen && (
            <div
              className={`sketch-border-top max-h-56 min-h-[7rem] overflow-auto border-t border-transparent px-4 py-3 ${prismWrap}`}
              style={{ backgroundColor: editorBg }}
            >
              {testBusy ? (
                <div className={`flex items-center gap-2 text-sm font-mono ${editorTheme === 'dark' ? 'text-fx-300' : 'text-fx-600'}`}>
                  <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-fx-blue/40" />
                  Running dry run against sandbox snapshot…
                </div>
              ) : testOutput ? (
                <pre className={`font-mono text-xs leading-relaxed whitespace-pre-wrap ${editorTheme === 'dark' ? 'text-fx-200' : 'text-fx-800'}`}>
                  {testOutput}
                </pre>
              ) : (
                <p className={`text-sm font-mono ${editorTheme === 'dark' ? 'text-fx-400' : 'text-fx-500'}`}>
                  Run <strong className={`font-medium ${editorTheme === 'dark' ? 'text-fx-200' : 'text-fx-700'}`}>Test / Dry Run</strong> to see
                  output here.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <StarlarkCopilotModal
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        onApplyStub={(hint) => {
          const safe = hint.replace(/"""/g, "'''");
          setV2((d) => ({
            ...d,
            script: `def check_from_copilot(metrics):\n    """wireframe — Copilot placeholder: ${safe}"""\n    # TODO: generated Starlark would land here\n    return ok()\n`,
          }));
        }}
      />
    </div>
  );
}
