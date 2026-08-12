import { createSevdeskClient, emitLog, type SevdeskLogEvent } from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const events: SevdeskLogEvent[] = [];

const client = createSevdeskClient({
  apiToken,
  logger: {
    log(event) {
      events.push(event);
    }
  },
  logging: {
    events: "all",
    level: "debug",
    bodyMode: "none",
    headersMode: "none",
    queryMode: "none",
    includeTimings: true,
    includeObservedRateLimits: true
  }
});

try {
  emitLog(client.logging, {
    type: "request",
    message: "listing invoices",
    operationId: "app.listInvoices"
  });
  const page = await client.raw.invoice.getInvoices({
    query: { limit: 1, offset: 0 }
  });
  console.log(
    "returned",
    page.pagination?.returned ?? (Array.isArray(page.data) ? page.data.length : 1)
  );
  const check = await client.reminders.checkEligibility(42);
  console.log("eligible", check.data.eligible);
  console.log(
    "event types",
    events.map((event) => event.type)
  );
  console.log("resolved", {
    enabled: client.logging.enabled,
    level: client.logging.level
  });
} finally {
  client.dispose();
}
