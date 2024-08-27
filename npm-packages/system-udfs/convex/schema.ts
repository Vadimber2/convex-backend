import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import deploymentAuditLogTable, {
  deploymentState,
} from "./tableDefs/deploymentAuditLogTable";
import { snapshotImportsTable } from "./tableDefs/snapshotImport";

// This file isn't autogenerated, it must be manually synced with system tables.

export const udfType = v.union(
  v.literal("Query"),
  v.literal("Mutation"),
  v.literal("Action"),
  v.literal("HttpAction"),
);

const schemaState = v.union(
  v.literal("pending"),
  v.literal("validated"),
  v.literal("active"),
  v.literal("failed"),
  v.literal("overwritten"),
);

const schemaMetadata = v.object({
  state: v.object({ state: schemaState, error: v.optional(v.string()) }),
  // This is a string because the rust code serializes the DatabaseSchema structure to a string.
  schema: v.optional(v.string()),
});

export const udfVisibility = v.union(
  v.object({ kind: v.literal("public") }),
  v.object({ kind: v.literal("internal") }),
);

const analyzedSourcePosition = v.object({
  path: v.string(),
  start_lineno: v.int64(),
  start_col: v.int64(),
});

const analyzedFunction = v.object({
  name: v.string(),
  // Exactly one of these two will be defined
  lineno: v.optional(v.int64()),
  pos: v.optional(analyzedSourcePosition),
  udfType,
  visibility: v.optional(v.union(v.null(), udfVisibility)),
  args: v.optional(v.string()),
  returns: v.union(v.string(), v.null()),
});

const analyzedHttpRoute = v.object({
  route: v.object({
    path: v.string(),
    method: v.string(),
  }),
  // Exactly one of the two will be defined
  lineno: v.optional(v.int64()),
  pos: v.optional(analyzedSourcePosition),
});

const CronSchedule = v.union(
  v.object({
    type: v.literal("interval"),
    seconds: v.int64(),
  }),
  v.object({
    type: v.literal("hourly"),
    minuteUTC: v.int64(),
  }),
  v.object({
    type: v.literal("daily"),
    minuteUTC: v.int64(),
    hourUTC: v.int64(),
  }),
  v.object({
    type: v.literal("weekly"),
    dayOfWeek: v.int64(),
    hourUTC: v.int64(),
    minuteUTC: v.int64(),
  }),
  v.object({
    type: v.literal("monthly"),
    day: v.int64(),
    minuteUTC: v.int64(),
    hourUTC: v.int64(),
  }),
  v.object({
    type: v.literal("cron"),
    cronExpr: v.string(),
  }),
);

const analyzedCronSpec = v.object({
  udfPath: v.string(),
  udfArgs: v.bytes(),
  cronSchedule: CronSchedule,
});

const mappedModule = v.object({
  sourceIndex: v.union(v.int64(), v.null()),
  functions: v.array(analyzedFunction),
  httpRoutes: v.union(v.array(analyzedHttpRoute), v.null()),
  cronSpecs: v.optional(
    v.union(
      v.array(
        v.object({
          identifier: v.string(),
          spec: analyzedCronSpec,
        }),
      ),
      v.null(),
    ),
  ),
});

const analyzedModule = v.object({
  functions: v.array(analyzedFunction),
  httpRoutes: v.union(v.array(analyzedHttpRoute), v.null()),
  cronSpecs: v.optional(
    v.union(
      v.array(
        v.object({
          identifier: v.string(),
          spec: analyzedCronSpec,
        }),
      ),
      v.null(),
    ),
  ),
  sourceMapped: v.union(mappedModule, v.null()),
});

export const completedExport = v.object({
  state: v.literal("completed"),
  complete_ts: v.int64(),
  expiration_ts: v.int64(),
  start_ts: v.int64(),
  tables: v.optional(v.array(v.array(v.string()))),
  zip_object_key: v.optional(v.string()),
  format: v.optional(
    v.union(
      v.literal("clean_jsonl"),
      v.literal("zip"),
      v.object({
        format: v.literal("zip"),
        include_storage: v.boolean(),
      }),
    ),
  ),
});

const cronJobStatus = v.union(
  v.object({
    type: v.literal("success"),
    result: v.any(),
  }),
  v.object({
    type: v.literal("err"),
    error: v.any(),
  }),
  v.object({
    type: v.literal("canceled"),
    num_canceled: v.int64(),
  }),
);

