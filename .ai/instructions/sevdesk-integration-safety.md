---
type: instruction
description: Governs integration safety; load for transport, data, retry, or remote-state work.
scope: repository
---

# sevdesk integration safety

## Scope and activation condition

This Instruction must be loaded when work touches client construction, authentication, transport,
custom requests, request options, results, errors, logging, retries, uploads, document state
changes, curated workflows, recovery, or live sevdesk tests. It must also be loaded when application
examples could cause a remote write. [Taxation](taxation.md) must also be loaded for tax-bearing
operations, [SDK development](sdk-development.md) for operation selection or public contracts, and
[quality and testing](quality-testing.md) for validation and live-test isolation.

## Mandatory rules

### Transport and credentials

- The client must use HTTPS. `allowInsecureLocalhost: true` may permit HTTP only for an explicit
  localhost or loopback development server.
- Authentication must remain confined to the configured origin and API prefix. Custom paths must
  begin with exactly one `/`; absolute and protocol-relative URLs must be rejected before token
  resolution.
- API tokens must not enter source, fixtures, logs, diagnostics, examples, checkpoints, or error
  text. Token providers are resolved for each attempt and may therefore rotate credentials.
- Generated-operation selection and `client.request()` eligibility must follow
  [SDK development](sdk-development.md). A custom request's path, types, and safety classification
  must remain explicit.
- Per-call cancellation, timeout, resource version, headers, retry override, and safe Axios settings
  must pass through the final `CuratedRequestOptions` argument. Workflows must propagate the safe
  options to every step.
- A caller-owned Axios instance may outlive the client only after `client.dispose()` ejects the SDK
  interceptors. A disposed client must not be reused.

### Sensitive results, errors, and logging

- `result.data`, `result.objects`, `result.json`, error response data, workflow partials,
  `toSummary()`, and serialized finalization checkpoints must be treated as sensitive business
  data. The credential-safe `result.raw` and error response snapshots remove request objects and
  credential headers; they do not make response content privacy-safe.
- Logging must remain metadata-only unless detailed logging is explicitly required. `bodyMode`,
  `headersMode`, and `queryMode` may be enabled as `"redacted"` independently; a tenant-aware
  redactor must be provided before customer or accounting data can reach a sink. Built-in
  credential redaction is best effort, not a business-data policy.
- `error.toJSON()` must be used for ordinary metadata logging.
  `error.toDiagnostic({ includeData: true })` may be used only after a protected, redacted sink is
  approved. An error object must not be passed directly to an arbitrary logger.
- Logger and redactor failures must remain isolated from request behavior. sevdesk rate-limit values
  must not be invented; only headers actually observed from the tenant may be reported.

### Retries and mutations

- Sending, marking sent, booking, cancelling, enshrining, rendering, resetting, uploading,
  deletion, layout writes, and any PDF operation that commits or changes send state must be treated
  as writes.
  User intent and every required confirmation must be visible at the call site.
- Only operations classified as safe reads may retry automatically. Cancelled requests must not be
  retried. `retrySafe: true` on `client.request()` and unsafe retry overrides may be used only after
  the application proves replay is safe and owns idempotency or reconciliation.
- `unsafeOperations` can enable retries for direct one-operation calls, but every curated workflow
  write must force `retry: false`. sevdesk provides no SDK-managed idempotency key.
- On a newly created draft, finalization must include delivery or booking; `enshrine: true` may
  follow only one of those actions. Factory save semantics are owned by
  [SDK development](sdk-development.md).
- Root contact mutations must use `contacts.update()` or `contacts.delete({ confirm: true })`.
  Curated invoice/order updates and deletes must remain draft-only, with deletion requiring
  `{ confirm: true }`. Reset-to-open must require `{ confirmUnlinkTransactions: true }`.

### Workflow evidence and recovery

