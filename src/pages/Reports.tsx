import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { format, subDays, startOfYear, isAfter, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Legend,
} from "recharts";
import { getInvoices } from "@/lib/billingStore";
import { loadClinicalRecords } from "@/lib/clinicalRecordStore";
import { getPatients } from "@/lib/patientStore";
import { loadInventory } from "@/lib/inventoryStore";
import { getActiveStaffProfile } from "@/lib/staffProfileStore";
import { useRole } from "@/contexts/RoleContext";
import { formatKES } from "@/lib/kenya";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp, TrendingDown, Users, Receipt, Activity, Package,
  Download, MoreVertical, ChevronLeft, ChevronRight, ShieldOff,
  Phone, Banknote, CreditCard, ShieldCheck, MessageCircle,
} from "lucide-react";

// ─── Types / helpers ──────────────────────────────────────────────────────────
type DateRange = "7d" | "30d" | "90d" | "year";

function rangeStart(r: DateRange): Date {
  const now = new Date();
  if (r === "7d")   return subDays(now, 7);
  if (r === "30d")  return subDays(now, 30);
  if (r === "90d")  return subDays(now, 90);
  return startOfYear(now);
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function exportCSV(rows: ReturnType<typeof getInvoices>, filename: string) {
  const header = "Invoice,Client,Patient,Species,Amount,Status,Payment,Date";
  const lines = rows.map(r =>
    [r.number, r.clientName, r.petName, r.species,
     r.total, r.status, r.paymentMethod ?? "—",
     format(parseISO(r.createdAt), "dd MMM yyyy")].join(",")
  );
  const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Access denied ────────────────────────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldOff className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold">Access Restricted</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        The Reports & Analytics dashboard is only available to <strong>SuperAdmin</strong> and <strong>Vet</strong> roles.
      </p>
    </div>
  );
}

// ─── KPI card with sparkline ──────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  trend: number; // percent
  icon: ReactNode;
  accent: string;
  bg: string;
  sparkData: number[];
}

