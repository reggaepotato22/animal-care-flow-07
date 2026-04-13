// ═══════════════════════════════════════════════════════════════════════════
// AuditTrail.tsx — History Hub for SuperAdmin (LSRT-inspired timeline design)
// ═══════════════════════════════════════════════════════════════════════════
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isAfter, parseISO, subDays, startOfYear } from "date-fns";
import {
  Stethoscope, Receipt, MessageSquare, Package, Settings, Search, Download,
  ChevronLeft, ChevronRight, ShieldOff, User, Lock, FileText, Send,
  Activity, Pill, FlaskConical, CreditCard, ClipboardList, Radio,
  ArrowUpRight, ArrowDownRight, Minus, Plus, Trash2, Edit3, CheckCircle2,
  XCircle, Clock, AlertCircle, MoreHorizontal
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { loadClinicalRecords } from "@/lib/clinicalRecordStore";
import { getInvoices } from "@/lib/billingStore";
import { loadInventory } from "@/lib/inventoryStore";
import { getPatients } from "@/lib/patientStore";
import { formatKES } from "@/lib/kenya";
import type { SavedClinicalRecord } from "@/lib/clinicalRecordStore";
import type { Invoice } from "@/lib/billingStore";
import type { InventoryItem } from "@/data/inventory";
import type { PatientRow } from "@/data/patients";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════
type TabType = "clinical" | "financial" | "comms" | "inventory" | "system";
type DateRange = "7d" | "30d" | "90d" | "year" | "all";

interface AuditEvent {
  id: string;
  type: TabType;
  eventType: string;
  actor: string;
  actorRole: string;
  action: string;
  subject: string;
  subjectId?: string;
  subjectType?: string;
  details: string;
  timestamp: string;
  status?: "success" | "pending" | "failed" | "info";
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════
const TAB_CONFIG: Record<TabType, { label: string; icon: typeof Stethoscope; color: string; border: string; bg: string }> = {
  clinical:   { label: "Clinical Actions",   icon: Stethoscope, color: "text-primary",     border: "border-primary",     bg: "bg-primary/10" },
  financial:  { label: "Financial Logs",     icon: Receipt,     color: "text-emerald-600", border: "border-emerald-500", bg: "bg-emerald-50" },
  comms:      { label: "Comms History",      icon: MessageSquare,color: "text-violet-600",  border: "border-violet-500",  bg: "bg-violet-50" },
  inventory:  { label: "Inventory Movements",icon: Package,     color: "text-amber-600",   border: "border-amber-500",   bg: "bg-amber-50" },
  system:     { label: "System Events",      icon: Settings,    color: "text-zinc-600",    border: "border-zinc-500",    bg: "bg-zinc-100" },
};

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin:   "bg-emerald-100 text-emerald-800 border-emerald-200",
  Vet:          "bg-blue-100 text-blue-800 border-blue-200",
  Nurse:        "bg-amber-100 text-amber-800 border-amber-200",
  Receptionist: "bg-sky-100 text-sky-800 border-sky-200",
  Pharmacist:   "bg-purple-100 text-purple-800 border-purple-200",
  System:       "bg-zinc-100 text-zinc-800 border-zinc-200",
};

const PAGE_SIZE = 20;

// ═══════════════════════════════════════════════════════════════════════════
// Access Denied Component
// ═══════════════════════════════════════════════════════════════════════════
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldOff className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold">Access Restricted</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        The History Hub is only available to <strong>SuperAdmin</strong> roles.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════
function rangeStart(r: DateRange): Date | null {
  if (r === "all") return null;
  const now = new Date();
  if (r === "7d")   return subDays(now, 7);
  if (r === "30d")  return subDays(now, 30);
  if (r === "90d")  return subDays(now, 90);
  return startOfYear(now);
}

function parseActionFromRecord(record: SavedClinicalRecord): { action: string; details: string; eventType: string } {
  const data = record.data || {};
  const soap = data.soap as Record<string, string> | undefined;
  
  if (soap?.plan) return { action: "Created SOAP note", details: `Plan: ${soap.plan.slice(0, 60)}...`, eventType: "SOAP_CREATED" };
  if (data.diagnosis) return { action: "Updated diagnosis", details: String(data.diagnosis), eventType: "DIAGNOSIS_UPDATED" };
  if (data.prescriptions) {
    const rx = data.prescriptions as Array<{ name?: string }>;
    return { action: "Prescribed medication", details: `${rx.length} item(s)`, eventType: "RX_PRESCRIBED" };
  }
  if (data.procedures) {
    const proc = data.procedures as Array<{ name?: string }>;
    return { action: "Recorded procedure", details: String(proc[0]?.name ?? "Procedure"), eventType: "PROCEDURE_RECORDED" };
  }
  if (data.vitals) return { action: "Recorded vitals", details: `Temp: ${(data.vitals as Record<string, string>).temperature ?? "N/A"}`, eventType: "VITALS_RECORDED" };
  if (data.discharge) return { action: "Discharged patient", details: String(data.dischargeSummary ?? "Ready for discharge"), eventType: "DISCHARGE" };
  
  return { action: "Updated clinical record", details: "Record modified", eventType: "RECORD_UPDATED" };
}

function parseActionFromInvoice(invoice: Invoice): { action: string; details: string; eventType: string; status: AuditEvent["status"] } {
  const statusMap: Record<string, { action: string; status: AuditEvent["status"] }> = {
    paid:     { action: "Invoice paid", status: "success" },
    pending:  { action: "Invoice created", status: "pending" },
    overdue:  { action: "Invoice overdue", status: "failed" },
    draft:    { action: "Invoice drafted", status: "info" },
  };
  const mapped = statusMap[invoice.status] || { action: "Invoice updated", status: "info" };
  
  let details = formatKES(invoice.total);
  if (invoice.paymentMethod) details += ` • ${invoice.paymentMethod.toUpperCase()}`;
  if (invoice.mpesaTxId) details += ` • M-Pesa: ${invoice.mpesaTxId}`;
  if (invoice.isLocked) details += " • Locked";
  
  return { 
    action: mapped.action, 
    details, 
    eventType: `INVOICE_${invoice.status.toUpperCase()}`,
    status: mapped.status 
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Loaders
// ═══════════════════════════════════════════════════════════════════════════
function loadLiveFeedEvents(): AuditEvent[] {
  try {
    const raw = localStorage.getItem("acf_live_feed");
    if (!raw) return [];
    const events = JSON.parse(raw) as Array<{
      id: string; type: string; actorName: string; actorRole: string;
      payload: Record<string, unknown>; timestamp: string;
    }>;
    
    return events.map(e => ({
      id: e.id,
      type: "system" as TabType,
      eventType: e.type,
      actor: e.actorName || "System",
      actorRole: e.actorRole || "System",
      action: e.type.replace(/_/g, " ").toLowerCase(),
      subject: String(e.payload.patientName || e.payload.invoiceNumber || "System"),
      details: JSON.stringify(e.payload).slice(0, 100),
      timestamp: e.timestamp,
      status: "info",
      metadata: e.payload,
    }));
  } catch { return []; }
}

function loadAllEvents(): AuditEvent[] {
  const events: AuditEvent[] = [];
  
  // Clinical records
  const records = loadClinicalRecords();
  records.forEach(r => {
    const parsed = parseActionFromRecord(r);
    events.push({
      id: `clinical-${r.id}`,
      type: "clinical",
      eventType: parsed.eventType,
      actor: r.veterinarian || "Unknown Vet",
      actorRole: "Vet",
      action: parsed.action,
      subject: r.petName || "Unknown Patient",
      subjectId: r.patientId,
      subjectType: "patient",
      details: parsed.details,
      timestamp: r.savedAt,
      status: "success",
    });
  });
  
  // Financial/invoices
  const invoices = getInvoices();
  invoices.forEach(inv => {
    const parsed = parseActionFromInvoice(inv);
    events.push({
      id: `financial-${inv.id}`,
      type: "financial",
      eventType: parsed.eventType,
      actor: inv.attendingVet || "System",
      actorRole: "Receptionist", // Assuming billing handled by reception
      action: parsed.action,
      subject: `${inv.petName} (${inv.clientName})`,
      subjectId: inv.patientId,
      subjectType: "invoice",
      details: parsed.details,
      timestamp: inv.createdAt,
      status: parsed.status,
      metadata: { invoiceNumber: inv.number, total: inv.total },
    });
  });
  
  // Inventory movements (derived from lastUpdated)
  const inventory = loadInventory();
  inventory.forEach(item => {
    if (item.lastUpdated) {
      events.push({
        id: `inventory-${item.id}-${item.lastUpdated}`,
        type: "inventory",
        eventType: "INVENTORY_UPDATED",
        actor: "System",
        actorRole: "System",
        action: "Stock updated",
        subject: item.name,
        subjectId: item.id,
        subjectType: "inventory",
        details: `Qty: ${item.quantity} ${item.unit} • Reorder: ${item.reorderLevel}`,
        timestamp: item.lastUpdated,
        status: item.quantity < item.reorderLevel ? "failed" : "success",
        metadata: { sku: item.sku, location: item.location },
      });
    }
  });
  
  // System events from live feed
  const systemEvents = loadLiveFeedEvents();
  events.push(...systemEvents);
  
  // Sort by timestamp descending
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Icon Component
// ═══════════════════════════════════════════════════════════════════════════
function EventIcon({ type, eventType }: { type: TabType; eventType: string }) {
  const icons: Record<string, typeof Stethoscope> = {
    SOAP_CREATED: FileText,
    DIAGNOSIS_UPDATED: Stethoscope,
    RX_PRESCRIBED: Pill,
    RX_DISPENSED: Pill,
    PROCEDURE_RECORDED: Activity,
    VITALS_RECORDED: Activity,
    DISCHARGE: CheckCircle2,
    RECORD_UPDATED: Edit3,
    INVOICE_PAID: CreditCard,
    INVOICE_PENDING: Clock,
    INVOICE_OVERDUE: AlertCircle,
    INVOICE_DRAFT: FileText,
    INVENTORY_UPDATED: Package,
    PATIENT_ADMITTED: User,
    PATIENT_DISCHARGED: User,
    LAB_READY: FlaskConical,
    BILLING_LOCKED: Lock,
    FEEDING_DUE: Clock,
    WELLNESS_CHECK: CheckCircle2,
    APPOINTMENT_CONFIRMED: CheckCircle2,
  };
  
  const Icon = icons[eventType] || TAB_CONFIG[type].icon;
  return <Icon className="h-4 w-4" />;
}

// ═══════════════════════════════════════════════════════════════════════════
// Status Badge Component
// ═══════════════════════════════════════════════════════════════════════════
function StatusBadge({ status }: { status?: AuditEvent["status"] }) {
  if (!status) return null;
  
  const styles = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    failed:  "bg-red-100 text-red-800 border-red-200",
    info:    "bg-blue-100 text-blue-800 border-blue-200",
  };
  
  const labels = {
    success: "Completed",
    pending: "Pending",
    failed:  "Failed",
    info:    "Info",
  };
  
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", styles[status])}>
      {labels[status]}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Timeline Item Component
// ═══════════════════════════════════════════════════════════════════════════
function TimelineItem({ event, isLast }: { event: AuditEvent; isLast: boolean }) {
  const config = TAB_CONFIG[event.type];
  const date = parseISO(event.timestamp);
  
  return (
    <div className="flex gap-4 group">
      {/* Left column: Icon + connector */}
      <div className="flex flex-col items-center w-16 shrink-0">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
          config.bg, config.border, config.color,
          "group-hover:scale-110 group-hover:shadow-md"
        )}>
          <EventIcon type={event.type} eventType={event.eventType} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border/60 my-1 group-hover:bg-border transition-colors" />
        )}
      </div>
      
      {/* Right column: Content */}
      <div className="flex-1 pb-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{event.actor}</span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", ROLE_COLORS[event.actorRole] || ROLE_COLORS.System)}>
                  {event.actorRole}
                </Badge>
                <span className="text-muted-foreground text-sm">{event.action}</span>
                {event.subject && (
                  <span className="font-medium text-sm text-primary truncate">
                    {event.subject}
                  </span>
                )}
              </div>
              
              {/* Details */}
              <p className="text-xs text-muted-foreground mt-1.5">{event.details}</p>
              
              {/* Metadata chips */}
              {event.metadata && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {event.metadata.invoiceNumber && (
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded">{String(event.metadata.invoiceNumber)}</span>
                  )}
                  {event.metadata.sku && (
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded">SKU: {String(event.metadata.sku)}</span>
                  )}
                  <StatusBadge status={event.status} />
                </div>
              )}
            </div>
            
            {/* Timestamp */}
            <div className="text-right shrink-0">
              <span 
                className="text-xs text-muted-foreground"
                title={format(date, "PPpp")}
              >
                {formatDistanceToNow(date, { addSuffix: true })}
              </span>
              <p className="text-[10px] text-muted-foreground/60">
                {format(date, "HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Export CSV Function
// ═══════════════════════════════════════════════════════════════════════════
function exportCSV(events: AuditEvent[], filename: string) {
  const header = "Timestamp,Type,Actor,Role,Action,Subject,Details,Status";
  const rows = events.map(e => [
    e.timestamp,
    e.type,
    e.actor,
    e.actorRole,
    e.action,
    e.subject,
    `"${e.details.replace(/"/g, '\\"')}"`,
    e.status || "",
  ].join(","));
  
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
export default function AuditTrail() {
  const { role, has } = useRole();
  const [activeTab, setActiveTab] = useState<TabType>("clinical");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>();
  
  // Role gate
  if (role !== "SuperAdmin") {
    return <AccessDenied />;
  }
  
  // Load all events
  const allEvents = useMemo(() => loadAllEvents(), []);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = allEvents;
    
    // Tab filter
    if (activeTab !== "system") {
      filtered = filtered.filter(e => e.type === activeTab);
    } else {
      filtered = filtered.filter(e => e.type === "system" || e.actorRole === "System");
    }
    
    // Date filter
    const start = rangeStart(dateRange);
    if (start) {
      filtered = filtered.filter(e => isAfter(parseISO(e.timestamp), start));
    }
    if (customDate) {
      filtered = filtered.filter(e => {
        const d = parseISO(e.timestamp);
        return d.getDate() === customDate.getDate() && 
               d.getMonth() === customDate.getMonth() && 
               d.getFullYear() === customDate.getFullYear();
      });
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q)
      );
    }
    
    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(e => e.actorRole === roleFilter);
    }
    
    return filtered;
  }, [allEvents, activeTab, dateRange, customDate, searchQuery, roleFilter]);
  
  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const paginatedEvents = filteredEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  
  // Reset page when filters change
  useEffect(() => { setPage(0); }, [activeTab, dateRange, searchQuery, roleFilter]);
  
  return (
    <div className="space-y-6 p-0">
      {/* Header with ghost watermark */}
      <div className="relative">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">History Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete audit trail of all clinical, financial, and system activities
          </p>
        </div>
        {/* Ghost watermark */}
        <div className="absolute top-0 right-0 text-[8rem] font-black text-muted/5 select-none pointer-events-none leading-none tracking-tighter">
          AUDIT
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-1">
        {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => {
          const config = TAB_CONFIG[tab];
          const Icon = config.icon;
          const isActive = activeTab === tab;
          const count = allEvents.filter(e => 
            tab === "system" 
              ? (e.type === "system" || e.actorRole === "System")
              : e.type === tab
          ).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative",
                isActive 
                  ? cn("text-foreground", config.color) 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {config.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0 rounded-full",
                isActive ? "bg-muted" : "bg-muted/50"
              )}>
                {count}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="tab-underline"
                  className={cn("absolute bottom-0 left-0 right-0 h-0.5", config.bg.replace("/10", "").replace("/50", ""))}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actor, action, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Date range */}
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Custom date picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="h-4 w-4" />
              {customDate ? format(customDate, "MMM dd") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={(d) => { setCustomDate(d); setCalendarOpen(false); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {customDate && (
          <Button variant="ghost" size="sm" onClick={() => setCustomDate(undefined)}>
            Clear date
          </Button>
        )}
        
        {/* Role filter */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
            <SelectItem value="Vet">Vet</SelectItem>
            <SelectItem value="Nurse">Nurse</SelectItem>
            <SelectItem value="Receptionist">Receptionist</SelectItem>
            <SelectItem value="Pharmacist">Pharmacist</SelectItem>
            <SelectItem value="System">System</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex-1" />
        
        {/* Export */}
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => {
            const fname = `audit-trail-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.csv`;
            exportCSV(filteredEvents, fname);
          }}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {/* Results count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {filteredEvents.length > 0 ? page * PAGE_SIZE + 1 : 0}–
          {Math.min((page + 1) * PAGE_SIZE, filteredEvents.length)} of {filteredEvents.length} events
        </span>
        <span className="text-xs text-muted-foreground">
          Tab: {TAB_CONFIG[activeTab].label}
        </span>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {paginatedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No events found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or date range
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            <AnimatePresence mode="popLayout">
              {paginatedEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <TimelineItem 
                    event={event} 
                    isLast={idx === paginatedEvents.length - 1 && page === totalPages - 1} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pageNum = i;
                const isCurrent = pageNum === page;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "h-8 w-8 rounded-md text-sm font-medium transition-colors",
                      isCurrent 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
