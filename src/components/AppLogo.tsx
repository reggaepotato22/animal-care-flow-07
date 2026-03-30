import { cn } from "@/lib/utils";

interface AppLogoProps {
  /** Height of the logo image in pixels */
  imgHeight?: number;
  /** Show "InnoVetPro" wordmark text beside the image */
  showText?: boolean;
  /** Show "Vet Management" tagline below the wordmark (only when showText=true) */
  showTagline?: boolean;
  /** Row = image + text side by side; col = image above text */
  direction?: "row" | "col";
  className?: string;
  textClassName?: string;
}

export function AppLogo({
  imgHeight = 32,
  showText = false,
  showTagline = false,
  direction = "row",
  className,
  textClassName,
}: AppLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center",
        direction === "col" ? "flex-col gap-2" : "flex-row gap-2",
        className
      )}
    >
      <img
        src="/InnovetPro_Logo_.png"
        alt="InnoVetPro"
        style={{ height: imgHeight, width: "auto" }}
        className="shrink-0 object-contain"
      />

      {showText && (
        <div className={cn("flex flex-col leading-none min-w-0", direction === "col" && "items-center")}>
          <span className={cn("font-bold tracking-tight", textClassName)}>
            InnoVetPro
          </span>
          {showTagline && (
            <span className="text-[9px] uppercase tracking-widest font-medium opacity-50 truncate">
              Vet Management
            </span>
          )}
        </div>
      )}
    </div>
  );
}
