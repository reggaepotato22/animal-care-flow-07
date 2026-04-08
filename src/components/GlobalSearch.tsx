import { useEffect, useMemo, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { getPatients } from "@/lib/patientStore";
import { getParkedPatients } from "@/lib/parkedPatientsStore";
import { loadStoredAppointments } from "@/lib/appointmentStore";
import { isToday, isTomorrow } from "date-fns";
import {
  Search, User, Stethoscope, FileText, Calendar, Activity,
  PlusCircle, Receipt, Building2, ParkingSquare, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch({ open, onOpenChange, initialQuery = "" }: { open: boolean; onOpenChange: (v: boolean) => void; initialQuery?: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialQuery);
  useEffect(() => setValue(initialQuery), [initialQuery]);

  const q = value.trim().toLowerCase();

  const patientResults = useMemo(() => {
    if (!q) return [];
    return getPatients()
      .filter((p) => `${p.name} ${p.owner} ${p.breed} ${p.patientId} ${p.species}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [q]);

  const ownerResults = useMemo(() => {
    if (!q || q.length < 2) return [];
    const seen = new Set<string>();
    return getPatients()
      .filter((p) => {
        const ownerMatch = (p.owner || "").toLowerCase().includes(q);
        if (!ownerMatch || seen.has(p.owner || "")) return false;
        seen.add(p.owner || "");
        return true;
      })
      .slice(0, 3);
  }, [q]);

  const todayAppts = useMemo(() => {
    if (!q) return [];
    return loadStoredAppointments()
      .filter((a) => {
        const d = new Date(a.date);
        const matchesDate = isToday(d) || isTomorrow(d);
        const matchesSearch = q.length >= 2
          ? `${a.petName} ${a.ownerName} ${a.type}`.toLowerCase().includes(q)
          : true;
        return matchesDate && matchesSearch;
      })
      .slice(0, 4);
  }, [q]);

  const parked = useMemo(() => getParkedPatients(), [open]);

  const quickActions = [
    { label: "New Appointment",  icon: PlusCircle,  to: "/appointments?bookNew=true" },
    { label: "New Patient",      icon: PlusCircle,  to: "/patients/new" },
    { label: "Triage Queue",     icon: Stethoscope, to: "/triage" },
    { label: "Billing",          icon: Receipt,     to: "/billing" },
    { label: "Dashboard",        icon: Activity,    to: "/dashboard" },
    { label: "Patients",         icon: User,        to: "/patients" },
    { label: "Appointments",     icon: Calendar,    to: "/appointments" },
    { label: "Records",          icon: FileText,    to: "/records" },
    { label: "Token Generator",  icon: Building2,   to: "/tokensag" },
  ];

  const filteredActions = q
    ? quickActions.filter((a) => a.label.toLowerCase().includes(q))
    : quickActions;

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={value}
        onValueChange={setValue}
        placeholder="Search patients, owners, appointments… (⌘K)"
      />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>No results found for "{value}".</CommandEmpty>

        {/* Parked patients — always show when not searching */}
        {!q && parked.length > 0 && (
          <CommandGroup heading="Parked Patients — Resume">
            {parked.map((p) => (
              <CommandItem key={p.patientId} onSelect={() => go(p.returnPath)} className="gap-2">
                <ParkingSquare className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{p.patientName}</span>
                {p.species && <span className="text-muted-foreground text-xs">{p.species}</span>}
                {p.draftNote && (
                  <span className="text-muted-foreground text-xs italic truncate max-w-[160px]">
                    "{p.draftNote}"
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Patient results */}
        {patientResults.length > 0 && (
          <CommandGroup heading="Patients">
            {patientResults.map((p) => (
              <CommandItem key={p.id} onSelect={() => go(`/patients/${p.id}`)} className="gap-2">
                <User className="h-4 w-4 shrink-0" />
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground text-xs">{p.species} · {p.breed}</span>
                {p.allergies && p.allergies.length > 0 && (
                  <AlertTriangle className="h-3 w-3 text-destructive shrink-0 ml-auto" aria-label={`Allergies: ${p.allergies.join(", ")}`} />
                )}
              </CommandItem>
            ))}
            {q && (
              <CommandItem onSelect={() => go(`/patients?q=${encodeURIComponent(value)}`)}>
                <Search className="mr-2 h-4 w-4" />
                <span>Search all patients for "<strong>{value}</strong>"</span>
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {/* Owner results */}
        {ownerResults.length > 0 && (
          <CommandGroup heading="Owners">
            {ownerResults.map((p) => (
              <CommandItem key={`owner-${p.id}`} onSelect={() => go(`/patients?q=${encodeURIComponent(p.owner || "")}`)} className="gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{p.owner}</span>
                <span className="text-muted-foreground text-xs">Owner · {p.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Today's / tomorrow's appointments */}
        {todayAppts.length > 0 && (
          <CommandGroup heading="Upcoming Appointments">
            {todayAppts.map((a) => {
              const d = new Date(a.date);
              const label = isToday(d) ? "Today" : "Tomorrow";
              return (
                <CommandItem key={a.id} onSelect={() => go(`/appointments`)} className="gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{a.petName}</span>
                  <span className="text-muted-foreground text-xs">{a.time} · {a.type}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 shrink-0">{label}</Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Quick actions */}
        {filteredActions.length > 0 && (
          <CommandGroup heading="Quick Actions">
            {filteredActions.map((action) => (
              <CommandItem key={action.label} onSelect={() => go(action.to)} className="gap-2">
                <action.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
