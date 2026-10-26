export function subscriptionCodeRejection(message: string | null) {
  if (!message) return null;
  if (/first[- ]time subscribers?/i.test(message)) return {
    title: "This code is for new subscribers",
    allowAnotherCode: false,
    description: "You’ve subscribed before, so this first-subscription code can’t be used on this account.",
  };
  if (/minimum product value/i.test(message)) return {
    title: "Minimum product spend not met",
    allowAnotherCode: true,
    description: `${message} Delivery fees do not count towards this minimum.`,
  };
  if (/subscription discount code|subscription discount changed/i.test(message)) return {
    title: "This code couldn’t be applied",
    allowAnotherCode: true,
    description: message,
  };
  return null;
}

