import { useState } from "react";
import { Smartphone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MpesaStatus = "idle" | "waiting" | "success" | "failed";

interface BillLine { label: string; amount: number }

interface MpesaFlowProps {
  lines: BillLine[];
  patientName: string;
  onSuccess: () => void;
}

const formatKES = (n: number) =>
  `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function MpesaFlow({ lines, patientName, onSuccess }: MpesaFlowProps) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<MpesaStatus>("idle");

  const total = lines.reduce((s, l) => s + l.amount, 0);

  const initiatePush = () => {
    if (phone.length < 9) return;
    setStatus("waiting");
    // Simulated STK Push — replace with real backend call in production
    window.setTimeout(() => {
      setStatus("success");
      window.setTimeout(onSuccess, 2200);
    }, 5000);
  };

  /* ── Success ── */
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-5 px-4">
        <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Payment Received!</p>
          <p className="text-base font-semibold">{formatKES(total)} via M-Pesa</p>
          <p className="text-sm text-muted-foreground mt-2">Receipt sent to WhatsApp ✓</p>
          <p className="text-xs text-muted-foreground">{patientName}</p>
        </div>
      </div>
    );
  }

  /* ── Waiting for PIN ── */
  if (status === "waiting") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-5 px-4">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold">Waiting for Customer PIN</p>
          <p className="text-sm text-muted-foreground">M-Pesa prompt sent to</p>
          <p className="text-base font-mono font-semibold">+254 {phone}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Ask customer to check their phone and enter PIN…
          </p>
        </div>
        <button
          onClick={() => setStatus("idle")}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  /* ── Failed ── */
  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <p className="font-bold text-destructive">Payment Failed</p>
          <p className="text-sm text-muted-foreground">Customer may have cancelled or timed out.</p>
        </div>
        <button
          onClick={() => setStatus("idle")}
          className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ── Idle: Bill summary + phone entry ── */
  return (
    <div className="space-y-5">
      {/* Bill breakdown */}
      <div className="rounded-2xl border border-border overflow-hidden">
        {lines.map((line, i) => (
          <div key={i}
            className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
            <span className="text-sm text-muted-foreground">{line.label}</span>
            <span className="text-sm font-semibold">{formatKES(line.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-4 bg-primary/10">
          <span className="text-base font-bold">Total Due</span>
          <span className="text-2xl font-bold text-primary">{formatKES(total)}</span>
        </div>
      </div>

      {/* Phone input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Customer M-Pesa Number</label>
        <div className="flex">
          <span className="flex items-center px-4 bg-muted border border-r-0 border-input rounded-l-xl text-sm font-bold text-foreground">
            🇰🇪 +254
          </span>
          <Input
            type="tel"
            inputMode="numeric"
            placeholder="7XX XXX XXX"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="rounded-l-none rounded-r-xl h-14 text-xl font-mono tracking-widest border-l-0"
          />
        </div>
        <p className="text-xs text-muted-foreground">Enter the 9-digit number after +254</p>
      </div>

      {/* M-Pesa CTA button */}
      <button
        onClick={initiatePush}
        disabled={phone.length < 9}
        className={cn(
          "w-full h-16 rounded-2xl flex items-center justify-center gap-3",
          "font-bold text-lg transition-all active:scale-98 select-none",
          phone.length >= 9
            ? "bg-[#00B300] hover:bg-[#009900] text-white shadow-lg shadow-green-500/30"
            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
        )}
      >
        <Smartphone className="h-6 w-6" />
        <span className="text-xl tracking-wide">M-PESA</span>
        <span className="font-normal text-base opacity-90">Send STK Push</span>
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Customer will receive a payment prompt on their Safaricom line
      </p>
    </div>
  );
}
