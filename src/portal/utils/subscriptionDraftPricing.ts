export const deliveryFeesForDraft = (dayProductTotals: number[], feePerDelivery: number) =>
  dayProductTotals.reduce((sum, products) => sum + (products > 0 ? feePerDelivery : 0), 0);
