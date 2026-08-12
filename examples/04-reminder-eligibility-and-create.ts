import { createSevdeskClient } from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });
const invoiceId = 42;

try {
  const check = await client.reminders.checkEligibility(invoiceId);
  if (!check.data.eligible) {
    console.log(check.data.reason, check.data.message);
  } else {
    console.log({
      outstanding: check.data.outstanding,
      dueAt: check.data.dueAt,
      overdueByDays: check.data.overdueByDays
    });
    if (process.env.SEVDESK_SEND_REMINDER === "I_UNDERSTAND_THIS_SENDS_EMAIL") {
      const sent = await client.reminders.create({
        invoiceId,
        delivery: {
          channel: "email",
          toEmail: "customer@example.test",
          subject: "Payment reminder",
          text: "Please find the payment reminder attached."
        }
      });
      console.log(sent.data.delivery);
    } else {
      const created = await client.reminders.create({ invoiceId });
      console.log(created.data.eligibility.overdueByDays);
      console.log(created.data.reminder);
    }
  }
} finally {
  client.dispose();
}