// Log sinks
export const sinkState = v.union(
  v.object({
    type: v.literal("pending"),
  }),
  v.object({
    type: v.literal("failed"),
    reason: v.string(),
  }),
  v.object({
    type: v.literal("active"),
  }),
  v.object({
    type: v.literal("deleting"),
  }),
);

export const datadogConfig = v.object({
  type: v.literal("datadog"),
  siteLocation: v.union(
    v.literal("US1"),
    v.literal("US3"),
    v.literal("US5"),
    v.literal("EU"),
    v.literal("US1_FED"),
    v.literal("AP1"),
  ),
  ddApiKey: v.string(),
  ddTags: v.array(v.string()),
  version: v.optional(v.union(v.literal("1"), v.literal("2"))),
});

export const webhookConfig = v.object({
  type: v.literal("webhook"),
  url: v.string(),
});

export const axiomConfig = v.object({
  type: v.literal("axiom"),
  apiKey: v.string(),
  datasetName: v.string(),
  attributes: v.array(
    v.object({
      key: v.string(),
      value: v.string(),
    }),
  ),
  version: v.optional(v.union(v.literal("1"), v.literal("2"))),
});

export const sentryConfig = v.object({
  type: v.literal("sentry"),
  dsn: v.string(),
});

export const sinkConfig = v.union(
  datadogConfig,
  webhookConfig,
  axiomConfig,
  sentryConfig,
);

const logSinksTable = defineTable({
  status: sinkState,
  config: sinkConfig,
});

const backendStateTable = defineTable({
  state: deploymentState,
});

export default defineSchema({
  _tables: defineTable({
    name: v.string(),
    state: v.union(
      v.literal("active"),
      v.literal("deleting"),
      v.literal("hidden"),
    ),
  }),
  _components: defineTable({
    definitionId: v.id("_component_definitions"),
    parent: v.union(v.id("_components"), v.null()),
    name: v.union(v.string(), v.null()),
    args: v.union(v.array(v.any()), v.null()),
    state: v.optional(v.union(v.literal("active"), v.literal("unmounted"))),
  }),
  _modules: defineTable({
    path: v.string(),
    latestVersion: v.int64(),
    deleted: v.boolean(),
    analyzeResult: v.union(analyzedModule, v.null()),
    sourcePackageId: v.string(),
  }).index("by_path", ["path"]),
  _auth: defineTable({
    applicationID: v.string(),
    domain: v.string(),
  }),
  _environment_variables: defineTable({
    name: v.string(),
    value: v.string(),
  }).index("by_name", ["name"]),
  _exports: defineTable(
    v.union(
      completedExport,
      v.object({
        // "failed" state is unused for new exports, because there are no
        // developer-error failure scenarios, so the export is retried until
        // success.
        state: v.literal("failed"),
        start_ts: v.int64(),
        failed_ts: v.int64(),
      }),
      v.object({
        state: v.literal("in_progress"),
        start_ts: v.int64(),
      }),
      v.object({
        state: v.literal("requested"),
      }),
    ),
  ),
  _deployment_audit_log: deploymentAuditLogTable,
  _scheduled_jobs: defineTable({
    nextTs: v.union(v.int64(), v.null()),
    udfPath: v.string(),
    state: v.union(
      v.object({ type: v.literal("pending") }),
      v.object({ type: v.literal("inProgress") }),
    ),
    udfArgs: v.bytes(),
    component: v.optional(v.string()),
  })
    .index("by_udf_path_and_next_event_ts", ["udfPath", "nextTs"])
    .index("by_next_ts", ["nextTs"]),
  _cron_jobs: defineTable({
    name: v.string(),
    cronSpec: analyzedCronSpec,
    state: v.union(
      v.object({ type: v.literal("pending") }),
      v.object({ type: v.literal("inProgress") }),
    ),
    nextTs: v.int64(),
    prevTs: v.union(v.int64(), v.null()),
  })
    .index("by_next_ts", ["nextTs"])
    .index("by_name", ["name"]),
  _cron_job_logs: defineTable({
    name: v.string(),
    ts: v.int64(),
    udfPath: v.string(),
    udfArgs: v.bytes(),
    status: cronJobStatus,
    logLines: v.object({
      logLines: v.array(v.string()),
      isTruncated: v.boolean(),
    }),
    executionTime: v.number(),
  }).index("by_name_and_ts", ["name", "ts"]),
  _udf_config: defineTable({ serverVersion: v.string() }),
  _schemas: defineTable(schemaMetadata).index("by_state", ["state"]),
  _log_sinks: logSinksTable,
  _backend_state: backendStateTable,
  _snapshot_imports: snapshotImportsTable,
});
