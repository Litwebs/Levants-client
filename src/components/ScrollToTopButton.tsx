import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ScrollToTopButton = () => {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-50">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="rounded-full h-11 w-11 sm:h-12 sm:w-12"
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
      >
        <ArrowUp />
      </Button>
    </div>
  );
};
