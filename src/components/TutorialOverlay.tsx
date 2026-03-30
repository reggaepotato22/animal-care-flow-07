import React, { useEffect, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useTutorial } from "@/contexts/TutorialContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";

// ── Spotlight helpers ────────────────────────────────────────────────────────
interface TargetRect { top: number; left: number; width: number; height: number }
const MODAL_W = 352;
const MODAL_H = 340;
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
  if (!rect || pos === "center") {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0, left = 0;

  if (pos === "right") {
    left = rect.left + rect.width + GAP;
    top  = rect.top + rect.height / 2 - MODAL_H / 2;
    if (left + MODAL_W > vw - GAP) left = rect.left - MODAL_W - GAP;
    if (left < GAP) left = GAP;
  } else if (pos === "bottom") {
    top  = rect.top + rect.height + GAP;
    left = rect.left + rect.width / 2 - MODAL_W / 2;
    if (top + MODAL_H > vh - GAP) top = rect.top - MODAL_H - GAP;
    left = Math.max(GAP, Math.min(left, vw - MODAL_W - GAP));
  } else {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
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

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i + 1 === current
              ? "w-5 h-2 bg-primary"
              : i + 1 < current
              ? "w-2 h-2 bg-primary/40"
              : "w-2 h-2 bg-muted-foreground/25"
          )}
        />
      ))}
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
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Find + measure target element on each step change
  useEffect(() => {
    if (!isActive || !currentStep?.target) {
      setTargetRect(null);
      return;
    }
    // Wait one tick so the DOM is fully painted
    const id = window.setTimeout(() => {
      const rect = findTarget(currentStep.target);
      if (rect) {
        setTargetRect(rect);
        document.querySelector<HTMLElement>(`[data-tutorial="${currentStep.target}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        setTargetRect(null);
      }
    }, 80);
    return () => window.clearTimeout(id);
  }, [isActive, step, currentStep]);

  if (!isActive || !currentStep) return null;

  const isFirst = step === 1;
  const isLast = step === totalSteps;
  const hasTarget = !!targetRect;
  const pos = currentStep.position ?? "center";

  return (
    <>
      {/* Backdrop (only when no spotlight ring — ring provides its own via box-shadow) */}
      {!hasTarget && (
        <div
          className="fixed inset-0 z-[9997] bg-black/50 backdrop-blur-[2px]"
          onClick={skipTutorial}
          aria-hidden="true"
        />
      )}

      {/* Click-capture layer when spotlight is active */}
      {hasTarget && (
        <div
          className="fixed inset-0 z-[9997]"
          onClick={skipTutorial}
          aria-hidden="true"
        />
      )}

      {/* Spotlight ring — its box-shadow IS the dark overlay */}
      {hasTarget && targetRect && <SpotlightRing rect={targetRect} />}

      {/* Modal card */}
      <div
        className={cn(
          "fixed z-[9999] bg-background border border-border rounded-2xl shadow-2xl",
          "w-[352px]",
          !hasTarget && "animate-in fade-in zoom-in-95 duration-200"
        )}
        style={modalStyle(targetRect, pos)}
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${step} of ${totalSteps}`}
      >
        {/* Close button */}
        <button
          onClick={skipTutorial}
          className="absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Skip tutorial"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Logo on step 1 only */}
          {isFirst && <InnoVetProMark />}

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Step {step} of {totalSteps}
            </span>
            <StepDots total={totalSteps} current={step} />
          </div>

          {/* Step illustration */}
          <StepIllustration stepId={step} />

          {/* Content */}
          <h2 className="text-lg font-bold text-foreground mb-2 leading-snug">
            {currentStep.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>

          {/* Progress bar */}
          <div className="mt-5 mb-4 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={prevStep}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={isLast ? skipTutorial : nextStep}
            >
              {isLast ? (
                <>Get Started</>
              ) : (
                <>
                  {isFirst ? "Start Tour" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={skipTutorial}
              className="w-full mt-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
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
      className="fixed bottom-5 right-5 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105"
    >
      <BookOpen className="h-4 w-4" />
    </button>
  );
}
