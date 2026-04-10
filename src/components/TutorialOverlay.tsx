import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTutorial, ROLE_META } from "@/contexts/TutorialContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft, BookOpen, CheckSquare, Loader2, Radio } from "lucide-react";

// ─── Spotlight helpers ────────────────────────────────────────────────────────
interface TargetRect { top: number; left: number; width: number; height: number }
const MODAL_W = 420;
const MODAL_H = 520;
const GAP = 14;
const PAD = 8;

function modalStyle(rect: TargetRect | null, pos: string): React.CSSProperties {
  if (!rect) return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  const ep = pos === "center" ? "bottom" : pos;
  const vw = window.innerWidth, vh = window.innerHeight;
  let top = 0, left = 0;
  if (ep === "right") {
    left = rect.left + rect.width + GAP;
    top = rect.top + rect.height / 2 - MODAL_H / 2;
    if (left + MODAL_W > vw - GAP) left = rect.left - MODAL_W - GAP;
    if (left < GAP) { left = Math.max(GAP, rect.left + rect.width / 2 - MODAL_W / 2); top = rect.top + rect.height + GAP; }
  } else if (ep === "left") {
    left = rect.left - MODAL_W - GAP;
    top = rect.top + rect.height / 2 - MODAL_H / 2;
    if (left < GAP) left = rect.left + rect.width + GAP;
    if (left + MODAL_W > vw - GAP) { left = Math.max(GAP, rect.left + rect.width / 2 - MODAL_W / 2); top = rect.top + rect.height + GAP; }
  } else {
    top = rect.top + rect.height + GAP;
    left = rect.left + rect.width / 2 - MODAL_W / 2;
    if (top + MODAL_H > vh - GAP) top = rect.top - MODAL_H - GAP;
    left = Math.max(GAP, Math.min(left, vw - MODAL_W - GAP));
  }
  top = Math.max(GAP, Math.min(top, vh - MODAL_H - GAP));
  return { position: "fixed", top, left };
}