- Workflows are ordered remote calls, not transactions. A failed workflow must not be retried as a
  unit. `SevdeskWorkflowError` must be caught separately, and `failedOperationId`, `completedSteps`,
  `partial`, `compensation`, and `cause` must be inspected before recovery is chosen.
- `steps`, `json`, and `raw` contain one entry per successfully executed step.
  `step.operationId` must be narrowed before its correlated values are used. When a write may return
  no `objects`, its
  required `WorkflowActionReceipt` must be used; `undefined` is not proof that the action did not
  run.
- A workflow's business aggregate must be read from `result.data`; for full contact creation it is
  `result.data.contact`. The workflow/input type must be treated as the authority for required
  aggregate fields and operation IDs.
- Best-effort contact compensation is evidence, not rollback. With explicit
  `rollback: "best-effort"`, a failure before accounting-contact creation is attempted may trigger
  reverse cleanup. After that write is attempted, cleanup may occur only after a definite non-408
  HTTP 4xx rejection; an ambiguous timeout, network, or server failure must preserve remote state
  for reconciliation.
- For interrupted invoice finalization, the initial value must be created with
  `createInvoiceFinalizationCheckpoint()`. The exact invoice, plan, explicit `completedSteps`
  (`[]` means no write started), and any inconclusive `uncertainStep` must be persisted. The
  fingerprint binds history; it is not encryption or an untrusted-input signature.
- Reconciliation must use read-only `reconcileFinalization()`. When guarded continuation through
  `resumeFinalization()` is appropriate, the cumulative `result.data.checkpoint` must be passed to
  it. Workflow `steps` must not be substituted, and a checkpoint must not be edited, changed to
  another invoice/plan, cleared of uncertainty, or used to replay an uncertain write.
- The latest checkpoint returned by every reconciliation, resume result, or
  `InvoiceFinalizationFailurePartial` must be persisted. Exported helpers must serialize and parse
  it; the stored plan must be protected because it can include recipients, text, amounts, and
  transaction references.
- Resume completion must be based on the final server probe, not write responses. Default probes
  may make up to three GET attempts at 5,000 ms intervals and stop early when conclusive; these are
  observations, not write retries.
- One application-level writer or distributed lock per invoice must cover reconciliation, resume,
  and checkpoint persistence. A checkpoint is not a lease and cannot serialize concurrent workers
  or external sevdesk mutations.

### Resource-specific guardrails

- Contact upsert must match the exact customer number across all pages, fail on ambiguity, and make
  merge-only root changes. It must not change that identity, use a custom field as identity, apply
  `create` children to an existing contact, or replace/delete unmentioned children.
- Contact child updates/removals must verify child ID, object type, and owning contact first.
  Removal requires `{ confirm: true }`; synchronize only application-owned child IDs.
- Application dunning logic should call `reminders.checkEligibility()` first and treat
  `data.eligible: false` as an expected business result. `reminders.create()` must repeat the
  read-only checks, require explicit delivery to send, refuse a new reminder while the prior one
  remains draft, and must not invent a missing prior-reminder deadline. A successful create exposes
  its check under `result.data.eligibility`.
- Layout code must list tenant templates and letterpapers before selecting IDs. Input must be
  non-empty; each field is a separate non-retryable write. Successful evidence must be read from
  `result.data.applied`, and partial evidence must be read from a workflow error.
- Invoice and credit-note `getPdf()` must preserve the safe send-state default unless
  `markAsDownloaded` expresses an intended write. Order `getPdf()` requires
  `{ confirmCommit: true }`. Invoice `render()` is a write, not a read helper.

### Live safety

- Live tests require explicit user intent and a dedicated disposable tenant. `test:live:write` must
  not run without every documented confirmation guard and tenant reference.
- The live write suite may leave state after permission or ambiguous-network failures. Its unique
  marker must be reconciled in the sevdesk UI after every run. The stronger voucher opt-in
  intentionally leaves a marked draft for manual deletion.

## Architecture and dependency boundaries

