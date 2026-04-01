import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { sendFeedback } from "@/lib/feedbackService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Send, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function MicroSurvey() {
  const { survey, dismissSurvey } = useFeedback();
  const { role } = useRole();
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset local state whenever a new survey is triggered
  const isVisible = !!survey;

  const handleSubmit = async () => {
    if (!rating || !survey) return;
    setSubmitting(true);
    try {
      await sendFeedback({
        type: "micro_survey",
        surveyEvent: survey.event,
        rating,
        message: comment.trim() || `Rating: ${rating}/5`,
        role: role ?? "Unknown",
        route: location.pathname,
        userEmail: user?.email || undefined,
        timestamp: new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }),
      });
      setSubmitted(true);
      setTimeout(() => {
        dismissSurvey();
        setRating(0);
        setComment("");
        setSubmitted(false);
      }, 2800);
    } catch {
      toast({ title: "Couldn't send", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    dismissSurvey();
    setRating(0);
    setComment("");
    setSubmitted(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl",
        "transition-all duration-300 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-border">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Quick Check-in</p>
          <p className="text-sm font-medium text-foreground mt-0.5 leading-snug">
            {survey?.question}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-4 pt-3 space-y-3">
        {submitted ? (
          <div className="py-4 text-center space-y-1">
            <p className="text-2xl">👂</p>
            <p className="text-sm font-semibold">We heard you!</p>
            <p className="text-xs text-muted-foreground">
              You mentioned a {survey?.event?.replace(/_/g, " ")} experience.<br />
              We're working on improvements for the next build.
            </p>
          </div>
        ) : (
          <>
            {/* Star rating */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Your rating</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        n <= (hovered || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-none text-muted-foreground/40"
                      )}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {["", "Poor", "Fair", "Okay", "Good", "Great!"][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Optional comment — shown after rating selected */}
            {rating > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Anything to add? <span className="font-normal">(optional)</span>
                </p>
                <Textarea
                  placeholder="Tell us more…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground text-xs"
                onClick={handleDismiss}
              >
                Skip
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                disabled={!rating || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Submit</>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
