import { useState, useMemo } from "react";
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, addMonths, subMonths, setHours, setMinutes, isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface Appointment {
  id: string;
  petName: string;
  ownerName: string;
  date: Date;
  time: string;       // HH:mm
  duration?: number;  // kept for compatibility but not displayed
  type: string;
  vet: string;
  status: "SCHEDULED" | "CONFIRMED" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED";
  examRoom?: string;  // kept for compatibility but not displayed
  location?: string;  // kept for compatibility but not displayed
  color?: string;
  patientId?: string;
  notes?: string;
  reason?: string;    // kept for compatibility but not displayed
}

interface MultiColumnCalendarProps {
  appointments: Appointment[];
  resources: Array<{
    id: string;
    name: string;
    type: "doctor" | "exam-room" | "resource";
    color?: string;
  }>;
  timeSlotInterval?: 15 | 30;
  startHour?: number;
  endHour?: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, resourceId: string, time: string) => void;
}

type ViewMode = "day" | "week" | "month";

// ── Helpers ────────────────────────────────────────────────────────────────────

function toTitle(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeVetName(vet: string): string {
  // Handles both "dr-johnson" ID format and "Dr. Johnson" name format
  const s = vet.replace(/-/g, " ").replace(/\./g, "").toLowerCase();
  return s;
}

function vetMatches(aptVet: string, resourceId: string, resourceName: string): boolean {
  const nv = normalizeVetName(aptVet);
  const ni = normalizeVetName(resourceId);
  const nn = normalizeVetName(resourceName);
  return nv === ni || nv === nn || aptVet === resourceId || aptVet === resourceName;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:  "bg-blue-500 hover:bg-blue-600",
  SCHEDULED:  "bg-amber-500 hover:bg-amber-600",
  CANCELLED:  "bg-gray-400 hover:bg-gray-500",
  CHECKED_IN: "bg-emerald-500 hover:bg-emerald-600",
  NO_SHOW:    "bg-orange-500 hover:bg-orange-600",
};

const TYPE_COLORS: Record<string, string> = {
  Checkup:      "bg-blue-500 hover:bg-blue-600",
  Vaccination:  "bg-green-500 hover:bg-green-600",
  Surgery:      "bg-red-500 hover:bg-red-600",
  Emergency:    "bg-orange-500 hover:bg-orange-600",
  "Follow-up":  "bg-purple-500 hover:bg-purple-600",
  Consultation: "bg-teal-500 hover:bg-teal-600",
  Dental:       "bg-pink-500 hover:bg-pink-600",
};

function getApptColor(apt: Appointment): string {
  return TYPE_COLORS[apt.type] || STATUS_COLORS[apt.status] || "bg-slate-500 hover:bg-slate-600";
}

function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${suffix}`;
}

// ── Appointment Detail Popover ────────────────────────────────────────────────

function ApptPopover({
  apt,
  onClose,
  onNavigate,
}: {
  apt: Appointment;
  onClose: () => void;
  onNavigate?: (apt: Appointment) => void;
}) {
  const statusLabel: Record<string, string> = {
    SCHEDULED: "Scheduled", CONFIRMED: "Confirmed",
    CHECKED_IN: "Checked In", NO_SHOW: "No Show", CANCELLED: "Cancelled",
  };
  const statusCls: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-700",
    SCHEDULED: "bg-amber-100 text-amber-700",
    CHECKED_IN: "bg-emerald-100 text-emerald-700",
    NO_SHOW: "bg-orange-100 text-orange-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="w-64 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{apt.petName}</p>
          <p className="text-xs text-muted-foreground">{apt.ownerName}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{format(apt.date, "EEE, MMM d, yyyy")} · {formatTime12h(apt.time)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{toTitle(apt.vet.replace(/-/g, " "))}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{apt.type}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusCls[apt.status] ?? "bg-gray-100 text-gray-500")}>
          {statusLabel[apt.status] ?? apt.status}
        </span>
        {onNavigate && (
          <button
            onClick={() => { onNavigate(apt); onClose(); }}
            className="text-[11px] text-primary underline underline-offset-2 hover:opacity-70"
          >
            View details →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Time-Grid (Day & Week) ────────────────────────────────────────────────────

function TimeGrid({
  dates,
  appointments,
  timeSlots,
  startHour,
  timeSlotInterval,
  onAppointmentClick,
  onTimeSlotClick,
}: {
  dates: Date[];
  appointments: Appointment[];
  timeSlots: string[];
  startHour: number;
  timeSlotInterval: number;
  onAppointmentClick?: (apt: Appointment) => void;
  onTimeSlotClick?: (date: Date, resourceId: string, time: string) => void;
}) {
  const [openAptId, setOpenAptId] = useState<string | null>(null);
  const SLOT_H = 56; // px per slot

  const getStyle = (apt: Appointment) => {
    const [h, m] = apt.time.split(":").map(Number);
    const startMin = h * 60 + m;
    const top = ((startMin - startHour * 60) / timeSlotInterval) * SLOT_H;
    const height = Math.max(((apt.duration ?? 30) / timeSlotInterval) * SLOT_H, SLOT_H * 0.8);
    return { top, height };
  };

  const colCount = dates.length;

  return (
    <div className="overflow-auto max-h-[70vh]">
      {/* Day headers */}
      <div className="sticky top-0 z-10 bg-background border-b grid" style={{ gridTemplateColumns: `64px repeat(${colCount}, 1fr)` }}>
        <div className="border-r" />
        {dates.map((d) => (
          <div
            key={d.toISOString()}
            className={cn(
              "py-2 text-center text-xs font-semibold border-r last:border-r-0",
              isToday(d) && "bg-primary/5 text-primary"
            )}
          >
            <div className="uppercase tracking-wide text-[10px] text-muted-foreground">{format(d, "EEE")}</div>
            <div className={cn(
              "mx-auto mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold",
              isToday(d) && "bg-primary text-primary-foreground"
            )}>
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid body */}
      <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${colCount}, 1fr)` }}>
        {/* Time labels column */}
        <div className="border-r">
          {timeSlots.map((slot, i) => (
            <div key={slot} className="border-b border-border/40 flex items-start justify-end pr-2 text-[10px] text-muted-foreground" style={{ height: SLOT_H }}>
              {i % (60 / timeSlotInterval) === 0 && <span className="-mt-2">{formatTime12h(slot)}</span>}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {dates.map((day) => {
          const dayApts = appointments.filter(a => isSameDay(a.date, day));
          return (
            <div key={day.toISOString()} className="relative border-r last:border-r-0" style={{ height: timeSlots.length * SLOT_H }}>
              {/* Slot backgrounds */}
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="absolute w-full border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                  style={{ height: SLOT_H, top: timeSlots.indexOf(slot) * SLOT_H }}
                  onClick={() => {
                    const [h, m] = slot.split(":").map(Number);
                    onTimeSlotClick?.(setMinutes(setHours(day, h), m), "any", slot);
                  }}
                />
              ))}

              {/* Appointments */}
              {dayApts.map((apt) => {
                const { top, height } = getStyle(apt);
                const color = getApptColor(apt);
                const isOpen = openAptId === apt.id;
                return (
                  <Popover key={apt.id} open={isOpen} onOpenChange={(o) => setOpenAptId(o ? apt.id : null)}>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-white text-[11px] cursor-pointer shadow-sm transition-all z-10 overflow-hidden",
                          color,
                          isOpen && "ring-2 ring-white/60"
                        )}
                        style={{ top: top + 1, height: height - 2 }}
                        onClick={(e) => { e.stopPropagation(); setOpenAptId(isOpen ? null : apt.id); }}
                      >
                        <div className="font-semibold leading-tight truncate">{apt.petName}</div>
                        <div className="opacity-90 truncate">{formatTime12h(apt.time)}</div>
                        <div className="opacity-80 truncate text-[10px]">{toTitle(apt.vet.replace(/-/g, " "))}</div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="p-0 w-64" sideOffset={4}>
                      <ApptPopover apt={apt} onClose={() => setOpenAptId(null)} onNavigate={onAppointmentClick} />
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month Grid ────────────────────────────────────────────────────────────────

function MonthGrid({
  currentDate,
  appointments,
  onAppointmentClick,
  onDayClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick?: (apt: Appointment) => void;
  onDayClick?: (date: Date) => void;
}) {
  const [openAptId, setOpenAptId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = addDays(startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 1 }), 6);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide border-r last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayApts = appointments.filter(a => isSameDay(a.date, day));
          const inMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] border-b border-r last:border-r-0 p-1.5 cursor-pointer hover:bg-muted/20 transition-colors",
                !inMonth && "bg-muted/30 opacity-50"
              )}
              onClick={() => onDayClick?.(day)}
            >
              <div className={cn(
                "h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1",
                isToday(day) && "bg-primary text-primary-foreground",
                !isToday(day) && "text-foreground"
              )}>
                {format(day, "d")}
              </div>

              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map((apt) => {
                  const color = getApptColor(apt);
                  const isOpen = openAptId === apt.id;
                  return (
                    <Popover key={apt.id} open={isOpen} onOpenChange={(o) => setOpenAptId(o ? apt.id : null)}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] text-white font-medium truncate cursor-pointer",
                            color,
                            isOpen && "ring-1 ring-white/60"
                          )}
                          onClick={(e) => { e.stopPropagation(); setOpenAptId(isOpen ? null : apt.id); }}
                        >
                          {formatTime12h(apt.time)} {apt.petName}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent side="right" align="start" className="p-0 w-64" sideOffset={4}>
                        <ApptPopover apt={apt} onClose={() => setOpenAptId(null)} onNavigate={onAppointmentClick} />
                      </PopoverContent>
                    </Popover>
                  );
                })}
                {dayApts.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">+{dayApts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Main Component ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function MultiColumnCalendar({
  appointments,
  resources,
  timeSlotInterval = 30,
  startHour = 8,
  endHour = 18,
  onAppointmentClick,
  onTimeSlotClick,
}: MultiColumnCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  // Only show doctors in the filter
  const doctorResources = useMemo(
    () => resources.filter(r => r.type === "doctor"),
    [resources]
  );

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotInterval) {
        slots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
      }
    }
    return slots;
  }, [startHour, endHour, timeSlotInterval]);

  // Dates shown in current view
  const displayDates = useMemo(() => {
    if (viewMode === "day") return [currentDate];
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    }
    // Month: all days in grid (handled inside MonthGrid)
    return [];
  }, [currentDate, viewMode]);

  // Filter appointments by provider
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedProvider === "all") return true;
      const res = doctorResources.find(r => r.id === selectedProvider || r.name === selectedProvider);
      return res ? vetMatches(apt.vet, res.id, res.name) : apt.vet === selectedProvider;
    });
  }, [appointments, selectedProvider, doctorResources]);

  // Navigation
  const goToPrevious = () => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, -1));
    else if (viewMode === "week") setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subMonths(d, 1));
  };
  const goToNext = () => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, 1));
    else if (viewMode === "week") setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addMonths(d, 1));
  };

  // Date label in nav bar
  const dateLabel = () => {
    if (viewMode === "day") return format(currentDate, "EEEE, MMMM d, yyyy");
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "MMM d")} – ${format(addDays(ws, 6), "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  };

  return (
    <div className="space-y-4">
      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[220px] justify-start font-normal">
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {dateLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => d && setCurrentDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Doctor filter */}
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-[180px] h-9">
              <Stethoscope className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctorResources.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View mode tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ── Calendar Body ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {(viewMode === "day" || viewMode === "week") && (
            <TimeGrid
              dates={displayDates}
              appointments={filteredAppointments}
              timeSlots={timeSlots}
              startHour={startHour}
              timeSlotInterval={timeSlotInterval}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
            />
          )}
          {viewMode === "month" && (
            <MonthGrid
              currentDate={currentDate}
              appointments={filteredAppointments}
              onAppointmentClick={onAppointmentClick}
              onDayClick={(d) => { setCurrentDate(d); setViewMode("day"); }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
