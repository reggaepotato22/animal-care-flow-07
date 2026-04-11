import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  getInvoices, markInvoicePaid, lockInvoice, voidInvoice, seedMockInvoices,
  getBillingStats,
  type Invoice, type InvoiceStatus, type PaymentMethod,
} from "@/lib/billingStore";
import { broadcast, EVENTS } from "@/lib/realtimeEngine";
import { formatKES } from "@/lib/kenya";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import {
  Search, Plus, TrendingUp, Clock, CheckCircle2, AlertCircle,
  FileText, MoreVertical, Copy, Check, MessageCircle, Lock,
  Phone, Mail, Banknote, Printer,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SPECIES_EMOJI: Record<string, string> = {
  Cat: "🐱", Dog: "🐕", Rabbit: "🐰", Bird: "🐦", Reptile: "🦎",
};

const STATUS_CFG: Record<InvoiceStatus, { label: string; cls: string; icon: ReactNode }> = {
  paid:    { label: "Paid",    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: <Clock className="h-3 w-3" /> },
  overdue: { label: "Overdue", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800", icon: <AlertCircle className="h-3 w-3" /> },
  draft:   { label: "Draft",   cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700", icon: <FileText className="h-3 w-3" /> },
};

const PAY_CFG: Record<string, { label: string; cls: string }> = {
  mpesa:     { label: "M-Pesa",     cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  cash:      { label: "Cash",       cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  insurance: { label: "Insurance",  cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  card:      { label: "Card",       cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 text-[11px] px-2 py-0.5 font-semibold border", cfg.cls)}>
      {cfg.icon}{cfg.label}
    </Badge>
  );
}

function PayBadge({ method }: { method: PaymentMethod }) {
  if (!method) return <span className="text-xs text-muted-foreground">—</span>;
  const cfg = PAY_CFG[method] ?? { label: method, cls: "bg-zinc-100 text-zinc-700" };
  return <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.cls)}>{cfg.label}</span>;
}

function CopyTxId({ txId }: { txId?: string }) {
  const [copied, setCopied] = useState(false);
  if (!txId) return <span className="text-xs text-muted-foreground">—</span>;
  const doCopy = () => {
    navigator.clipboard.writeText(txId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={doCopy} className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors group">
      <span>{txId}</span>
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}

// ─── Stats cards ──────────────────────────────────────────────────────────────
function StatsCards({ invoices }: { invoices: Invoice[] }) {
  const s = useMemo(() => getBillingStats(invoices), [invoices]);
  const cards = [
    {
      label: "Total Billed",
      value: formatKES(s.totalBilled),
      sub: `+12% ↑ vs last month`,
      icon: <TrendingUp className="h-5 w-5" />,
      accent: "text-primary",
      bg: "bg-primary/10 dark:bg-primary/20",
    },
    {
      label: "Paid",
      value: formatKES(s.totalPaid),
      sub: `${s.countPaid} invoices cleared`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      accent: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Pending",
      value: formatKES(s.totalPending),
      sub: `${s.countPending} invoice${s.countPending !== 1 ? "s" : ""} awaiting payment`,
      icon: <Clock className="h-5 w-5" />,
      accent: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Overdue",
      value: formatKES(s.totalOverdue),
      sub: `${s.countOverdue} invoice${s.countOverdue !== 1 ? "s" : ""} past due date`,
      icon: <AlertCircle className="h-5 w-5" />,
      accent: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
  ];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className={cn("text-2xl font-bold mt-1.5", c.accent)}>{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl", c.bg, c.accent)}>{c.icon}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Invoice detail slide-over ─────────────────────────────────────────────────
function InvoiceSlideOver({ invoice, onClose, onLocked, onMarkPaid }: {
  invoice: Invoice | null;
  onClose: () => void;
  onLocked: (inv: Invoice) => void;
  onMarkPaid: (id: string, method: PaymentMethod, tx?: string) => void;
}) {
  const { toast } = useToast();
  const { role } = useRole();
  if (!invoice) return null;
  const cfg = STATUS_CFG[invoice.status];

  const handleLock = () => {
    const updated = lockInvoice(invoice.id);
    if (!updated) return;
    try {
      broadcast({
        type: EVENTS.BILLING_LOCKED,
        payload: { patientName: invoice.petName, invoiceId: invoice.id, amount: formatKES(invoice.total) },
        actorRole: role,
        actorName: "Front Desk",
        clinicId: "clinic-demo",
        timestamp: new Date().toISOString(),
      });
    } catch {}
    onLocked(updated);
    toast({ title: "Invoice Locked", description: `${invoice.number} is now locked and sent to Pharmacy.` });
  };

  const handlePrint = () => window.print();

  const waMsg = encodeURIComponent(
    `Hi ${invoice.clientName}, your invoice ${invoice.number} for ${invoice.petName} is ${formatKES(invoice.total)}. ` +
    `Please make payment via M-Pesa. Thank you — InnoVet Pro Clinic.`
  );

  return (
    <Sheet open={!!invoice} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[560px] sm:max-w-[560px] overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{invoice.number}</p>
              <SheetTitle className="text-xl font-bold mt-0.5">
                Invoice · <span className={cn("inline-flex items-center gap-1", cfg.cls.split(" ").slice(2).join(" "))}>{invoice.petName}</span>
              </SheetTitle>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Client + Patient info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client</p>
              <p className="font-semibold text-sm">{invoice.clientName}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />{invoice.clientPhone}
              </div>
              {invoice.clientEmail && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />{invoice.clientEmail}
                </div>
              )}
            </div>
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Patient</p>
              <p className="font-semibold text-sm">
                {SPECIES_EMOJI[invoice.species] ?? "🐾"} {invoice.petName}
              </p>
              <p className="text-xs text-muted-foreground">{invoice.species} · {invoice.breed}</p>
              <p className="text-xs text-muted-foreground">Dr. {invoice.attendingVet}</p>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Created {format(new Date(invoice.createdAt), "dd MMM yyyy")}</span>
            <span>·</span>
            <span>Due {format(new Date(invoice.dueAt), "dd MMM yyyy")}</span>
            {invoice.paidAt && <><span>·</span><span className="text-emerald-600 font-medium">Paid {format(new Date(invoice.paidAt), "dd MMM yyyy")}</span></>}
          </div>

          <Separator />

          {/* Line items */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Line Items</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs h-8">Service</TableHead>
                    <TableHead className="text-xs h-8 text-center w-12">Qty</TableHead>
                    <TableHead className="text-xs h-8 text-right">Unit Price</TableHead>
                    <TableHead className="text-xs h-8 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map(li => (
                    <TableRow key={li.id}>
                      <TableCell className="text-sm py-2.5">{li.name}</TableCell>
                      <TableCell className="text-sm py-2.5 text-center">{li.qty}</TableCell>
                      <TableCell className="text-sm py-2.5 text-right">{formatKES(li.unitPrice)}</TableCell>
                      <TableCell className="text-sm py-2.5 text-right font-medium">{formatKES(li.qty * li.unitPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{formatKES(invoice.subtotal)}</span>
              </div>
              {invoice.vatRate > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT ({Math.round(invoice.vatRate * 100)}%)</span>
                  <span>{formatKES(invoice.vatAmount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span className="text-primary">{formatKES(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* M-Pesa reference */}
          {invoice.mpesaTxId && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">M-Pesa Reference</p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-green-800 dark:text-green-300">{invoice.mpesaTxId}</span>
                <CopyTxId txId={invoice.mpesaTxId} />
              </div>
              {/* QR placeholder */}
              <div className="mt-2 h-24 w-24 bg-white dark:bg-zinc-800 rounded-lg border border-green-200 dark:border-green-700 flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                QR Code
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {!invoice.isLocked && invoice.status !== "paid" && (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                data-tutorial="lock-invoice-btn"
                onClick={handleLock}
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock Invoice
              </Button>
            )}
            {invoice.status === "pending" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onMarkPaid(invoice.id, "cash")}
              >
                <Banknote className="h-4 w-4 mr-2" />
                Mark as Paid (Cash)
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`https://wa.me/${invoice.clientPhone.replace(/[^0-9]/g, "")}?text=${waMsg}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const TAB_VALUES = ["all", "paid", "pending", "overdue", "draft"] as const;
type TabValue = typeof TAB_VALUES[number];

export default function Billing() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    seedMockInvoices();
    return getInvoices();
  });
  const [tab, setTab]       = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = () => setInvoices(getInvoices());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    let list = tab === "all" ? invoices : invoices.filter(i => i.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.petName.toLowerCase().includes(q) ||
        i.clientName.toLowerCase().includes(q) ||
        i.number.toLowerCase().includes(q) ||
        (i.mpesaTxId ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, tab, search]);

  const handleMarkPaid = useCallback((id: string, method: PaymentMethod, tx?: string) => {
    const updated = markInvoicePaid(id, method, tx);
    if (!updated) return;
    setInvoices(getInvoices());
    setSelected(prev => prev?.id === id ? updated : prev);
    try {
      broadcast({
        type: EVENTS.BILLING_LOCKED,
        payload: { patientName: updated.petName, invoiceId: updated.id, amount: formatKES(updated.total) },
        actorRole: "Receptionist", actorName: "Front Desk",
        clinicId: "clinic-demo", timestamp: new Date().toISOString(),
      });
    } catch {}
    toast({ title: "✓ Payment Recorded", description: `${updated.petName}'s invoice marked as paid.` });
  }, [toast]);

  const handleLocked = useCallback((inv: Invoice) => {
    setInvoices(getInvoices());
    setSelected(inv);
  }, []);

  const handleVoid = useCallback((id: string) => {
    voidInvoice(id);
    setInvoices(getInvoices());
    setSelected(prev => prev?.id === id ? null : prev);
    toast({ title: "Invoice Voided" });
  }, [toast]);

  const tabCount = useCallback((t: TabValue) =>
    t === "all" ? invoices.length : invoices.filter(i => i.status === t).length,
  [invoices]);

  return (
    <TooltipProvider>
      <div className="space-y-6 p-0">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing & Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">KES invoices, M-Pesa payments, and financial records</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => toast({ title: "New Invoice", description: "Invoice builder coming soon." })}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>

        {/* ── Stats cards ── */}
        <StatsCards invoices={invoices} />

        {/* ── Tabs + search ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <Tabs value={tab} onValueChange={v => setTab(v as TabValue)}>
            <TabsList className="h-9">
              {TAB_VALUES.map(t => (
                <TabsTrigger key={t} value={t} className="capitalize text-xs px-3 gap-1.5">
                  {t === "all" ? "All Invoices" : t.charAt(0).toUpperCase() + t.slice(1)}
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    t === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {tabCount(t)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search client, patient, TxID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
              data-tutorial="nav-billing"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10 pl-4">Client</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10">Patient</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10 hidden lg:table-cell">Services</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10 text-right">Amount</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10 hidden md:table-cell">Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10 hidden lg:table-cell">Payment</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10 hidden xl:table-cell">M-Pesa TxID</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-10 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16 text-center text-muted-foreground text-sm">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      No invoices {tab !== "all" ? `with status "${tab}"` : ""} found.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer",
                      selected?.id === inv.id && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                    onClick={() => setSelected(inv)}
                  >
                    {/* Client */}
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {inv.clientName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate max-w-[130px]">{inv.clientName}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />{inv.clientPhone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {/* Patient */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{SPECIES_EMOJI[inv.species] ?? "🐾"}</span>
                        <div>
                          <p className="text-sm font-medium">{inv.petName}</p>
                          <p className="text-[11px] text-muted-foreground">{inv.breed}</p>
                        </div>
                      </div>
                    </TableCell>
                    {/* Services */}
                    <TableCell className="py-3 hidden lg:table-cell">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px] block cursor-default">
                            {inv.services.join(", ")}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">{inv.services.join(" · ")}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {/* Amount */}
                    <TableCell className="py-3 text-right font-bold text-sm">{formatKES(inv.total)}</TableCell>
                    {/* Date */}
                    <TableCell className="py-3 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {format(new Date(inv.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    {/* Payment method */}
                    <TableCell className="py-3 hidden lg:table-cell">
                      <PayBadge method={inv.paymentMethod} />
                    </TableCell>
                    {/* M-Pesa TxID */}
                    <TableCell className="py-3 hidden xl:table-cell" onClick={e => e.stopPropagation()}>
                      <CopyTxId txId={inv.mpesaTxId} />
                    </TableCell>
                    {/* Status */}
                    <TableCell className="py-3">
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="py-3 pr-4 text-right" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setSelected(inv)}>
                            <FileText className="h-3.5 w-3.5 mr-2" /> View / PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={`https://wa.me/${inv.clientPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${inv.clientName}, your invoice ${inv.number} for ${inv.petName} is ${formatKES(inv.total)}. Thank you — InnoVet Pro.`)}`}
                              target="_blank" rel="noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5 mr-2" /> Send to Client
                            </a>
                          </DropdownMenuItem>
                          {inv.status !== "paid" && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(inv.id, "cash")}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleVoid(inv.id)} className="text-destructive focus:text-destructive">
                            <AlertCircle className="h-3.5 w-3.5 mr-2" /> Void
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* ── Slide-over detail ── */}
        <InvoiceSlideOver
          invoice={selected}
          onClose={() => setSelected(null)}
          onLocked={handleLocked}
          onMarkPaid={handleMarkPaid}
        />
      </div>
    </TooltipProvider>
  );
}
