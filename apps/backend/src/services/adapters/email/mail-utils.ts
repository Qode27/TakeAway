import { simpleParser } from "mailparser";

export async function parsedMailToJson(rawEmail: string) {
  const parsed = await simpleParser(rawEmail);
  return {
    subject: parsed.subject ?? "",
    text: parsed.text ?? parsed.html?.toString() ?? "",
    from: parsed.from?.text ?? ""
  };
}
