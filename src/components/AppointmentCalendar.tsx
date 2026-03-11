import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { Clock, User } from "lucide-react";

interface Appointment {
  id: string;
  petName: string;
  ownerName: string;
  date: Date;
  time: string;
  duration: number;
  type: string;
  vet: string;
  status: string;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

export function AppointmentCalendar({ appointments, selectedDate, onDateSelect }: AppointmentCalendarProps) {
  const selectedDateAppointments = selectedDate 
    ? appointments.filter(apt => isSameDay(apt.date, selectedDate))
    : [];

  const appointmentDates = appointments.map(apt => apt.date);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            modifiers={{
              hasAppointment: appointmentDates
            }}
            modifiersStyles={{
              hasAppointment: {
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary))',
                fontWeight: 'bold'
              }
            }}
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate 
              ? `Appointments for ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`
              : 'Select a date to view appointments'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            selectedDateAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No appointments scheduled for this date
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment) => (
                    <div key={appointment.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.time}</span>
                          <span className="text-sm text-muted-foreground">
                            ({appointment.duration} min)
                          </span>
                        </div>
                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.petName}</span>
                        <span className="text-muted-foreground">({appointment.ownerName})</span>
                      </div>
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Type: {appointment.type}</span>
                        <span>Vet: {appointment.vet}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Click on a date in the calendar to view appointments
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}