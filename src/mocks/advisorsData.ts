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

/** wireframe: whether the editor treats payload as YAML check definition vs PromQL */
export type CheckConfigurationKind = 'yaml' | 'promql';

export interface AvailableCheck {
  id: string;
  name: string;
  description: string;
  databaseType: DatabaseType;
  category: string;
  enabled: boolean;
  interval: string;
  advisor: string;
  /** wireframe: editable check definition (YAML or PromQL) */
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

const cfg001 = `# wireframe — CPU utilization (YAML)
check:
  id: cpu_utilization_sustained
  title: CPU Utilization Exceeds Threshold
threshold:
  metric: host_cpu_percent
  operator: gt
  value: 85
window:
  duration_seconds: 300
  min_samples: 12
targets:
  include_tags: [env:production, role:primary]
notifications:
  severity: warning
`;

const cfg002 = `# wireframe — index hints (YAML)
check:
  id: mongo_collscan_ratio
  title: Missing Index Detection
query:
  source: advisor_slow_queries
  condition:
    docs_examined_to_returned_ratio: gt 1000
schedule:
  align_to: wall_clock
window_minutes: 15
`;

const cfg003 = `# wireframe — autovacuum (YAML)
check:
  id: pg_autovacuum_lag
  title: Autovacuum Health
rules:
  - table_bloat_estimate_mb: gt 512
  - last_autovacuum_age_hours: gt 24
scope:
  schemas: [public, analytics]
ignore_tables: [staging_tmp_*]
`;

const cfg004 = `(
  mysql_global_status_threads_connected
  /
  mysql_global_variables_max_connections
) > 0.85`;

const cfg005 = `# wireframe — replication (YAML)
check:
  id: pg_replica_lag_bytes
  title: Replication Lag
threshold:
  lag_bytes: gt 33554432
  lag_seconds: gt 120
replicas:
  match_label: replica_of=primary-prod-01
`;

const cfg006 = `predict_linear(
  mysql_global_status_bytes_received[1h],
  7 * 24 * 3600
) + mysql_global_status_bytes_sent offset 1w > mysql_slave_status_slave_sql_running`;

const cfg007 = `# wireframe — slow ops (YAML)
check:
  id: mongo_slow_operation_ms
  title: Slow Query Detection
threshold_ms: 500
aggregation:
  op_types: [find, aggregate, getmore]
exclude_ns: [config.*, local.*]
`;

const cfg008 = `# wireframe — binlog retention (YAML)
check:
  id: mysql_binlog_retention_hours
  title: Binary Log Retention
expect:
  min_retention_hours: 24
  max_disk_usage_percent: 15
paths:
  - /var/lib/mysql/binlog
`;

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
    configurationKind: 'yaml',
    configuration: cfg001,
    defaultConfiguration: cfg001,
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
    configurationKind: 'yaml',
    configuration: cfg002,
    defaultConfiguration: cfg002,
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
    configurationKind: 'yaml',
    configuration: cfg003,
    defaultConfiguration: cfg003,
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
    configurationKind: 'promql',
    configuration: cfg004,
    defaultConfiguration: cfg004,
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
    configurationKind: 'yaml',
    configuration: cfg005,
    defaultConfiguration: cfg005,
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
    configurationKind: 'promql',
    configuration: cfg006,
    defaultConfiguration: cfg006,
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
    configurationKind: 'yaml',
    configuration: cfg007,
    defaultConfiguration: cfg007,
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
    configurationKind: 'yaml',
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
