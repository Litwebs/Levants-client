type SubscriptionEditingState = { status?: string; isCancellationScheduled?: boolean } | null | undefined;

export const canModifySubscription = (subscription: SubscriptionEditingState): boolean =>
  subscription?.status === "active" && subscription.isCancellationScheduled !== true;
