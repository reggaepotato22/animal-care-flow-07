import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parse, setHours, setMinutes, getHours, getMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  time: string; // HH:mm format
  duration: number; // minutes
  type: string;
  vet: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  examRoom?: string;
  location?: string;
  color?: string; // Optional custom color
}

interface MultiColumnCalendarProps {
  appointments: Appointment[];
  resources: Array<{
    id: string;
    name: string;
    type: "doctor" | "exam-room" | "resource";
    color?: string;
  }>;
  timeSlotInterval?: 15 | 30; // minutes
  startHour?: number; // 0-23
  endHour?: number; // 0-23
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, resourceId: string, time: string) => void;
}

type ViewMode = "day" | "week" | "month";

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
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotInterval) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return slots;
  }, [startHour, endHour, timeSlotInterval]);

  // Get dates to display based on view mode
  const displayDates = useMemo(() => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    } else {
      // Month view - show weeks
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: monthEnd });
    }
  }, [currentDate, viewMode]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesProvider = selectedProvider === "all" || apt.vet === selectedProvider;
      const matchesLocation = selectedLocation === "all" || apt.location === selectedLocation;
      const isInDateRange = displayDates.some((date) => isSameDay(apt.date, date));
      return matchesProvider && matchesLocation && isInDateRange;
    });
  }, [appointments, selectedProvider, selectedLocation, displayDates]);


  // Calculate appointment position and height
  const getAppointmentStyle = (appointment: Appointment) => {
    const [hours, minutes] = appointment.time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const slotHeight = 60; // Height of each 30-minute slot in pixels
    const slotDuration = timeSlotInterval;
    const top = (startMinutes - startHour * 60) / slotDuration * slotHeight;
    const height = (appointment.duration / slotDuration) * slotHeight;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // Get appointment color
  const getAppointmentColor = (appointment: Appointment) => {
    if (appointment.color) return appointment.color;

    // Color by status
    const statusColors: Record<string, string> = {
      confirmed: "bg-blue-500",
      pending: "bg-yellow-500",
      cancelled: "bg-gray-400",
      completed: "bg-green-500",
    };

    // Color by type
    const typeColors: Record<string, string> = {
      Checkup: "bg-blue-500",
      Vaccination: "bg-green-500",
      Surgery: "bg-red-500",
      Emergency: "bg-orange-500",
      Followup: "bg-purple-500",
    };

    return typeColors[appointment.type] || statusColors[appointment.status] || "bg-gray-500";
  };

  // Navigation
  const goToPrevious = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get unique providers and locations
  const providers = useMemo(() => {
    const unique = Array.from(new Set(appointments.map((apt) => apt.vet)));
    return unique;
  }, [appointments]);

  const locations = useMemo(() => {
    const unique = Array.from(new Set(appointments.map((apt) => apt.location).filter(Boolean)));
    return unique;
  }, [appointments]);

  // Parse time string to minutes
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Check if appointment overlaps with time slot
  const isAppointmentInSlot = (appointment: Appointment, slotTime: string) => {
    const slotMinutes = timeToMinutes(slotTime);
    const aptStartMinutes = timeToMinutes(appointment.time);
    const aptEndMinutes = aptStartMinutes + appointment.duration;
    return slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {viewMode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
                {viewMode === "week" && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "MMM d, yyyy")}`}
                {viewMode === "month" && format(currentDate, "MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {locations.length > 0 && (
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header with dates/resources */}
              <div className="border-b sticky top-0 bg-background z-10">
                <div className="grid" style={{ gridTemplateColumns: `120px repeat(${resources.length}, minmax(200px, 1fr))` }}>
                  {/* Time column header */}
                  <div className="border-r p-2 font-medium text-sm bg-muted/50"></div>
                  {/* Resource headers */}
                  {resources.map((resource) => (
                    <div key={resource.id} className="border-r p-2 text-center font-medium text-sm bg-muted/50 last:border-r-0">
                      <div className="flex flex-col items-center gap-1">
                        <span>{resource.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{resource.type.replace("-", " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time slots and appointments */}
              <div className="relative" style={{ minHeight: `${timeSlots.length * 60}px` }}>
                {/* Render time slot grid */}
                {timeSlots.map((slotTime, slotIndex) => (
                  <div
                    key={slotTime}
                    className="grid border-b border-border/50"
                    style={{ gridTemplateColumns: `120px repeat(${resources.length}, minmax(200px, 1fr))`, height: "60px" }}
                  >
                    {/* Time label */}
                    <div className="border-r p-1 text-xs text-muted-foreground bg-muted/30">
                      {slotIndex % (60 / timeSlotInterval) === 0 && (
                        <div className="font-medium">{slotTime}</div>
                      )}
                    </div>

                    {/* Resource columns - empty cells for grid structure */}
                    {resources.map((resource) => (
                      <div
                        key={`${resource.id}-${slotTime}`}
                        className="border-r last:border-r-0 hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => {
                          const [hours, minutes] = slotTime.split(":").map(Number);
                          const slotDate = setMinutes(setHours(currentDate, hours), minutes);
                          onTimeSlotClick?.(slotDate, resource.id, slotTime);
                        }}
                      />
                    ))}
                  </div>
                ))}

                {/* Render appointments absolutely positioned */}
                {resources.map((resource, resourceIndex) => {
                  // Get appointments for this resource and date
                  const resourceAppointments = filteredAppointments.filter((apt) => {
                    const matchesResource = apt.vet === resource.id || apt.examRoom === resource.id;
                    const matchesDate = displayDates.some((date) => isSameDay(apt.date, date));
                    return matchesResource && matchesDate;
                  });

                  return resourceAppointments.map((appointment) => {
                    const style = getAppointmentStyle(appointment);
                    const color = getAppointmentColor(appointment);
                    const columnWidth = `calc((100% - 120px) / ${resources.length})`;
                    const leftOffset = `calc(120px + ${resourceIndex} * ${columnWidth})`;

                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          "absolute rounded-md p-1.5 text-white text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow z-20",
                          color
                        )}
                        style={{
                          ...style,
                          left: leftOffset,
                          width: `calc(${columnWidth} - 8px)`,
                          marginLeft: "4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(appointment);
                        }}
                      >
                        <div className="font-medium truncate">{appointment.petName}</div>
                        <div className="text-xs opacity-90 truncate">{appointment.ownerName}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{appointment.time} ({appointment.duration}m)</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs h-4 px-1">
                            {appointment.type}
                          </Badge>
                          <Badge
                            variant={appointment.status === "confirmed" ? "default" : "secondary"}
                            className="text-xs h-4 px-1"
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

