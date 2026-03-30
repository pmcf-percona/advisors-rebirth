export type CheckSeverity = 'critical' | 'warning' | 'notice';
export type CheckStatus = 'failed' | 'passed' | 'disabled';
export type DatabaseType = 'postgresql' | 'mongodb' | 'mysql';

export interface CheckMeta {
  environment: string;
  cluster: string;
  region: string;
  node_name: string;
  service_name: string;
  version: string;
  agent_id: string;
}

export interface CheckResult {
  id: string;
  name: string;
  /** Full alert narrative; list UI truncates, drawer shows whole string. */
  description: string;
  severity: CheckSeverity;
  status: CheckStatus;
  databaseType: DatabaseType;
  target: string;
  category: string;
  lastRun: string;
  advisor: string;
  meta: CheckMeta;
  /** wireframe: `AvailableCheck.id` to open in Manage checks editor from feed “Manage this check” */
  catalogCheckId: string;
}

/** wireframe: editor language — Starlark check body (Python-like highlighting in UI) */
export type CheckConfigurationKind = 'starlark';

export interface AvailableCheck {
  id: string;
  name: string;
  /** wireframe: short one-liner for the v2 `summary` field */
  summary: string;
  description: string;
  databaseType: DatabaseType;
  category: string;
  enabled: boolean;
  interval: string;
  advisor: string;
  /** wireframe: editable Starlark check implementation */
  configuration: string;
  configurationKind: CheckConfigurationKind;
  /** wireframe: factory default for “Revert to default” in editor */
  defaultConfiguration: string;
}

// ── Failed checks (default "mixed" scenario) ─────────────────────────────

export const failedChecks: CheckResult[] = [
  {
    id: 'chk-001',
    name: 'CPU Utilization Exceeds Threshold',
    description:
      'PostgreSQL instance db-pg-prod-42 sustained >92 % CPU for 15 min — likely runaway sequential scan in query plan 0xA3F1. High CPU may indicate unoptimized queries, missing indexes, or unexpected load spikes. Check pg_stat_activity for long-running queries and correlate with recent deployment activity.',
    severity: 'critical',
    status: 'failed',
    databaseType: 'postgresql',
    target: 'db-pg-prod-42.acme.internal',
    category: 'Performance',
    lastRun: '2026-03-26T09:14:00Z',
    advisor: 'Performance Advisor',
    catalogCheckId: 'avchk-001',
    meta: {
      environment: 'production',
      cluster: 'us-east-pg-primary',
      region: 'us-east-1',
      node_name: 'pg-node-42a',
      service_name: 'order-service',
      version: '16.2',
      agent_id: 'pmm-agent-0cf3a1',
    },
  },
  {
    id: 'chk-002',
    name: 'Missing Index on Frequently Queried Collection',
    description:
      'Collection "orders" on db-mongo-staging-7 lacks index for field "customer_id" — full collection scans on ~340 k docs. Queries filtering on customer_id perform COLLSCAN (~1.2 s avg). Adding { customer_id: 1 } would reduce latency to <10 ms. Detected via profiler slow-query log.',
    severity: 'warning',
    status: 'failed',
    databaseType: 'mongodb',
    target: 'db-mongo-staging-7.acme.internal',
    category: 'Schema',
    lastRun: '2026-03-26T08:45:00Z',
    advisor: 'Schema Advisor',
    catalogCheckId: 'avchk-002',
    meta: {
      environment: 'staging',
      cluster: 'eu-west-mongo-rs1',
      region: 'eu-west-1',
      node_name: 'mongo-rs1-node-7',
      service_name: 'catalog-service',
      version: '7.0.4',
      agent_id: 'pmm-agent-b82f19',
    },
  },
  {
    id: 'chk-003',
    name: 'Autovacuum Not Running',
    description:
      'Table "user_sessions" on db-pg-dev-99 has not been vacuumed in 14 days — ~2.1 M dead tuples accumulated. Dead-tuple bloat degrades sequential-scan performance and inflates table size. Verify that autovacuum_enabled = on and that thresholds are not set too high for this table\'s write rate.',
    severity: 'warning',
    status: 'failed',
    databaseType: 'postgresql',
    target: 'db-pg-dev-99.acme.internal',
    category: 'Maintenance',
    lastRun: '2026-03-26T07:30:00Z',
    advisor: 'Maintenance Advisor',
    catalogCheckId: 'avchk-003',
    meta: {
      environment: 'development',
      cluster: 'us-west-pg-dev',
      region: 'us-west-2',
      node_name: 'pg-dev-node-99',
      service_name: 'auth-service',
      version: '15.6',
      agent_id: 'pmm-agent-4de710',
    },
  },
  {
    id: 'chk-004',
    name: 'Connection Pool Near Exhaustion',
    description:
      'MySQL instance db-mysql-prod-13 using 118 / 128 connections (92 %) — new connections may be refused. Connection pool is at 92 % capacity. If saturation reaches 100 %, new requests will receive "Too many connections" errors. Consider raising max_connections, enabling connection multiplexing, or auditing idle connections.',
    severity: 'critical',
    status: 'failed',
    databaseType: 'mysql',
    target: 'db-mysql-prod-13.acme.internal',
    category: 'Connectivity',
    lastRun: '2026-03-26T09:02:00Z',
    advisor: 'Connectivity Advisor',
    catalogCheckId: 'avchk-004',
    meta: {
      environment: 'production',
      cluster: 'ap-south-mysql-ha',
      region: 'ap-south-1',
      node_name: 'mysql-ha-node-13',
      service_name: 'payments-service',
      version: '8.0.36',
      agent_id: 'pmm-agent-91ab2c',
    },
  },
  {
    id: 'chk-005',
    name: 'Query Plan Cache Hit Ratio Below Optimal',
    description:
      'PostgreSQL instance db-pg-staging-11 plan cache hit ratio at 88 % over the last hour — below the 95 % recommendation. A lower plan cache hit ratio means the planner regenerates execution plans more often than expected. Usually harmless at this level, but worth reviewing if prepared statements or PL/pgSQL functions were recently changed.',
    severity: 'notice',
    status: 'failed',
    databaseType: 'postgresql',
    target: 'db-pg-staging-11.acme.internal',
    category: 'Performance',
    lastRun: '2026-03-26T08:58:00Z',
    advisor: 'Performance Advisor',
    /** wireframe: no exact catalog twin; opens CPU check as same advisor/category bucket */
    catalogCheckId: 'avchk-001',
    meta: {
      environment: 'staging',
      cluster: 'us-east-pg-staging',
      region: 'us-east-1',
      node_name: 'pg-staging-node-11',
      service_name: 'analytics-service',
      version: '16.2',
      agent_id: 'pmm-agent-f5c8d3',
    },
  },
];

