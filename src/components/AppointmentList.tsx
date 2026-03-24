import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Edit, Trash2, Stethoscope, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Appointment {
  id: string;
  petName: string;
  ownerName: string;
  date: Date;
  time: string;
  duration: number;
  type: string;
  vet: string;
  status: "SCHEDULED" | "CONFIRMED" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED";
  patientId?: string;
  notes?: string;
  reason?: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  searchTerm: string;
  onCheckIn?: (appointment: Appointment) => void;
}

export function AppointmentList({ appointments, searchTerm, onCheckIn }: AppointmentListProps) {
  const navigate = useNavigate();
  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.vet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAppointments = filteredAppointments.sort((a, b) => {
    if (a.date.getTime() === b.date.getTime()) {
      return a.time.localeCompare(b.time);
    }
    return a.date.getTime() - b.date.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          All Appointments ({filteredAppointments.length})
        </h2>
      </div>

      {sortedAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No appointments found matching your search.' : 'No appointments scheduled.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedAppointments.map((appointment) => (
            <Card key={appointment.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/appointments/${appointment.id}`)}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{appointment.petName}</CardTitle>
                  <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : appointment.status === 'CHECKED_IN' ? 'outline' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Owner:</span>
                      <span>{appointment.ownerName}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Date:</span>
                      <span>{format(appointment.date, 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Time:</span>
                      <span>{appointment.time} ({appointment.duration} min)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Type:</span>
                      <span className="ml-2">{appointment.type}</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Veterinarian:</span>
                      <span className="ml-2">{appointment.vet}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  {appointment.status !== 'CHECKED_IN' && appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCheckIn) {
                          onCheckIn(appointment);
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Check-in
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}