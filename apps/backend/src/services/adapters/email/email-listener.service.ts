import { ImapFlow } from "imapflow";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";
import { ingestEmail } from "@/services/ingestion.service.js";

export async function pollInboxOnce() {
  if (!env.EMAIL_FALLBACK_ENABLED || !env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD) {
    return;
  }

  const client = new ImapFlow({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_TLS,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD
    }
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");
    for await (const message of client.fetch("1:*", { source: true, envelope: true })) {
      const raw = message.source?.toString("utf8");
      if (!raw) continue;
      await ingestEmail(raw);
    }
  } catch (error) {
    logger.error({ error }, "Email listener poll failed");
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export function startEmailPolling() {
  if (!env.EMAIL_FALLBACK_ENABLED || !env.ENABLE_EMAIL_POLLING) return;
  return setInterval(() => {
    void pollInboxOnce();
  }, env.EMAIL_POLL_INTERVAL_MS);
}
