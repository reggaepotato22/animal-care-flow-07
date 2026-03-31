import { useFeedback } from "@/contexts/FeedbackContext";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

export function FeedbackButton() {
  const { openSnagModal } = useFeedback();

  return (
    <Button
      onClick={openSnagModal}
      size="sm"
      className={[
        "fixed bottom-4 right-4 z-50 shadow-lg",
        "bg-[#1A2426] hover:bg-[#243032] text-white",
        "border border-white/10 gap-2 px-3 h-9 rounded-full",
        "transition-all duration-200 hover:shadow-xl hover:scale-105",
      ].join(" ")}
      title="Report a friction point or bug"
    >
      <Bug className="h-3.5 w-3.5 text-[#56B246]" />
      <span className="text-xs font-semibold">Report a Snag</span>
    </Button>
  );
}
