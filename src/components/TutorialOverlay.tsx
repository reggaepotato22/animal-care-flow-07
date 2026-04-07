import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { useTutorial } from "@/contexts/TutorialContext";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft, BookOpen, CheckSquare, Minimize2 } from "lucide-react";
import type { Role } from "@/lib/rbac";

// ── Spotlight helpers ────────────────────────────────────────────────────────
interface TargetRect { top: number; left: number; width: number; height: number }
const MODAL_W = 420;
const MODAL_H = 500;
const GAP     = 14;
const PAD     = 8;

function findTarget(target?: string): TargetRect | null {
  if (!target) return null;
  const el = document.querySelector<HTMLElement>(`[data-tutorial="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function modalStyle(rect: TargetRect | null, pos: string): React.CSSProperties {
  // No target → true screen-center
  if (!rect) {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }
  // Has a target — ALWAYS position near it, never overlay it.
  // "center" is treated as "bottom" when a target exists.
  const effectivePos = pos === "center" ? "bottom" : pos;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0, left = 0;

  if (effectivePos === "right") {
    left = rect.left + rect.width + GAP;
    top  = rect.top + rect.height / 2 - MODAL_H / 2;
    // Not enough room on right? try left
    if (left + MODAL_W > vw - GAP) left = rect.left - MODAL_W - GAP;
    // Still off-screen (narrow sidebar)? fall below
    if (left < GAP) {
      left = Math.max(GAP, rect.left + rect.width / 2 - MODAL_W / 2);
      top  = rect.top + rect.height + GAP;
    }
  } else if (effectivePos === "bottom") {
    top  = rect.top + rect.height + GAP;
    left = rect.left + rect.width / 2 - MODAL_W / 2;
    // Not enough room below? try above
    if (top + MODAL_H > vh - GAP) top = rect.top - MODAL_H - GAP;
    left = Math.max(GAP, Math.min(left, vw - MODAL_W - GAP));
  } else if (effectivePos === "top") {
    top  = rect.top - MODAL_H - GAP;
    left = rect.left + rect.width / 2 - MODAL_W / 2;
    if (top < GAP) top = rect.top + rect.height + GAP;
    left = Math.max(GAP, Math.min(left, vw - MODAL_W - GAP));
  } else {
    // fallback: below
    top  = rect.top + rect.height + GAP;
    left = Math.max(GAP, Math.min(rect.left + rect.width / 2 - MODAL_W / 2, vw - MODAL_W - GAP));
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
        top:    rect.top  - PAD,
        left:   rect.left - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: 10,
        zIndex: 9998,
        boxShadow: [
          "0 0 0 9999px rgba(0,0,0,0.58)",
          "0 0 0 3px hsl(var(--primary))",
          "0 0 18px 4px hsl(var(--primary)/0.45)",
        ].join(", "),
        transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
        animation: "tutorial-pulse 2s ease-in-out infinite",
      }}
    />
  );
}


function InnoVetProMark() {
  return <AppLogo imgHeight={36} showText textClassName="text-lg font-bold" className="mb-4" />;
}

// Section labels for progress display (maps step → section name)
const STEP_SECTIONS: Record<number, string> = {
  1: "Welcome", 2: "Register", 3: "Register", 4: "Register", 5: "Register",
  6: "Triage", 7: "Triage",
  8: "Consultation", 9: "Consultation", 10: "Consultation", 11: "Consultation",
  12: "Consultation", 13: "Consultation", 14: "Consultation", 15: "Consultation",
  16: "Consultation", 17: "Consultation",
  18: "Pharmacy", 19: "Billing", 20: "Discharge", 21: "Complete",
};

const SECTIONS = ["Welcome","Register","Triage","Consultation","Pharmacy","Billing","Discharge","Complete"];

function SectionProgress({ total, current }: { total: number; current: number }) {
  const currentSection = STEP_SECTIONS[current] ?? "";
  const sectionIdx = SECTIONS.indexOf(currentSection);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {SECTIONS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-all duration-300",
              i < sectionIdx ? "bg-primary" :
              i === sectionIdx ? "bg-primary/70" :
              "bg-muted-foreground/20"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          {currentSection}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {current} / {total}
        </span>
      </div>
    </div>
  );
}

// Step-specific illustrations
function StepIllustration({ stepId }: { stepId: number }) {
  const illustrations: Record<number, React.ReactNode> = {
    1: (
      <div className="flex items-end justify-center gap-3 py-4">
        <svg width="36" height="48" viewBox="0 0 10 14" fill="none" className="text-primary/60">
          <path d="M1 5C1 3 2 1 5 1C8 1 9 3 9 5C9 8 7.5 10 5 10C2.5 10 1 8 1 5Z" fill="currentColor"/>
          <path d="M1 2L2.5 4M9 2L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3 11L3 13M7 11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <svg width="30" height="56" viewBox="0 0 9 16" fill="none" className="text-primary/80">
          <path d="M2 5C2 3 3 1.5 4.5 1.5C6 1.5 7 3 7 5C7 7.5 6 9 4.5 9C3 9 2 7.5 2 5Z" fill="currentColor"/>
          <path d="M2.5 2L2 0.5M6.5 2L7 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M2.5 10L2 13M6.5 10L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <svg width="48" height="48" viewBox="0 0 13 14" fill="none" className="text-primary">
          <path d="M2 6C2 3.5 3.5 1.5 6.5 1.5C9.5 1.5 11 3.5 11 6C11 9 9 11 6.5 11C4 11 2 9 2 6Z" fill="currentColor"/>
          <path d="M10.5 2L12 1M2.5 3L1 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3.5 12L3 13.5M9.5 12L10 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    5: (
      <div className="flex items-center justify-center gap-2 py-3">
        {["Attendant", "Vet", "Pharmacist"].map((role, i) => (
          <div key={role} className="flex items-center gap-2">
            <div className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold text-white",
              i === 0 ? "bg-amber-500" : i === 1 ? "bg-blue-500" : "bg-purple-500"
            )}>
              {role}
            </div>
            {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>
    ),
  };
  return illustrations[stepId] ? (
    <div className="bg-muted/40 rounded-xl mb-4">{illustrations[stepId]}</div>
  ) : null;
}

export function TutorialOverlay() {
  const { isActive, step, currentStep, totalSteps, nextStep, prevStep, skipTutorial } = useTutorial();
  const { setRole } = useRole();
  const navigate = useNavigate();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [stepDone, setStepDone] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Reset action-gate + minimized state whenever step changes
  useEffect(() => { setStepDone(false); setIsMinimized(false); }, [step]);

  // Auto-switch role + navigate whenever the active step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;
    if (currentStep.role) setRole(currentStep.role as Role, "Tutorial");
    if (currentStep.route) navigate(currentStep.route, { replace: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, step]);

  // Find + measure target element on each step change
  // Also elevate the target's z-index so it sits above the spotlight overlay and is clickable
  useEffect(() => {
    if (!isActive || !currentStep?.target) { setTargetRect(null); return; }
    let el: HTMLElement | null = null;
    let origPosition = "";
    let origZIndex = "";
    const id = window.setTimeout(() => {
      el = document.querySelector<HTMLElement>(`[data-tutorial="${currentStep.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        // Elevate target above the spotlight overlay so clicks reach it
        origPosition = el.style.position;
        origZIndex = el.style.zIndex;
        el.style.position = "relative";
        el.style.zIndex = "9998";
      } else {
        setTargetRect(null);
      }
    }, 200);
    return () => {
      window.clearTimeout(id);
      if (el) {
        el.style.position = origPosition;
        el.style.zIndex = origZIndex;
      }
    };
  }, [isActive, step, currentStep]);

  // Auto-detect click on spotlighted element for action-required steps
  useEffect(() => {
    if (!isActive || !currentStep?.requiresAction || !currentStep?.target) return;
    let el: HTMLElement | null = null;
    let fired = false;
    const handleClick = () => {
      if (fired) return;
      fired = true;
      setStepDone(true);
      window.setTimeout(() => nextStep(), 650);
    };
    const id = window.setTimeout(() => {
      el = document.querySelector<HTMLElement>(`[data-tutorial="${currentStep.target}"]`);
      if (el) el.addEventListener("click", handleClick);
    }, 200);
    return () => { window.clearTimeout(id); if (el) el.removeEventListener("click", handleClick); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, step]);

  // ── Step 3: minimize when btn-add-patient is clicked ─────────────────────────────────
  useEffect(() => {
    if (!isActive || step !== 3) return;
    let el: HTMLElement | null = null;
    const handleBtnClick = () => { setIsMinimized(true); };
    const id = window.setTimeout(() => {
      el = document.querySelector<HTMLElement>('[data-tutorial="btn-add-patient"]');
      if (el) el.addEventListener("click", handleBtnClick);
    }, 200);
    return () => { window.clearTimeout(id); if (el) el.removeEventListener("click", handleBtnClick); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, step]);

  // ── Step 3: restore + mark done when patient form is saved ─────────────────────
  useEffect(() => {
    if (!isActive || step !== 3) return;
    const handler = () => { setIsMinimized(false); setStepDone(true); };
    window.addEventListener("tutorial:patient-saved", handler);
    return () => window.removeEventListener("tutorial:patient-saved", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, step]);

  if (!isActive || !currentStep) return null;

  // ── Minimized pill (shown while user fills the Add Patient form) ──────────────
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-xl text-xs font-semibold animate-in slide-in-from-bottom duration-300 hover:bg-primary/90 transition-colors"
        title="Click to reopen tutorial"
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span>Tutorial paused — fill the patient form</span>
        <Minimize2 className="h-3 w-3 opacity-60" />
      </button>
    );
  }

  const isFirst    = step === 1;
  const isLast     = step === totalSteps;
  const hasTarget  = !!targetRect;
  const pos        = currentStep.position ?? "center";
  const needsAction = !!currentStep.requiresAction;
  // Step 3: must save the patient form first (stepDone=true), then user clicks Mark Complete
  const canProceed = step === 3 ? stepDone : (!needsAction || stepDone);

  const mobileModalStyle: React.CSSProperties = isMobile
    ? { position: "fixed", bottom: 0, left: 0, right: 0, top: "auto", transform: "none" }
    : {};

  return (
    <>
      {/* Backdrop */}
      {!hasTarget && (
        <div className="fixed inset-0 z-[9997] bg-black/50 backdrop-blur-[2px]" aria-hidden="true" />
      )}

      {/* Spotlight ring */}
      {!isMobile && hasTarget && targetRect && <SpotlightRing rect={targetRect} />}

      {/* ── Modal card ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-[9999] bg-background border border-border shadow-2xl flex flex-col",
          // Mobile: full-width bottom sheet, capped height
          "max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-b-0 max-sm:border-x-0",
          "max-sm:max-h-[85vh]",
          // sm+: floating card, fixed width, scrollable
          "sm:w-[420px] sm:rounded-2xl sm:max-h-[90vh]",
          !hasTarget && !isMobile && "animate-in fade-in zoom-in-95 duration-200",
          isMobile && "animate-in slide-in-from-bottom duration-300"
        )}
        style={isMobile ? mobileModalStyle : modalStyle(targetRect, pos)}
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${step} of ${totalSteps}`}
      >
        {/* ── Sticky header ── */}
        <div className="flex-none px-5 pt-5 pb-3 border-b border-border/60">
          {/* Logo on step 1 */}
          {isFirst && <InnoVetProMark />}

          {/* Role badge + close */}
          <div className="flex items-center justify-between mb-3">
            {currentStep.role ? (
              <span className={cn(
                "text-[10px] font-bold text-white px-2.5 py-1 rounded-full",
                currentStep.roleColor ?? "bg-primary"
              )}>
                {currentStep.role === "Nurse" ? "Attendant" : currentStep.role}
              </span>
            ) : <span />}
            <button
              onClick={skipTutorial}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Skip tutorial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Section progress strip */}
          <SectionProgress total={totalSteps} current={step} />
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
          {/* Step illustration (steps 1 & 8 only) */}
          <StepIllustration stepId={step} />

          <h2 className="text-base font-bold text-foreground leading-snug">
            {currentStep.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>

          {/* Action prompt */}
          {(needsAction || step === 3 || stepDone) && (
            <div className={cn(
              "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium leading-snug transition-all duration-300",
              stepDone
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-500/40 text-amber-700 dark:text-amber-300"
            )}>
              {stepDone
                ? <CheckSquare className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                : <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />}
              <span>
                {stepDone
                  ? "Patient saved! Click 'Mark Complete' below to continue to the next step."
                  : step === 3
                    ? "Click the highlighted 'Register Patient' button — the tutorial will minimise while you fill the form."
                    : (currentStep.actionLabel ?? "Click the highlighted element to continue →")}
              </span>
            </div>
          )}
        </div>

        {/* ── Sticky footer: navigation ── */}
        <div className="flex-none px-5 pb-5 pt-3 border-t border-border/60 space-y-2">
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" className="h-9 px-4" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
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
              {isLast ? "Get Started" : isFirst ? (
                <>Start Tour <ChevronRight className="h-4 w-4 ml-1" /></>
              ) : step === 3 ? (
                <><CheckSquare className="h-4 w-4 mr-1" />Mark Complete</>
              ) : (
                <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
          {!isLast && (
            <button
              onClick={skipTutorial}
              className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Small re-launch button shown after tutorial is dismissed
export function TutorialRelaunchButton() {
  const { isActive, startTutorial } = useTutorial();
  if (isActive) return null;
  return (
    <button
      onClick={startTutorial}
      title="Restart tutorial"
      className="fixed bottom-16 right-4 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105"
    >
      <BookOpen className="h-4 w-4" />
    </button>
  );
}
