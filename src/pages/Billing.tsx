import { useState, useEffect, useMemo } from "react";
import { UnderDevelopment } from "@/components/UnderDevelopment";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatKES, mpesaStkPushPlaceholder } from "@/lib/kenya";
import { Search, Receipt, User, Phone, Stethoscope, Pill, CheckCircle, Clock, XCircle, CreditCard, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import { useFeedback } from "@/contexts/FeedbackContext";

const BILLING_KEY = "acf_billing_records";

interface BillingRecord {
  id: string;
  patientId: string;
  petName: string;
  ownerName: string;
  encounterId?: string;
  veterinarian?: string;
  consultationFee: number;
  itemTotal: number;
  total: number;
  status: "pending" | "paid" | "cancelled";
  items?: Array<{ name: string; unitPrice?: number; quantity?: number; price?: number }>;
  createdAt: string;
  paidAt?: string;
}

function loadBilling(): BillingRecord[] {
  try {
    const raw = localStorage.getItem(BILLING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBilling(records: BillingRecord[]) {
  localStorage.setItem(BILLING_KEY, JSON.stringify(records));
}

const STATUS_STYLES = {
  pending:   { badge: "bg-amber-100 text-amber-800 border-amber-200",   icon: Clock,        label: "Pending" },
  paid:      { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, label: "Paid" },
  cancelled: { badge: "bg-red-100 text-red-800 border-red-200",          icon: XCircle,      label: "Cancelled" },
};

export default function Billing() {
  const { toast } = useToast();
  const { setStep } = useWorkflowContext();
  const { triggerSurvey } = useFeedback();
  const [records, setRecords] = useState<BillingRecord[]>(() => loadBilling());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BillingRecord["status"]>("all");
  const [selected, setSelected] = useState<BillingRecord | null>(null);
  const [payDialog, setPayDialog] = useState(false);
  const [phone, setPhone] = useState("+2547XXXXXXXX");
  const [payStatus, setPayStatus] = useState<"idle" | "waiting" | "success">("idle");

  // Re-sync when localStorage changes (cross-tab)
  useEffect(() => {
    const onStorage = () => setRecords(loadBilling());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !search ||
        r.petName.toLowerCase().includes(search.toLowerCase()) ||
        r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        (r.veterinarian || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter(r => r.status === "pending").length,
    paid: records.filter(r => r.status === "paid").length,
    revenue: records.filter(r => r.status === "paid").reduce((s, r) => s + r.total, 0),
    outstanding: records.filter(r => r.status === "pending").reduce((s, r) => s + r.total, 0),
  }), [records]);

  const markPaid = (bill: BillingRecord) => {
    const updated = records.map(r =>
      r.id === bill.id ? { ...r, status: "paid" as const, paidAt: new Date().toISOString() } : r
    );
    saveBilling(updated);
    setRecords(updated);
    if (selected?.id === bill.id) setSelected({ ...bill, status: "paid", paidAt: new Date().toISOString() });
    // Move patient workflow to COMPLETED
    if (bill.patientId) setStep(bill.patientId, "COMPLETED");
    toast({ title: "✓ Payment Recorded", description: `${bill.petName}'s invoice marked as paid.` });
    triggerSurvey("invoice_finalized");
  };

  const openMpesa = (bill: BillingRecord) => {
    setSelected(bill);
    setPhone("+2547XXXXXXXX");
    setPayStatus("idle");
    setPayDialog(true);
  };

  const handleMpesa = async () => {
    if (!selected) return;
    setPayStatus("waiting");
    await mpesaStkPushPlaceholder({ phone, amount: selected.total, accountReference: `INV-${selected.id.slice(-6)}`, description: "Vet services" });
    setTimeout(() => {
      setPayStatus("success");
      markPaid(selected);
      setTimeout(() => setPayDialog(false), 1500);
    }, 2000);
  };

  return (
    <UnderDevelopment pageName="Billing & Invoices">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-muted-foreground">Patient invoices from consultations and treatments</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: stats.total, icon: Receipt, color: "text-blue-600" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: "Paid", value: stats.paid, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Outstanding", value: formatKES(stats.outstanding), icon: CreditCard, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-30`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Patient list */}
        <Card className="flex-1 lg:max-w-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Invoices</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search patient or vet..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>
              <select
                className="text-xs border rounded-md px-2 bg-background"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Receipt className="h-10 w-10 mx-auto mb-3 opacity-20" />
                {records.length === 0 ? "No billing records yet. They are created automatically after saving a consultation record." : "No results match your filter."}
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map(bill => {
                  const s = STATUS_STYLES[bill.status] || STATUS_STYLES.pending;
                  return (
                    <button
                      key={bill.id}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-center gap-3 ${selected?.id === bill.id ? "bg-muted/60 border-l-2 border-l-primary" : ""}`}
                      onClick={() => setSelected(bill)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{bill.petName}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${s.badge}`}>{s.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{bill.ownerName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(bill.createdAt), "dd MMM yyyy, HH:mm")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatKES(bill.total)}</p>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-1 ml-auto" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice detail */}
        <Card className="flex-1">
          {!selected ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="text-center text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a patient invoice to view details</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="border-b pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selected.petName}</CardTitle>
                    <CardDescription className="mt-0.5">{selected.ownerName}</CardDescription>
                  </div>
                  <Badge variant="outline" className={`text-xs px-2.5 py-1 ${STATUS_STYLES[selected.status]?.badge}`}>
                    {STATUS_STYLES[selected.status]?.label}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Owner: <span className="text-foreground font-medium">{selected.ownerName || "—"}</span></div>
                  <div className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> Vet: <span className="text-foreground font-medium">{selected.veterinarian || "—"}</span></div>
                  <div className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> Invoice #: <span className="text-foreground font-mono font-medium">{selected.id.slice(-8).toUpperCase()}</span></div>
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Date: <span className="text-foreground font-medium">{format(new Date(selected.createdAt), "dd MMM yyyy")}</span></div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Line items */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Charges</p>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs h-8">Description</TableHead>
                          <TableHead className="text-xs h-8 text-right">Qty</TableHead>
                          <TableHead className="text-xs h-8 text-right">Unit Price</TableHead>
                          <TableHead className="text-xs h-8 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Consultation fee row */}
                        <TableRow>
                          <TableCell className="text-sm py-2.5">
                            <div className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5 text-primary" /> Consultation Fee</div>
                          </TableCell>
                          <TableCell className="text-right text-sm py-2.5">1</TableCell>
                          <TableCell className="text-right text-sm py-2.5">{formatKES(selected.consultationFee)}</TableCell>
                          <TableCell className="text-right text-sm font-medium py-2.5">{formatKES(selected.consultationFee)}</TableCell>
                        </TableRow>
                        {/* Treatment / prescription items */}
                        {(selected.items || []).map((item, idx) => {
                          const qty = item.quantity || 1;
                          const unit = item.unitPrice || item.price || 0;
                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-sm py-2.5">
                                <div className="flex items-center gap-1.5"><Pill className="h-3.5 w-3.5 text-purple-500" /> {item.name}</div>
                              </TableCell>
                              <TableCell className="text-right text-sm py-2.5">{qty}</TableCell>
                              <TableCell className="text-right text-sm py-2.5">{formatKES(unit)}</TableCell>
                              <TableCell className="text-right text-sm font-medium py-2.5">{formatKES(unit * qty)}</TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Totals */}
                        <TableRow className="bg-muted/20 font-semibold border-t-2">
                          <TableCell colSpan={3} className="text-sm py-3 text-right pr-4">Total Due</TableCell>
                          <TableCell className="text-right text-base font-bold py-3 text-primary">{formatKES(selected.total)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {selected.status === "paid" && selected.paidAt && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                    <CheckCircle className="h-4 w-4" />
                    Paid on {format(new Date(selected.paidAt), "dd MMM yyyy, HH:mm")}
                  </div>
                )}

                {selected.status === "pending" && (
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => openMpesa(selected)}>
                      <Phone className="h-4 w-4 mr-2" /> Pay via M-Pesa
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => markPaid(selected)}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Mark as Paid (Cash)
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* M-Pesa dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>M-Pesa Payment</DialogTitle>
            <DialogDescription>Enter phone number to send STK push for {formatKES(selected?.total ?? 0)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2547XXXXXXXX" />
            {payStatus === "waiting" && <p className="text-sm text-muted-foreground animate-pulse">⏳ Waiting for customer PIN...</p>}
            {payStatus === "success" && <p className="text-sm text-emerald-600 font-semibold">✓ Payment successful!</p>}
            {payStatus === "idle" && (
              <Button className="w-full" onClick={handleMpesa}>
                <Phone className="h-4 w-4 mr-2" /> Send STK Push
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </UnderDevelopment>
  );
}