// ── Available checks catalogue ────────────────────────────────────────────

const cfg001 = `def check_cpu(metrics):
    """wireframe — sustained CPU over threshold (Starlark)"""
    pct = metrics.get("host_cpu_percent", 0)
    window_ok = metrics.get("cpu_window_samples", 0) >= 12
    if pct > 85 and window_ok:
        return fail("CPU " + str(pct) + "% exceeds 85% in 300s window")
    return ok()
`;

const cfg002 = `def check_collscan(metrics):
    """wireframe — MongoDB COLLSCAN / missing index hints (Starlark)"""
    ratio = metrics.get("docs_examined_to_returned_ratio", 0)
    if ratio > 1000:
        return fail("collscan ratio " + str(ratio) + " on hot collection")
    return ok()
`;

const cfg003 = `def check_autovacuum(metrics):
    """wireframe — autovacuum / bloat (Starlark)"""
    bloat = metrics.get("table_bloat_estimate_mb", 0)
    age_h = metrics.get("last_vacuum_age_hours", 0)
    dead = metrics.get("dead_tuples", 0)
    if bloat > 512 or age_h > 24:
        return fail("bloat_mb=" + str(bloat) + " vacuum_age_h=" + str(age_h) + " dead=" + str(dead))
    return ok()
`;

const cfg004 = `def check_connection_pool(metrics):
    """wireframe — MySQL connections vs max (Starlark)"""
    used = metrics.get("threads_connected", 0)
    cap = metrics.get("max_connections", 1)
    ratio = float(used) / float(cap)
    if ratio > 0.85:
        return fail("pool " + str(used) + "/" + str(cap) + " (" + str(int(ratio * 100)) + "%)")
    return ok()
`;

const cfg005 = `def check_replication_lag(metrics):
    """wireframe — replica lag bytes / seconds (Starlark)"""
    lag_b = metrics.get("replication_lag_bytes", 0)
    lag_s = metrics.get("replication_lag_seconds", 0)
    if lag_b > 33554432 or lag_s > 120:
        return fail("lag_bytes=" + str(lag_b) + " lag_s=" + str(lag_s))
    return ok()
`;

const cfg006 = `def check_disk_forecast(metrics):
    """wireframe — linear trend on recv bytes (Starlark)"""
    slope = metrics.get("bytes_received_slope_1h", 0)
    horizon = 7 * 24 * 3600
    if slope * horizon > metrics.get("disk_headroom_bytes", 1 << 62):
        return fail("projected fill within 7d at current slope")
    return ok()
`;

const cfg007 = `def check_slow_ops(metrics):
    """wireframe — slow Mongo operations (Starlark)"""
    p99_ms = metrics.get("slow_op_p99_ms", 0)
    if p99_ms > 500:
        return fail("p99 slow op " + str(p99_ms) + "ms")
    return ok()
`;