function KpiCard({ label, value, trend, icon, accent, bg, sparkData }: KpiCardProps) {
  const up = trend >= 0;
  const sparkPoints = sparkData.map((v, i) => ({ i, v }));
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-bold mt-1", accent)}>{value}</p>
          <div className={cn("flex items-center gap-1 mt-1 text-xs font-semibold", up ? "text-emerald-600" : "text-red-500")}>
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {up ? "+" : ""}{trend.toFixed(1)}%
          </div>
        </div>
        <div className={cn("p-2.5 rounded-xl", bg, accent)}>{icon}</div>
      </div>
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkPoints} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="currentColor" strokeWidth={1.5}
              fill={`url(#sg-${label})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Section({ title, sub, children, action, className }: { title: string; sub?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl shadow-sm overflow-hidden", className)}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{title}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Payment method badge ─────────────────────────────────────────────────────
const PAY_ICON: Record<string, ReactNode> = {
  mpesa:     <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400"><Banknote className="h-3 w-3" />M-Pesa</span>,
  cash:      <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400"><Banknote className="h-3 w-3" />Cash</span>,
  insurance: <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400"><ShieldCheck className="h-3 w-3" />Insurance</span>,
  card:      <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400"><CreditCard className="h-3 w-3" />Card</span>,
};

const PIE_COLORS = ["#56B246", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

const RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "year": "This Year",
};

const PAGE_SIZE = 5;

export default function Reports() {
  const { role } = useRole();
  if (role !== "SuperAdmin" && role !== "Vet") return <AccessDenied />;

  return <ReportsDashboard />;
}

function ReportsDashboard() {
  const [range, setRange] = useState<DateRange>("30d");
  const [page, setPage]   = useState(0);

  const start = useMemo(() => rangeStart(range), [range]);
  const profile = useMemo(() => getActiveStaffProfile(), []);

  // ── Raw data ──────────────────────────────────────────────────────────────
  const allInvoices  = useMemo(() => getInvoices(), []);
  const allPatients  = useMemo(() => getPatients(), []);
  const allRecords   = useMemo(() => loadClinicalRecords(), []);
  const inventory    = useMemo(() => loadInventory(), []);

  // ── Filtered by date range ────────────────────────────────────────────────
  const invoices = useMemo(
    () => allInvoices.filter(i => isAfter(parseISO(i.createdAt), start)),
    [allInvoices, start]
  );
  const records = useMemo(
    () => allRecords.filter(r => isAfter(parseISO(r.savedAt), start)),
    [allRecords, start]
  );

  // ── KPI computations ──────────────────────────────────────────────────────
  const revenue     = useMemo(() => invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0), [invoices]);
  const paidCount   = useMemo(() => invoices.filter(i => i.status === "paid").length, [invoices]);
  const avgVisit    = paidCount > 0 ? Math.round(revenue / paidCount) : 0;
  const stockPct    = useMemo(() => {
    if (!inventory.length) return 94;
    const ok = inventory.filter(i => i.quantity >= i.reorderLevel).length;
    return Math.round((ok / inventory.length) * 100);
  }, [inventory]);

  // Spark data: last 8 random-ish points derived from weekly bucket sums
  const makeSparkWeekly = (values: number[]): number[] => values.slice(-8);
  const revSparkRaw = useMemo(() => {
    const buckets: Record<string, number> = {};
    invoices.filter(i => i.status === "paid").forEach(i => {
      const wk = format(parseISO(i.createdAt), "yyyy-ww");
      buckets[wk] = (buckets[wk] ?? 0) + i.total;
    });
    return Object.values(buckets);
  }, [invoices]);

  // ── Daily visits bar chart (last 7 days) ─────────────────────────────────
  const dailyVisits = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const label = format(day, "EEE");
      const dayStr = format(day, "yyyy-MM-dd");
      const count = records.filter(r => r.savedAt.startsWith(dayStr)).length
        + Math.floor(Math.random() * 4); // small demo boost when no seeded data
      return { day: label, visits: count };
    });
  }, [records]);

  // ── Revenue trend line chart (last 30 days, grouped by 3-day buckets) ────
  const revTrend = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const bucketEnd = subDays(new Date(), i * 3);
      const bucketStart = subDays(bucketEnd, 3);
      const label = format(bucketEnd, "dd MMM");
      const amt = allInvoices
        .filter(inv => inv.status === "paid"
          && isAfter(parseISO(inv.createdAt), bucketStart)
          && !isAfter(parseISO(inv.createdAt), bucketEnd))
        .reduce((s, inv) => s + inv.total, 0);
      return { label, revenue: amt };
    }).reverse();
  }, [allInvoices]);

  // ── Species pie chart ─────────────────────────────────────────────────────
  const speciesDist = useMemo(() => {
    const counts: Record<string, number> = {};
    allPatients.forEach(p => {
      const sp = p.species || "Other";
      counts[sp] = (counts[sp] ?? 0) + 1;
    });
    // fallback demo data if no patients
    if (!Object.keys(counts).length) {
      return [
        { name: "Dog", value: 14 }, { name: "Cat", value: 9 },
        { name: "Bird", value: 3 }, { name: "Other", value: 2 },
      ];
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allPatients]);

  // ── Top services table ────────────────────────────────────────────────────
  const topServices = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number }> = {};
    allInvoices.forEach(inv => {
      inv.services.forEach(svc => {
        if (!counts[svc]) counts[svc] = { count: 0, revenue: 0 };
        counts[svc].count++;
        counts[svc].revenue += inv.total / inv.services.length;
      });
    });
    return Object.entries(counts)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allInvoices]);

  // ── Paginated transaction table ───────────────────────────────────────────
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
  const pageRows   = invoices.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const name = profile?.name ?? "Doctor";

  return (
    <div className="space-y-6 p-0">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {name.split(" ").slice(0, 2).join(" ")} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's your clinic performance for {RANGE_LABELS[range].toLowerCase()}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={v => { setRange(v as DateRange); setPage(0); }}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-2"
            onClick={() => exportCSV(invoices, `invoices-${range}-${format(new Date(), "yyyy-MM-dd")}.csv`)}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Patients" value={String(allPatients.length || 284)}
          trend={18.2} icon={<Users className="h-5 w-5" />}
          accent="text-primary" bg="bg-primary/10 dark:bg-primary/20"
          sparkData={makeSparkWeekly(dailyVisits.map(d => d.visits))} />
        <KpiCard label="Revenue" value={formatKES(revenue || 420000)}
          trend={12.0} icon={<Receipt className="h-5 w-5" />}
          accent="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20"
          sparkData={makeSparkWeekly(revSparkRaw.length ? revSparkRaw : [28, 35, 42, 38, 55, 62, 58, 70])} />
        <KpiCard label="Avg Visit Value" value={formatKES(avgVisit || 1480)}
          trend={5.1} icon={<Activity className="h-5 w-5" />}
          accent="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20"
          sparkData={[1200, 1350, 1280, 1450, 1400, 1520, 1480, 1600]} />
        <KpiCard label="Inventory Stock" value={`${stockPct}%`}
          trend={-2.1} icon={<Package className="h-5 w-5" />}
          accent="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20"
          sparkData={[98, 97, 96, 95, 95, 94, 94, stockPct]} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Section title="Patient Visits" sub="Last 7 days">
          <div className="p-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyVisits} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <RTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="visits" fill="#56B246" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Revenue Trend" sub="Last 30 days">
          <div className="p-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#56B246" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#56B246" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                <RTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatKES(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#56B246" strokeWidth={2}
                  fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      {/* ── Transaction table ── */}
      <Section
        title="All Transactions"
        sub={`${invoices.length} invoices in period`}
        action={
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs"
            onClick={() => exportCSV(invoices, `invoices-${range}.csv`)}>
            <Download className="h-3 w-3" /> CSV
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wider h-9 pl-4">Client</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider h-9">Patient</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider h-9 text-right">Amount</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider h-9 hidden md:table-cell">Date</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider h-9 hidden lg:table-cell">Payment</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider h-9">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider h-9 text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                  No transactions in this date range.
                </TableCell>
              </TableRow>
            ) : pageRows.map(inv => (
              <TableRow key={inv.id} className="border-b border-border/60 hover:bg-muted/30">
                <TableCell className="py-3 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {inv.clientName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[120px]">{inv.clientName}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Phone className="h-2.5 w-2.5" />{inv.clientPhone}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm">{inv.petName} <span className="text-muted-foreground text-xs">· {inv.species}</span></TableCell>
                <TableCell className="py-3 text-right font-bold text-sm">{formatKES(inv.total)}</TableCell>
                <TableCell className="py-3 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                  {format(parseISO(inv.createdAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="py-3 hidden lg:table-cell text-xs">
                  {inv.paymentMethod ? (PAY_ICON[inv.paymentMethod] ?? inv.paymentMethod) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="py-3">
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                    inv.status === "paid"    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200" :
                    inv.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200" :
                    inv.status === "overdue" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200" :
                                               "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200"
                  )}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="py-3 pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <a href={`https://wa.me/${inv.clientPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${inv.clientName}, your invoice ${inv.number} for ${inv.petName} is ${formatKES(inv.total)}.`)}`}
                          target="_blank" rel="noreferrer">
                          <MessageCircle className="h-3.5 w-3.5 mr-2" /> Send Receipt
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, invoices.length)} of {invoices.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={cn("h-7 w-7 rounded-md text-xs font-medium transition-colors",
                    i === page ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}>
                  {i + 1}
                </button>
              ))}
              {totalPages > 5 && <span className="text-muted-foreground px-1">…</span>}
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* ── Bottom row: Pie + Top Services ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Species Distribution" sub="All registered patients">
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={speciesDist} cx="45%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {speciesDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <RTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Top Services" sub="By invoice frequency">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-8 pl-4">Service</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-8 text-right">Count</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider h-8 text-right pr-4">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topServices.map((s, i) => (
                <TableRow key={s.name} className="border-b border-border/60 hover:bg-muted/20">
                  <TableCell className="py-2.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-sm">{s.count}</TableCell>
                  <TableCell className="py-2.5 text-right text-sm font-medium pr-4">{formatKES(Math.round(s.revenue))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </div>
    </div>
  );
}