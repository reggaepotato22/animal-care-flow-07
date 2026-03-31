import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { sendFeedback, CATEGORY_LABELS, type FeedbackCategory } from "@/lib/feedbackService";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bug, Palette, Sparkles, MessageSquare, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: FeedbackCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: "bug",     label: "Bug Report",      icon: Bug,          color: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
  { id: "ux",      label: "UI/UX Issue",     icon: Palette,      color: "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" },
  { id: "feature", label: "Feature Request", icon: Sparkles,     color: "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  { id: "general", label: "General",         icon: MessageSquare, color: "border-primary/30 bg-primary/5 text-primary" },
];

export function FeedbackModal() {
  const { snagOpen, setSnagOpen } = useFeedback();
  const { role } = useRole();
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [includeContext, setIncludeContext] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory("general");
    setMessage("");
    setEmail(user?.email ?? "");
    setIncludeContext(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await sendFeedback({
        type: "snag_report",
        category,
        message: message.trim(),
        role: role ?? "Unknown",
        route: location.pathname,
        pageContext: includeContext ? `${location.pathname}${location.search}` : undefined,
        userEmail: email.trim() || undefined,
        timestamp: new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }),
      });
      toast({
        title: "We heard you! 👂",
        description:
          "Thanks for the report. We'll look into it and roll out a fix in the next build.",
        duration: 6000,
      });
      setSnagOpen(false);
      reset();
    } catch {
      toast({
        title: "Couldn't send right now",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={snagOpen} onOpenChange={v => { setSnagOpen(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-xl">🔧</span> Report a Snag
          </DialogTitle>
          <DialogDescription>
            Tell us what tripped you up. Your role ({role ?? "user"}) and the current page are
            automatically included.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Category chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Category
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                    category === id
                      ? cn(color, "ring-2 ring-offset-1 ring-primary/50")
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="snag-message" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What happened? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="snag-message"
              placeholder="Describe the friction point or issue in as much detail as you like…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              required
              className="resize-none text-sm"
            />
          </div>

          {/* Optional email */}
          <div className="space-y-1.5">
            <Label htmlFor="snag-email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your email <span className="text-muted-foreground font-normal">(optional — for a follow-up)</span>
            </Label>
            <Input
              id="snag-email"
              type="email"
              placeholder="you@clinic.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Include context checkbox */}
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="include-context"
              checked={includeContext}
              onCheckedChange={v => setIncludeContext(!!v)}
              className="mt-0.5"
            />
            <label htmlFor="include-context" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Include my current page URL as context{" "}
              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                {location.pathname}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setSnagOpen(false); reset(); }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={submitting || !message.trim()}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-4 w-4" /> Send Report</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
