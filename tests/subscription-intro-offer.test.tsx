import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import SubscriptionIntroOfferSummary, { type SubscriptionPricingQuote } from "@/portal/components/SubscriptionIntroOfferSummary";
afterEach(cleanup);
const quote: SubscriptionPricingQuote = { productsMinor:2000,deliveryMinor:100,discountMinor:200,firstChargeMinor:1900,renewalMinor:2100,percentOff:10,eligible:true,quoteToken:"a".repeat(64),nextPaymentDate:"2026-11-01T12:00:00Z",firstDeliveryDate:"2026-11-01T00:00:00Z" };
test("shows concise saving and full-price renewal without repeating the first charge",()=>{
  render(<SubscriptionIntroOfferSummary quote={quote}/>);
  expect(screen.getByText("10% first payment offer")).toBeTruthy();expect(screen.getByText("−£2.00")).toBeTruthy();
  expect(screen.getByText(/Then £21.00 per billing period from 01\/11\/2026/)).toBeTruthy();
  expect(screen.queryByText(/First payment:/)).toBeNull();
});
test("fixed discount uses GBP without a zero-percent claim",()=>{
  render(<SubscriptionIntroOfferSummary quote={{...quote,discountType:"fixed",percentOff:0}}/>);
  expect(screen.getByText("First payment offer")).toBeTruthy();expect(screen.queryByText(/0%/)).toBeNull();
});
test("ineligible customers see renewal without an offer",()=>{
  render(<SubscriptionIntroOfferSummary quote={{...quote,eligible:false,percentOff:0,discountMinor:0,firstChargeMinor:2100}}/>);
  expect(screen.queryByText(/payment offer/)).toBeNull();expect(screen.getByText(/Then £21.00/)).toBeTruthy();
});
test("subscription code clearly applies once and keeps the full renewal price visible",()=>{
  render(<SubscriptionIntroOfferSummary quote={{...quote,discountCode:"WELCOME-SUB"}}/>);
  expect(screen.getByText("WELCOME-SUB · first payment only")).toBeTruthy();
  expect(screen.getByText("−£2.00")).toBeTruthy();
  expect(screen.getByText(/Then £21.00 per billing period/)).toBeTruthy();
});
