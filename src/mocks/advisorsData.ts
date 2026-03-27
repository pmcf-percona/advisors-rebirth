export type CheckSeverity = 'critical' | 'warning' | 'notice';
export type CheckStatus = 'failed' | 'passed' | 'disabled';
export type DatabaseType = 'postgresql' | 'mongodb' | 'mysql';

export interface CheckResult {
  id: string;
  name: string;
  summary: string;
  description: string;
  severity: CheckSeverity;
  status: CheckStatus;
  databaseType: DatabaseType;
  target: string;
  category: string;
  lastRun: string;
  advisor: string;
}

export interface AvailableCheck {
  id: string;
  name: string;
  description: string;
  databaseType: DatabaseType;
  category: string;
  enabled: boolean;
  interval: string;
  advisor: string;
}

// ── Failed checks (default "mixed" scenario) ─────────────────────────────

export const failedChecks: CheckResult[] = [
  {
    id: 'chk-001',
    name: 'CPU Utilization Exceeds Threshold',
    summary:
      'PostgreSQL instance db-pg-prod-42 sustained >92 % CPU for 15 min — likely runaway sequential scan in query plan 0xA3F1.',
    description:
      'High CPU may indicate unoptimized queries, missing indexes, or unexpected load spikes. Check pg_stat_activity for long-running queries and correlate with recent deployment activity.',
    severity: 'critical',
    status: 'failed',
    databaseType: 'postgresql',
    target: 'db-pg-prod-42.acme.internal',
    category: 'Performance',
    lastRun: '2026-03-26T09:14:00Z',
    advisor: 'Performance Advisor',
  },
  {
    id: 'chk-002',
    name: 'Missing Index on Frequently Queried Collection',
    summary:
      'Collection "orders" on db-mongo-staging-7 lacks index for field "customer_id" — full collection scans on ~340 k docs.',
    description:
      'Queries filtering on customer_id perform COLLSCAN (~1.2 s avg). Adding { customer_id: 1 } would reduce latency to <10 ms. Detected via profiler slow-query log.',
    severity: 'warning',
    status: 'failed',
    databaseType: 'mongodb',
    target: 'db-mongo-staging-7.acme.internal',
    category: 'Schema',
    lastRun: '2026-03-26T08:45:00Z',
    advisor: 'Schema Advisor',
  },
  {
    id: 'chk-003',
    name: 'Autovacuum Not Running',
    summary:
      'Table "user_sessions" on db-pg-dev-99 has not been vacuumed in 14 days — ~2.1 M dead tuples accumulated.',
    description:
      'Dead-tuple bloat degrades sequential-scan performance and inflates table size. Verify that autovacuum_enabled = on and that thresholds are not set too high for this table\'s write rate.',
    severity: 'warning',
    status: 'failed',
    databaseType: 'postgresql',
    target: 'db-pg-dev-99.acme.internal',
    category: 'Maintenance',
    lastRun: '2026-03-26T07:30:00Z',
    advisor: 'Maintenance Advisor',
  },
  {
    id: 'chk-004',
    name: 'Connection Pool Near Exhaustion',
    summary:
      'MySQL instance db-mysql-prod-13 using 118 / 128 connections (92 %) — new connections may be refused.',
    description:
      'Connection pool is at 92 % capacity. If saturation reaches 100 %, new requests will receive "Too many connections" errors. Consider raising max_connections, enabling connection multiplexing, or auditing idle connections.',
    severity: 'critical',
    status: 'failed',
    databaseType: 'mysql',
    target: 'db-mysql-prod-13.acme.internal',
    category: 'Connectivity',
    lastRun: '2026-03-26T09:02:00Z',
    advisor: 'Connectivity Advisor',
  },
];

// ── Available checks catalogue ────────────────────────────────────────────

export const availableChecks: AvailableCheck[] = [
  {
    id: 'avchk-001',
    name: 'CPU Utilization Exceeds Threshold',
    description: 'Alerts when CPU usage stays above a configurable threshold for a sustained period.',
    databaseType: 'postgresql',
    category: 'Performance',
    enabled: true,
    interval: '60s',
    advisor: 'Performance Advisor',
  },
  {
    id: 'avchk-002',
    name: 'Missing Index Detection',
    description: 'Scans slow-query logs for collection scans that could be resolved by an index.',
    databaseType: 'mongodb',
    category: 'Schema',
    enabled: true,
    interval: '300s',
    advisor: 'Schema Advisor',
  },
  {
    id: 'avchk-003',
    name: 'Autovacuum Health',
    description: 'Verifies autovacuum is running within expected intervals for all tracked tables.',
    databaseType: 'postgresql',
    category: 'Maintenance',
    enabled: true,
    interval: '3600s',
    advisor: 'Maintenance Advisor',
  },
  {
    id: 'avchk-004',
    name: 'Connection Pool Saturation',
    description: 'Monitors active connections against max_connections and alerts before exhaustion.',
    databaseType: 'mysql',
    category: 'Connectivity',
    enabled: true,
    interval: '30s',
    advisor: 'Connectivity Advisor',
  },
  {
    id: 'avchk-005',
    name: 'Replication Lag',
    description: 'Checks replica lag and alerts when it exceeds the configured threshold.',
    databaseType: 'postgresql',
    category: 'Replication',
    enabled: false,
    interval: '60s',
    advisor: 'Replication Advisor',
  },
  {
    id: 'avchk-006',
    name: 'Disk Space Forecast',
    description: 'Projects disk usage trend and warns when storage will be exhausted within 7 days.',
    databaseType: 'mysql',
    category: 'Resources',
    enabled: false,
    interval: '3600s',
    advisor: 'Resource Advisor',
  },
  {
    id: 'avchk-007',
    name: 'Slow Query Detection',
    description: 'Flags queries exceeding the slow-query threshold configured per instance.',
    databaseType: 'mongodb',
    category: 'Performance',
    enabled: false,
    interval: '120s',
    advisor: 'Performance Advisor',
  },
  {
    id: 'avchk-008',
    name: 'Binary Log Retention',
    description: 'Ensures binary logs are rotated within the configured retention window.',
    databaseType: 'mysql',
    category: 'Maintenance',
    enabled: false,
    interval: '86400s',
    advisor: 'Maintenance Advisor',
  },
];

export interface FleetSummary {
  totalActive: number;
  passing: number;
  critical: number;
  warning: number;
}

export function getFleetSummary(): FleetSummary {
  const critical = failedChecks.filter((c) => c.severity === 'critical').length;
  const warning = failedChecks.filter((c) => c.severity === 'warning').length;
  const totalActive = 47;
  return { totalActive, passing: totalActive - critical - warning, critical, warning };
}

export function getScenarioChecks(): CheckResult[] {
  return failedChecks;
}
