import { parseEmail } from "@/services/adapters/email/email-parsers.js";
import { parsedMailToJson } from "@/services/adapters/email/mail-utils.js";
import { DeliverooAdapter } from "@/services/adapters/platforms/deliveroo.adapter.js";
import { JustEatAdapter } from "@/services/adapters/platforms/just-eat.adapter.js";

const deliverooAdapter = new DeliverooAdapter();
const justEatAdapter = new JustEatAdapter();

export async function normalizeEmailOrder(rawEmail: string) {
  const email = await parsedMailToJson(rawEmail);
  const parsed = parseEmail(email.subject, email.text);

  if (parsed.platform === "deliveroo") {
    return deliverooAdapter.normalize({
      payload: parsed.payload,
      platformStoreId: String((parsed.payload as { restaurantId?: string }).restaurantId ?? "deliveroo-email-store"),
      ingestionSource: "email"
    });
  }

  return justEatAdapter.normalize({
    payload: parsed.payload,
    platformStoreId: String((parsed.payload as { vendorId?: string }).vendorId ?? "justeat-email-store"),
    ingestionSource: "email"
  });
}
