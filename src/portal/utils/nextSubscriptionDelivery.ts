import type {
  PortalSubscription,
  PortalSubscriptionDelivery,
} from "@/api/portalSubscriptions";

export const getNextSubscriptionDeliveryDate = (
  subscription: PortalSubscription,
) => {
  if (subscription.status === "cancelled") return null;
  // An explicit null means the server found no outstanding delivery. Only
  // older responses without this field may fall back to the billing date.
  return subscription.upcomingDeliveryDate !== undefined
    ? subscription.upcomingDeliveryDate
    : subscription.nextDeliveryDate;
};

export const getNextSubscriptionDelivery = (
  subscription: PortalSubscription | null,
  deliveries: PortalSubscriptionDelivery[],
) => {
  if (!subscription) return null;
  const nextDate = getNextSubscriptionDeliveryDate(subscription);
  if (!nextDate) return null;
  return (
    deliveries.find(
      (delivery) =>
        ["scheduled", "generated"].includes(delivery.status) &&
        delivery.scheduledDate.slice(0, 10) === nextDate.slice(0, 10),
    ) || null
  );
};