- `src/client/axios-transport.ts` owns URL validation, authentication, retry execution, logging,
  and result/error normalization. Generated operations receive retry metadata from
  `src/client/operation-catalog.ts`.
- `src/bundles/**` composes generated raw operations and records workflow evidence. Curated
  workflows must not bypass the shared transport or weaken its write-retry policy.
- The application owns business authorization, tenant selection, idempotency decisions,
  single-writer locks, durable checkpoint storage, domain redaction, and resolution of ambiguous
  external state. The SDK must not pretend to provide those controls.
- Application code should consume the normalized aggregate from `result.data` while retaining
  wire-shaped `objects`, `json`, and `raw` only when exact transport evidence is needed.

## Compatibility requirements

- The distinction between safe reads, state-sensitive reads, and writes must be preserved when
  operation metadata or curated wrappers change. A method named like a read is not safe if sevdesk
  documents a state transition.
- Credential-safe response/error snapshots, the normalized error hierarchy, explicit confirmation
  types, workflow step correlation, partial evidence, and action receipts must be preserved as
  public contracts.
- Curated workflows may accept the ordinary per-call retry shape for their reads, but no client or
  request-level unsafe option may make their write steps retryable.

## Sources of truth and canonical patterns

- This Instruction owns the credential and disclosure boundary.
- Canonical implementations are `src/client/axios-transport.ts`, `src/utils/logging.ts`,
  `src/bundles/workflow.ts`, `src/bundles/invoice-finalization.ts`, `src/bundles/contacts.ts`,
  `src/bundles/reminders.ts`, `src/bundles/layout.ts`, and `src/bundles/document-output.ts`.
- Live-test guards are encoded in `test/read-only.live.ts` and `test/write.live.ts`.

## Prohibited patterns

- Credentials and unrestricted business JSON must not be placed in logs, fixtures, exceptions, or
  checkpoints written to ordinary telemetry.
- Credential redaction must not be treated as personal/accounting-data redaction.
- Callers must not use an absolute custom URL, weaken HTTPS for a remote host, or keep SDK
  interceptors on a released shared Axios instance.
- Changes must not mark a request retry-safe based only on HTTP method or enable workflow write
  retries.
- Recovery code must not infer that a timed-out write failed, replay an uncertain write, or assume
  compensation restored prior state.
- Callers must not bypass confirmation flags with casts/wrappers or turn contact synchronization
  into replace-all behavior.

## Relevant commands

- `npm test -- test/transport.test.ts test/logging.test.ts`
- `npm test -- test/workflows.test.ts test/invoice-finalization.test.ts`
- `npm test -- test/contact-sync.test.ts test/reminders.test.ts`
- `npm test -- test/layout-workflow.test.ts test/document-output.test.ts`
- `npm run typecheck`
- `npm run typecheck:examples` when public usage changes
- `npm run check` for cross-cutting or public-contract changes
- `npm run test:live:read` or `npm run test:live:write` only under the documented explicit live
  guards

## Validation requirements

- Transport changes must prove URL/prefix rejection occurs before token resolution, credentials
  are absent from public snapshots and diagnostics, safe retry counts are exact, cancellation is
  not retried, and disposal ejects interceptors.
- Logging changes must prove every detail mode is independent, redaction runs, sink/redactor
  failures are isolated, and workflow logging remains metadata-only.
- Every workflow change must test exact operation order and payloads, successful aggregate/step
  evidence, failure after a successful write, partial/compensation data, disabled write retries,
  and absence of an extra save call.
- State-changing resource work must test the relevant status precondition and confirmation, plus an
  ambiguous-failure path. Finalization work must additionally test checkpoint validation,
  uncertain-write non-replay, final probing, cancellation/deadlines, serialization, and concurrent
  writer assumptions.
- Live validation must remain opt-in and must not be presented as proof that all tenants,
  permissions, or undocumented endpoints behave identically.
