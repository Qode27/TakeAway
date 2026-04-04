import { Platform } from "@order-hub/shared";

export type ParsedEmail = {
  platform: Platform;
  payload: Record<string, unknown>;
};

function cleanCurrency(value: string) {
  return Number(value.replace(/[^\d.]/g, ""));
}

export function identifyPlatform(subject: string, body: string): Platform | null {
  const haystack = `${subject} ${body}`.toLowerCase();
  if (haystack.includes("deliveroo")) return "deliveroo";
  if (haystack.includes("just eat") || haystack.includes("justeat")) return "just_eat";
  return null;
}

export function parseDeliverooEmail(subject: string, body: string): ParsedEmail {
  const orderReference =
    /Order\s+#?([A-Z0-9-]+)/i.exec(subject)?.[1] ??
    /Order reference:\s*([A-Z0-9-]+)/i.exec(body)?.[1];
  const customerName = /Customer:\s*(.+)/i.exec(body)?.[1]?.trim();
  const serviceType = /Service:\s*(Delivery|Pickup)/i.exec(body)?.[1]?.toLowerCase() ?? "delivery";
  const placedAt = /Placed at:\s*(.+)/i.exec(body)?.[1]?.trim() ?? new Date().toISOString();
  const total = cleanCurrency(/Total:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const subtotal = cleanCurrency(/Subtotal:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? `${total}`);
  const vat = cleanCurrency(/VAT:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const deliveryFee = cleanCurrency(/Delivery fee:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const serviceFee = cleanCurrency(/Service fee:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const restaurantId = /Restaurant ID:\s*([A-Z0-9-]+)/i.exec(body)?.[1] ?? "deliveroo-email-store";
  const deliveryAddress = /Address:\s*(.+)/i.exec(body)?.[1]?.trim();

  const lines = [...body.matchAll(/- ([^\n]+) x(\d+) €([0-9.]+)(?: \(([^)]+)\))?/g)].map((match) => ({
    name: match[1].trim(),
    qty: Number(match[2]),
    unitPrice: Number(match[3]),
    modifiers: match[4] ? match[4].split(",").map((value) => value.trim()) : []
  }));

  return {
    platform: "deliveroo",
    payload: {
      orderReference: orderReference ?? `DROO-${Date.now()}`,
      restaurantId,
      placedAt: new Date(placedAt).toISOString(),
      customerName,
      serviceType,
      deliveryAddress,
      lines,
      pricing: { subtotal, vat, deliveryFee, serviceFee, total },
      paymentStatus: "paid"
    }
  };
}

export function parseJustEatEmail(subject: string, body: string): ParsedEmail {
  const id =
    /Order\s+#?([A-Z0-9-]+)/i.exec(subject)?.[1] ??
    /Order ID:\s*([A-Z0-9-]+)/i.exec(body)?.[1];
  const vendorId = /Vendor ID:\s*([A-Z0-9-]+)/i.exec(body)?.[1] ?? "justeat-email-store";
  const submittedAt = /Time:\s*(.+)/i.exec(body)?.[1]?.trim() ?? new Date().toISOString();
  const customerName = /Customer:\s*(.+)/i.exec(body)?.[1]?.trim();
  const phone = /Phone:\s*(.+)/i.exec(body)?.[1]?.trim();
  const address = /Address:\s*(.+)/i.exec(body)?.[1]?.trim();
  const kind = /Fulfilment:\s*(Delivery|Pickup)/i.exec(body)?.[1]?.toLowerCase() ?? "delivery";
  const note = /Notes:\s*(.+)/i.exec(body)?.[1]?.trim();
  const total = cleanCurrency(/Total:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const subtotal = cleanCurrency(/Subtotal:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? `${total}`);
  const tax = cleanCurrency(/Tax:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const delivery = cleanCurrency(/Delivery fee:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const service = cleanCurrency(/Service fee:\s*€?([0-9.]+)/i.exec(body)?.[1] ?? "0");
  const basket = [...body.matchAll(/- ([^\n]+) x(\d+) €([0-9.]+)(?: \(([^)]+)\))?/g)].map((match) => ({
    title: match[1].trim(),
    quantity: Number(match[2]),
    amount: Number(match[3]),
    options: match[4] ? match[4].split(",").map((label) => ({ label: label.trim() })) : []
  }));

  return {
    platform: "just_eat",
    payload: {
      id: id ?? `JE-${Date.now()}`,
      vendorId,
      submittedAt: new Date(submittedAt).toISOString(),
      customer: { fullName: customerName, phone, address },
      fulfillment: { kind, notes: note },
      basket,
      pricing: {
        subtotal,
        tax,
        fees: { delivery, service },
        total
      },
      paymentStatus: "paid"
    }
  };
}

export function parseEmail(subject: string, body: string): ParsedEmail {
  const platform = identifyPlatform(subject, body);
  if (platform === "deliveroo") return parseDeliverooEmail(subject, body);
  if (platform === "just_eat") return parseJustEatEmail(subject, body);
  throw new Error("Unable to identify email platform");
}
