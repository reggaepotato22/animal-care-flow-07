import { useEffect, useMemo, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { getPatients } from "@/lib/patientStore";
import { Search, User, Stethoscope, FileText, Calendar, Activity } from "lucide-react";

export function GlobalSearch({ open, onOpenChange, initialQuery = "" }: { open: boolean; onOpenChange: (v: boolean) => void; initialQuery?: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialQuery);
  useEffect(() => setValue(initialQuery), [initialQuery]);

  const patientResults = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return getPatients()
      .filter((p) => {
        const hay = `${p.name} ${p.owner} ${p.breed} ${p.patientId}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [value]);

  const quickLinks = [
    { label: "Dashboard", icon: Activity, to: "/" },
    { label: "Patients", icon: User, to: "/patients" },
    { label: "Triage", icon: Stethoscope, to: "/triage" },
    { label: "Appointments", icon: Calendar, to: "/appointments" },
    { label: "Records", icon: FileText, to: "/records" },
  ];

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput value={value} onValueChange={setValue} placeholder="Search patients, pages, or actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Links">
          {quickLinks.map((link) => (
            <CommandItem key={link.label} onSelect={() => go(link.to)}>
              <link.icon className="mr-2 h-4 w-4" />
              <span>{link.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Patients">
          {patientResults.map((p) => (
            <CommandItem key={p.id} onSelect={() => go(`/patients/${p.id}`)}>
              <User className="mr-2 h-4 w-4" />
              <span className="mr-2">{p.name}</span>
              <span className="text-muted-foreground text-xs">{p.breed}</span>
            </CommandItem>
          ))}
          {value && (
            <CommandItem onSelect={() => go(`/patients?q=${encodeURIComponent(value)}`)}>
              <Search className="mr-2 h-4 w-4" />
              <span>Search patients for “{value}”</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
