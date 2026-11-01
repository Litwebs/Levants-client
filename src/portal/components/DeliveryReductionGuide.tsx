import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** Read-only help; opening the guide never changes a delivery. */
export default function DeliveryReductionGuide() {
  return <Button asChild size="sm" variant="ghost" data-tour="delivery-reduction-guide">
    <Link to="/portal/subscription-guide#one-delivery">How delivery-only changes work</Link>
  </Button>;
}
