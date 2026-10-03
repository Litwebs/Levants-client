import type { PortalSubscriptionCutoff } from "@/api/portalSubscriptions";

export const parseCutoffInstant = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isPastCutoffInstant = (
  value?: string | null,
  fallback = false,
) => {
  const date = parseCutoffInstant(value);
  return date ? Date.now() >= date.getTime() : fallback;
};

export const getDeliveryDayCutoff = (
  cutoff: PortalSubscriptionCutoff | null | undefined,
  day: number,
) =>
  cutoff?.deliveryDayCutoffs?.find(
    (candidate) => Number(candidate.day) === Number(day),
  ) || null;

export const formatCutoffDate = (
  value?: string | null,
  timeZone?: string,
) => {
  const date = parseCutoffInstant(value);
  if (!date) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
};
