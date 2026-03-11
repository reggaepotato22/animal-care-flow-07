import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/hooks/useWorkflow";
import type { WorkflowStepId } from "@/config/workflow";

export function WorkflowProgress({
  patientId,
  className,
}: {
  patientId: string;
  className?: string;
}) {
  const { steps, currentIndex, goTo } = useWorkflow({ patientId });

  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex items-center">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;
          const leftSegment = idx > 0;
          const showRight = idx < steps.length - 1;
          return (
            <div key={step.id} className="flex-1 flex items-center">
              {leftSegment && (
                <motion.div
                  className={cn("h-[2px] mx-1 flex-1 rounded", isCompleted ? "bg-primary" : "bg-muted")}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ transformOrigin: "left" }}
                />
              )}
              <button
                type="button"
                onClick={() => goTo(step.id as WorkflowStepId)}
                title={step.label}
                className="relative flex flex-col items-center group"
              >
                <motion.div
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center",
                    isCompleted && "bg-primary border-primary",
                    isCurrent && "bg-primary/20 border-primary",
                    isUpcoming && "bg-muted border-muted-foreground/30"
                  )}
                  whileHover={{ scale: 1.06 }}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isCompleted ? "bg-primary-foreground" : isCurrent ? "bg-primary" : "bg-muted-foreground/40"
                    )}
                  />
                </motion.div>
                <span
                  className={cn(
                    "mt-2 text-[11px] tracking-wide",
                    isCompleted ? "text-foreground" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {showRight && (
                <motion.div
                  className={cn("h-[2px] mx-1 flex-1 rounded", idx < currentIndex ? "bg-primary" : "bg-muted")}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ transformOrigin: "left" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
