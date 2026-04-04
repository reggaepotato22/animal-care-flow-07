import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Monitor, Truck, ArrowRight } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";

const CHOICE_KEY = "acf_mobile_mode_choice";

function isMobileDevice(): boolean {
  return (
    window.innerWidth < 768 ||
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

export function MobileClinicPrompt() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyChose = sessionStorage.getItem(CHOICE_KEY);
    if (!alreadyChose && isMobileDevice()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const choose = (mode: "mobile" | "standard") => {
    sessionStorage.setItem(CHOICE_KEY, mode);
    setVisible(false);
    if (mode === "mobile") navigate("/field", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 gap-8">
      {/* Logo + headline */}
      <div className="flex flex-col items-center gap-3 text-center">
        <AppLogo imgHeight={52} />
        <h1 className="text-2xl font-bold tracking-tight">
          Inno<span className="text-primary">vet</span>Pro
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          We detected you're on a mobile device. Choose your experience for this session.
        </p>
      </div>

      {/* Choice cards */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Mobile Clinic */}
        <button
          onClick={() => choose("mobile")}
          className="group w-full rounded-2xl border-2 border-primary bg-primary/5 p-5 text-left flex items-start gap-4 transition-all active:scale-[0.98] hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base flex items-center gap-1">
              Mobile Clinic
              <ArrowRight className="h-4 w-4 ml-auto text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Simplified field vet mode — large buttons, vitals pad, voice notes &amp; M-Pesa. Ideal for farm visits &amp; house calls.
            </p>
          </div>
        </button>

        {/* Standard version */}
        <button
          onClick={() => choose("standard")}
          className="group w-full rounded-2xl border-2 border-border bg-card p-5 text-left flex items-start gap-4 transition-all active:scale-[0.98] hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Monitor className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base flex items-center gap-1">
              Standard Version
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Full clinic management system — patients, billing, labs, hospitalization &amp; more.
            </p>
          </div>
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground/60 text-center">
        You can switch modes at any time from the navigation menu.
      </p>
    </div>
  );
}
