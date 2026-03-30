import { Construction } from "lucide-react";

interface UnderDevelopmentProps {
  children: React.ReactNode;
  pageName?: string;
}

/**
 * Wraps a page in a non-interactive overlay to indicate it is under development.
 * The underlying content is still visible but completely blocked from interaction.
 */
export function UnderDevelopment({ children, pageName }: UnderDevelopmentProps) {
  return (
    <div className="relative">
      {/* Banner */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-500 px-4 py-3 shadow-sm">
        <Construction className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            🚧 {pageName ? `${pageName} — ` : ""}Under Development
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            This page is read-only. Features are visible but not yet active. Full functionality coming soon.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-200 dark:bg-amber-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
          Preview Only
        </span>
      </div>

      {/* Content wrapper — pointer-events-none blocks all interaction */}
      <div
        className="relative select-none"
        style={{ pointerEvents: "none", userSelect: "none" }}
        aria-disabled="true"
      >
        {/* Subtle tint overlay */}
        <div
          className="absolute inset-0 z-10 rounded-lg bg-amber-50/20 dark:bg-amber-950/10"
          style={{ pointerEvents: "none" }}
        />
        <div className="opacity-60">
          {children}
        </div>
      </div>
    </div>
  );
}