const cfg008 = `def check_binlog_retention(metrics):
    """wireframe — binlog hours / disk cap (Starlark)"""
    hours = metrics.get("binlog_retention_hours", 0)
    pct = metrics.get("binlog_disk_percent", 0)
    if hours < 24 or pct > 15:
        return fail("retention_h=" + str(hours) + " disk_pct=" + str(pct))
    return ok()
`;

export const availableChecks: AvailableCheck[] = [
  {
    id: 'avchk-001',
    name: 'CPU Utilization Exceeds Threshold',
    summary: 'Sustained CPU over threshold',
    description: 'Alerts when CPU usage stays above a configurable threshold for a sustained period.',
    databaseType: 'postgresql',
    category: 'Performance',
    enabled: true,
    interval: '60s',
    advisor: 'Performance Advisor',
    configurationKind: 'starlark',
    configuration: cfg001,
    defaultConfiguration: cfg001,
  },
  {
    id: 'avchk-002',
    name: 'Missing Index Detection',
    summary: 'Detect missing indexes via slow-query logs',
    description: 'Scans slow-query logs for collection scans that could be resolved by an index.',
    databaseType: 'mongodb',
    category: 'Schema',
    enabled: true,
    interval: '300s',
    advisor: 'Schema Advisor',
    configurationKind: 'starlark',
    configuration: cfg002,
    defaultConfiguration: cfg002,
  },
  {
    id: 'avchk-003',
    name: 'Autovacuum Health',
    summary: 'Autovacuum running within expected intervals',
    description: 'Verifies autovacuum is running within expected intervals for all tracked tables.',
    databaseType: 'postgresql',
    category: 'Maintenance',
    enabled: true,
    interval: '3600s',
    advisor: 'Maintenance Advisor',
    configurationKind: 'starlark',
    configuration: cfg003,
    defaultConfiguration: cfg003,
  },
  {
    id: 'avchk-004',
    name: 'Connection Pool Saturation',
    summary: 'Connection count nearing max_connections',
    description: 'Monitors active connections against max_connections and alerts before exhaustion.',
    databaseType: 'mysql',
    category: 'Connectivity',
    enabled: true,
    interval: '30s',
    advisor: 'Connectivity Advisor',
    configurationKind: 'starlark',
    configuration: cfg004,
    defaultConfiguration: cfg004,
  },
  {
    id: 'avchk-005',
    name: 'Replication Lag',
    summary: 'Replica lag exceeds threshold',
    description: 'Checks replica lag and alerts when it exceeds the configured threshold.',
    databaseType: 'postgresql',
    category: 'Replication',
    enabled: false,
    interval: '60s',
    advisor: 'Replication Advisor',
    configurationKind: 'starlark',
    configuration: cfg005,
    defaultConfiguration: cfg005,
  },
  {
    id: 'avchk-006',
    name: 'Disk Space Forecast',
    summary: 'Projected disk fill within 7 days',
    description: 'Projects disk usage trend and warns when storage will be exhausted within 7 days.',
    databaseType: 'mysql',
    category: 'Resources',
    enabled: false,
    interval: '3600s',
    advisor: 'Resource Advisor',
    configurationKind: 'starlark',
    configuration: cfg006,
    defaultConfiguration: cfg006,
  },
  {
    id: 'avchk-007',
    name: 'Slow Query Detection',
    summary: 'Queries exceed slow-query threshold',
    description: 'Flags queries exceeding the slow-query threshold configured per instance.',
    databaseType: 'mongodb',
    category: 'Performance',
    enabled: false,
    interval: '120s',
    advisor: 'Performance Advisor',
    configurationKind: 'starlark',
    configuration: cfg007,
    defaultConfiguration: cfg007,
  },
  {
    id: 'avchk-008',
    name: 'Binary Log Retention',
    summary: 'Binlog retention within configured window',
    description: 'Ensures binary logs are rotated within the configured retention window.',
    databaseType: 'mysql',
    category: 'Maintenance',
    enabled: false,
    interval: '86400s',
    advisor: 'Maintenance Advisor',
    configurationKind: 'starlark',
    configuration: cfg008,
    defaultConfiguration: cfg008,
  },
];

export interface FleetSummary {
  totalActive: number;
  passing: number;
  critical: number;
  warning: number;
  notice: number;
}

export function getFleetSummary(): FleetSummary {
  const critical = failedChecks.filter((c) => c.severity === 'critical').length;
  const warning = failedChecks.filter((c) => c.severity === 'warning').length;
  const notice = failedChecks.filter((c) => c.severity === 'notice').length;
  const totalActive = 47;
  return { totalActive, passing: totalActive - critical - warning - notice, critical, warning, notice };
}

export function getScenarioChecks(): CheckResult[] {
  return failedChecks;
}
