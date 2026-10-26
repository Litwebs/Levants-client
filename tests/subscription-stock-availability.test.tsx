import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, test} from "vitest";
import Summary, {type SubscriptionPricingQuote} from "@/portal/components/SubscriptionIntroOfferSummary";
afterEach(cleanup);
const quote:SubscriptionPricingQuote={productsMinor:200,deliveryMinor:100,discountMinor:0,firstChargeMinor:300,renewalMinor:600,percentOff:0,eligible:false,quoteToken:"a".repeat(64),firstDeliveryDate:"2026-11-04T00:00:00Z",nextPaymentDate:"2026-11-11T12:00:00Z",stockDeferralAvailable:true,canCreate:true,availability:[{scheduledDate:"2026-11-04T00:00:00Z",deferred:[{name:"Weekly bread",quantity:1}],included:[{name:"Milk",quantity:1}],notChargedMinor:300}]};
test("names missing goods and date, amount not charged, standing recurrence and no backlog",()=>{
 render(<Summary quote={quote}/>);expect(screen.getByText("Weekly bread ×1")).toBeTruthy();expect(screen.getByText(/Unavailable for 04\/11\/2026/)).toBeTruthy();
 expect(screen.getByText(/£3.00 will not be charged/).textContent).toContain("Missed quantities do not accumulate");
 expect(screen.getByText(/£6.00 per billing period/)).toBeTruthy();expect(screen.getByText(/future amounts may change/)).toBeTruthy();
});
test("all unavailable blocks misleading success with actionable explanation",()=>{
 render(<Summary quote={{...quote,canCreate:false}}/>);expect(screen.getByRole("alert").textContent).toContain("Adjust your selection");
 expect(screen.getByRole("alert").textContent).toContain("No payment will be taken");
});
test("legacy quotes show ordinary renewal without invented shortages",()=>{
 render(<Summary quote={{...quote,stockDeferralAvailable:false,availability:undefined}}/>);expect(screen.queryByText(/Unavailable for/)).toBeNull();expect(screen.getByText(/£6.00 per billing period/)).toBeTruthy();
});
