import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import SubscriptionIntroOfferSummary, { type SubscriptionPricingQuote } from "@/portal/components/SubscriptionIntroOfferSummary";
afterEach(cleanup);
const quote: SubscriptionPricingQuote = { productsMinor:2000,deliveryMinor:100,discountMinor:200,firstChargeMinor:1900,renewalMinor:2100,percentOff:10,eligible:true,quoteToken:"a".repeat(64),nextPaymentDate:"2026-11-01T12:00:00Z",firstDeliveryDate:"2026-11-01T00:00:00Z" };
test("explains the first payment, products-only saving and full-price renewal",()=>{
  render(<SubscriptionIntroOfferSummary quote={quote}/>);
  expect(screen.getByText(/10% off products on your first/)).toBeTruthy();
  expect(screen.getByText(/Products before discount: £20.00. You save £2.00/)).toBeTruthy();
  expect(screen.getByText(/First payment: £19.00/)).toBeTruthy();
  expect(screen.getByText(/Normal recurring payment: £21.00/)).toBeTruthy();
  expect(screen.getByText(/Delivery: £1.00. Delivery is not discounted/)).toBeTruthy();
});
test("ineligible customers see the normal amounts without an introductory claim",()=>{
  render(<SubscriptionIntroOfferSummary quote={{...quote,eligible:false,percentOff:0,discountMinor:0,firstChargeMinor:2100}}/>);
  expect(screen.queryByText(/off products/)).toBeNull();expect(screen.getByText(/First payment: £21.00/)).toBeTruthy();
});