function SpotlightRing({ rect }: { rect: TargetRect }) {
  return (
    <div
      className="pointer-events-none"
      style={{
        position: "fixed",
        top: rect.top - PAD, left: rect.left - PAD,
        width: rect.width + PAD * 2, height: rect.height + PAD * 2,
        borderRadius: 10, zIndex: 9998,
        boxShadow: [
          "0 0 0 9999px rgba(0,0,0,0.60)",
          "0 0 0 3px hsl(var(--primary))",
          "0 0 20px 6px hsl(var(--primary)/0.4)",
        ].join(", "),
        transition: "all 0.25s ease",
        animation: "tutorial-pulse 2s ease-in-out infinite",
      }}
    />
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function StepProgressBar({ current, total, roleColor }: { current: number; total: number; roleColor: string }) {
  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", roleColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Step {current + 1} of {total}</span>
        <span className="text-[10px] text-muted-foreground">{Math.round(pct)}% complete</span>
      </div>
    </div>
  );
}

// ─── Waiting state ────────────────────────────────────────────────────────────
function WaitingState({ label, recentEvents }: { label: string; recentEvents: import("@/lib/realtimeEngine").RealtimeEvent[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <Loader2 className="h-5 w-5 text-amber-600 animate-spin shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">{label}</p>
      </div>
      {recentEvents.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="h-3 w-3" /> Live events
          </p>
          {recentEvents.map(e => (
            <div key={e.id} className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="font-mono font-semibold text-foreground">{e.type}</span>
              <span className="opacity-60">· {e.actorName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────
export function TutorialOverlay() {
  const { isActive, currentStep, stepIndex, totalStepsForRole, activeRole, isWaiting, recentEvents, nextStep, prevStep, skipTutorial } = useTutorial();
  const navigate = useNavigate();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [stepDone, setStepDone] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Navigate + reset per step
  useEffect(() => {
    setStepDone(false);
    if (!isActive || !currentStep) return;
    if (currentStep.route) navigate(currentStep.route, { replace: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex]);

  // Spotlight measurement
  useEffect(() => {
    if (!isActive || !currentStep?.spotlight) { setTargetRect(null); return; }
    let el: HTMLElement | null = null;
    let origPos = "", origZ = "";
    const id = window.setTimeout(() => {
      el = document.querySelector<HTMLElement>(`[data-tutorial="${currentStep.spotlight}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        origPos = el.style.position; origZ = el.style.zIndex;
        el.style.position = "relative"; el.style.zIndex = "9998";
      } else { setTargetRect(null); }
    }, 200);
    return () => {
      window.clearTimeout(id);
      if (el) { el.style.position = origPos; el.style.zIndex = origZ; }
    };
  }, [isActive, stepIndex, currentStep]);

  // requiresAction: auto-advance on click
  useEffect(() => {
    if (!isActive || !currentStep?.requiresAction || !currentStep?.spotlight) return;
    let el: HTMLElement | null = null;
    let fired = false;
    const onClick = () => { if (fired) return; fired = true; setStepDone(true); window.setTimeout(() => nextStep(), 650); };
    const id = window.setTimeout(() => {
      el = document.querySelector<HTMLElement>(`[data-tutorial="${currentStep.spotlight}"]`);
      if (el) el.addEventListener("click", onClick);
    }, 200);
    return () => { window.clearTimeout(id); if (el) el.removeEventListener("click", onClick); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex]);

  if (!isActive || !currentStep) return null;

  const roleMeta = ROLE_META[activeRole ?? ""] ?? ROLE_META.SuperAdmin;
  const isFirst = stepIndex === 0;
  const isLast = currentStep.isDone === true;
  const pos = currentStep.position ?? "center";
  const hasTarget = !!targetRect;
  const canProceed = !currentStep.requiresAction || stepDone;
  const mobileStyle: React.CSSProperties = isMobile
    ? { position: "fixed", bottom: 0, left: 0, right: 0, top: "auto", transform: "none" }
    : {};

  return (
    <>
      {!hasTarget && <div className="fixed inset-0 z-[9997] bg-black/55 backdrop-blur-[2px]" aria-hidden="true" />}
      {!isMobile && hasTarget && targetRect && <SpotlightRing rect={targetRect} />}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={cn(
            "fixed z-[9999] bg-background border border-border shadow-2xl flex flex-col",
            "max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-b-0 max-sm:border-x-0 max-sm:max-h-[88vh]",
            "sm:w-[420px] sm:rounded-2xl sm:max-h-[90vh]",
          )}
          style={isMobile ? mobileStyle : modalStyle(targetRect, pos)}
          role="dialog"
          aria-modal="true"
        >
          {/* ── Header ── */}
          <div className="flex-none px-5 pt-4 pb-3 border-b border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{roleMeta.icon}</span>
                <span className={cn("text-[10px] font-bold text-white px-2.5 py-1 rounded-full", currentStep.roleColor)}>
                  {roleMeta.label} Tutorial
                </span>
                <span className="text-[10px] text-muted-foreground">
                  — Step {stepIndex + 1} of {totalStepsForRole}
                </span>
              </div>
              <button
                onClick={skipTutorial}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <StepProgressBar current={stepIndex} total={totalStepsForRole} roleColor={currentStep.roleColor} />
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
            <div className="text-2xl">{currentStep.icon}</div>
            <h2 className="text-base font-bold text-foreground leading-snug">{currentStep.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.body}</p>

            {/* Waiting state */}
            {isWaiting && (
              <WaitingState
                label={currentStep.waitLabel ?? "⏳ Waiting for an event from another user…"}
                recentEvents={recentEvents}
              />
            )}

            {/* Action prompt */}
            {!isWaiting && currentStep.requiresAction && (
              <div className={cn(
                "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium leading-snug transition-all duration-300",
                stepDone
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-500/40 text-amber-700 dark:text-amber-300"
              )}>
                {stepDone
                  ? <CheckSquare className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  : <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />}
                <span>{stepDone ? "Done! Click Next to continue." : (currentStep.actionLabel ?? "Click the highlighted element to continue →")}</span>
              </div>
            )}

            {/* broadcastOnEnter notice */}
            {currentStep.broadcastOnEnter && (
              <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Broadcasting event to all users…
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex-none px-5 pb-5 pt-3 border-t border-border/60 space-y-2">
            <div className="flex items-center gap-2">
              {!isFirst && !isWaiting && (
                <Button variant="outline" size="sm" className="h-9 px-4" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {!isWaiting && (
                <Button
                  size="sm"
                  disabled={!isLast && !canProceed}
                  className={cn(
                    "flex-1 h-9 font-semibold",
                    canProceed || isLast
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                  )}
                  onClick={isLast ? skipTutorial : nextStep}
                >
                  {isLast ? "Finish 🎉" : isFirst ? <>Start <ChevronRight className="h-4 w-4 ml-1" /></> : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              )}
              {isWaiting && (
                <Button size="sm" variant="outline" className="flex-1 h-9" onClick={nextStep}>
                  Skip wait <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            {!isLast && (
              <button onClick={skipTutorial} className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Skip tutorial
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// ─── Re-launch button — now shows role selector ───────────────────────────────
const ROLE_OPTIONS = [
  { role: "Receptionist", label: "Receptionist", icon: "📋", color: "bg-sky-500" },
  { role: "Vet",          label: "Veterinarian", icon: "🩺", color: "bg-blue-600" },
  { role: "Pharmacist",   label: "Pharmacist",   icon: "💊", color: "bg-purple-500" },
  { role: "Nurse",        label: "Attendant",    icon: "🐾", color: "bg-amber-500" },
  { role: "SuperAdmin",   label: "Super Admin",  icon: "🛡️", color: "bg-emerald-500" },
];

export function TutorialRelaunchButton() {
  const { isActive, startTutorial } = useTutorial();
  const [open, setOpen] = useState(false);
  if (isActive) return null;
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[9990] bg-black/30" onClick={() => setOpen(false)} />
      )}
      <div className="fixed bottom-20 right-4 z-[9991] flex flex-col items-end gap-2">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-background border border-border rounded-2xl shadow-2xl p-3 space-y-1.5 min-w-[180px]"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-1">Start Tutorial As</p>
              {ROLE_OPTIONS.map(r => (
                <button
                  key={r.role}
                  onClick={() => { startTutorial(r.role); setOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-muted transition-colors text-sm"
                >
                  <span className="text-base">{r.icon}</span>
                  <span className="font-medium">{r.label}</span>
                  <span className={cn("ml-auto h-2 w-2 rounded-full", r.color)} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setOpen(o => !o)}
          title="Start role tutorial"
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105"
        >
          <BookOpen className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
