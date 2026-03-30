import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AvailableCheck, DatabaseType } from '../../mocks/advisorsData';

const INTERVAL_OPTIONS = ['30s', '60s', '120s', '300s', '3600s', '86400s'] as const;

const DB_OPTIONS: { value: DatabaseType; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mongodb', label: 'MongoDB' },
];

const HEADER_MENU_MIN_WIDTH = 176; // 11rem

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
  const [draft, setDraft] = useState<AvailableCheck>(check);
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    setDraft(check);
  }, [check.id, check]);

  const textareaClass =
    editorTheme === 'dark'
      ? 'border-fx-700 bg-fx-900 text-fx-100 placeholder:text-fx-500'
      : 'border-fx-200 bg-fx-50/100 text-fx-black placeholder:text-fx-400';

  return (
    <div className="flex h-full min-h-0 flex-col bg-fx-paper">
      <header className="shrink-0 sketch-border-bottom border-b border-fx-200 bg-fx-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md p-1.5 text-fx-600 hover:bg-fx-100 hover:text-fx-black"
            aria-label="Back to list"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-fx-black">{draft.name}</h1>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-fx-300 bg-fx-paper px-3 py-1.5 text-sm font-medium text-fx-700 hover:bg-fx-100"
              onClick={() => {
                window.alert('wireframe: Test / dry run would execute against a sandbox target.');
              }}
            >
              Test / Dry Run
            </button>
            <button
              type="button"
              className="rounded-md bg-fx-blue px-3 py-1.5 text-sm font-medium text-white hover:opacity-95"
              onClick={() => onSave(draft)}
            >
              Save
            </button>
            <OverflowMenu
              items={[
                {
                  label: 'Revert to Default',
                  onSelect: () =>
                    setDraft((d) => ({ ...d, configuration: d.defaultConfiguration })),
                },
                {
                  label: 'Disable',
                  onSelect: onDisable,
                },
                {
                  label: 'Delete',
                  danger: true,
                  onSelect: onDelete,
                },
              ]}
            />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-fx-200 lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-fx-200 bg-fx-100/50 px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-fx-500">
              Check definition
              <span className="ml-2 font-mono normal-case text-fx-600">
                ({draft.configurationKind})
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-fx-500">Editor</span>
              <div className="flex rounded-md border border-fx-200 bg-fx-50/100 p-0.5 text-xs">
                <button
                  type="button"
                  className={`rounded px-2 py-1 ${editorTheme === 'light' ? 'bg-fx-150 font-medium text-fx-black' : 'text-fx-600'}`}
                  onClick={() => setEditorTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`rounded px-2 py-1 ${editorTheme === 'dark' ? 'bg-fx-850 font-medium text-fx-100' : 'text-fx-600'}`}
                  onClick={() => setEditorTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
          <textarea
            className={`min-h-[240px] flex-1 resize-none border-0 p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-inset focus:ring-fx-blue/40 lg:min-h-0 ${textareaClass}`}
            spellCheck={false}
            value={draft.configuration}
            onChange={(e) => setDraft((d) => ({ ...d, configuration: e.target.value }))}
            aria-label="Check configuration"
          />
        </div>

        <aside className="shrink-0 border-fx-200 bg-fx-50/80 px-4 py-4 lg:w-72 lg:border-l-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-fx-500">Metadata</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-fx-600">Name</span>
              <input
                type="text"
                className="mt-1 w-full rounded-md bg-fx-100 px-2 py-2 text-sm text-fx-black"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                aria-label="Check name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-fx-600">Description</span>
              <textarea
                className="mt-1 min-h-[5.5rem] w-full resize-y rounded-md bg-fx-100 px-2 py-2 text-sm leading-snug text-fx-black"
                rows={4}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                aria-label="Check description"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-fx-600">Database</span>
              <select
                className="mt-1 w-full rounded-md bg-fx-100 px-2 py-2 text-sm text-fx-black"
                value={draft.databaseType}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, databaseType: e.target.value as DatabaseType }))
                }
              >
                {DB_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-fx-600">Category</span>
              <input
                type="text"
                className="mt-1 w-full rounded-md bg-fx-100 px-2 py-2 text-sm text-fx-black"
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-fx-600">Interval</span>
              <select
                className="mt-1 w-full rounded-md bg-fx-100 px-2 py-2 text-sm text-fx-black"
                value={draft.interval}
                onChange={(e) => setDraft((d) => ({ ...d, interval: e.target.value }))}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}
