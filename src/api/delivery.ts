import api from "@/api/client";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export type DeliveryPostcodeCheckResult = {
  deliverable: boolean;
  message?: string;
  raw: unknown;
};

function extractBooleanDeep(value: unknown, keys: string[]): boolean | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (typeof record[key] === "boolean") return record[key] as boolean;
  }

  if (record.data) return extractBooleanDeep(record.data, keys);
  return undefined;
}

export async function checkDeliveryPostcode(
  postcode: string,
): Promise<DeliveryPostcodeCheckResult> {
  const trimmed = postcode.trim();

  const res = await api.post<ApiEnvelope<unknown> | unknown>(
    "/delivery/check",
    {
      postcode: trimmed,
    },
  );

  const envelope = res as ApiEnvelope<unknown>;
  const raw = res;

  const deliverableKeys = [
    "isDeliverable",
    "deliverable",
    "canDeliver",
    "isInDeliveryArea",
    "inDeliveryArea",
    "isAvailable",
    "available",
    "isEligible",
    "eligible",
    "isValid",
    "valid",
  ];

  const deliverable =
    extractBooleanDeep(envelope?.data ?? res, deliverableKeys) ??
    // If the API uses an envelope and reports success, treat it as deliverable.
    (typeof envelope?.success === "boolean" ? envelope.success : true);

  const message =
    typeof envelope?.message === "string" && envelope.message.trim()
      ? envelope.message.trim()
      : undefined;

  return { deliverable, message, raw };
}
