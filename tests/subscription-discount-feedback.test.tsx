import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import CodeField from "@/portal/components/SubscriptionDiscountCodeField";
import { subscriptionCodeRejection } from "@/portal/components/subscriptionCodeFeedback";
afterEach(cleanup);
const props = () => ({value:"WELCOME",appliedCode:"WELCOME",loading:false,rejection:null,onChange:vi.fn(),onApply:vi.fn(),onRemove:vi.fn()});
test("existing subscriber rejection is tied to the field with a way to continue",()=>{
 const p=props();render(<CodeField {...p} rejection={subscriptionCodeRejection("Subscription codes are for first-time subscribers only, with one use per customer.")}/>);
 expect(screen.getByRole("alert").textContent).toContain("You’ve subscribed before");
 expect(screen.getByLabelText("Subscription discount code").getAttribute("aria-invalid")).toBe("true");
 expect(screen.queryByRole("button",{name:"Retry pricing"})).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Continue without code"}));expect(p.onRemove).toHaveBeenCalledTimes(1);
});
test("minimum spend explains that delivery does not count",()=>{
 render(<CodeField {...props()} rejection={subscriptionCodeRejection("Minimum product value is £15.00.")}/>);
 expect(screen.getByRole("alert").textContent).toContain("£15.00");
 expect(screen.getByRole("alert").textContent).toContain("Delivery fees do not count");
});
test("network errors are not mislabelled as a rejected code",()=>{
 expect(subscriptionCodeRejection("Failed to fetch")).toBeNull();
 expect(subscriptionCodeRejection("Could not confirm subscription pricing.")).toBeNull();
});
test("applying a code and removing a confirmed code remain separate actions",()=>{
 const p=props();render(<CodeField {...p}/>);
 fireEvent.click(screen.getByRole("button",{name:"Apply",exact:true}));expect(p.onApply).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button",{name:"Remove",exact:true}));expect(p.onRemove).toHaveBeenCalledTimes(1);
});
