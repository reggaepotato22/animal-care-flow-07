import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stethoscope, Pill, Activity, AlertTriangle, FileText, Clock } from "lucide-react";

type Event = {
  date: string;
  type: "Visit" | "Injection" | "Lab" | "Surgery" | "Follow-up" | "Emergency";
  title: string;
  detail: string;
  status: "completed" | "active" | "pending";
};

const mockTimeline: Record<string, Event[]> = {
  "1": [
    { date: "2024-01-15 10:30", type: "Visit", title: "Annual Checkup", detail: "Vitals normal", status: "completed" },
    { date: "2023-12-20 14:15", type: "Injection", title: "Rabies Booster", detail: "No reaction", status: "completed" },
    { date: "2023-11-15 09:00", type: "Lab", title: "CBC Panel", detail: "Within range", status: "completed" },
    { date: "2023-08-10 09:00", type: "Surgery", title: "Dental Cleaning", detail: "Two extractions", status: "completed" },
  ],
};

function icon(type: Event["type"]) {
  switch (type) {
    case "Visit": return <Stethoscope className="h-4 w-4" />;
    case "Injection": return <Pill className="h-4 w-4" />;
    case "Lab": return <Activity className="h-4 w-4" />;
    case "Surgery": return <FileText className="h-4 w-4" />;
    case "Follow-up": return <Clock className="h-4 w-4" />;
    case "Emergency": return <AlertTriangle className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

export default function PatientJourney() {
  const { id } = useParams();
  const navigate = useNavigate();
  const events = mockTimeline[id || "1"] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Patient Journey</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {events.map((e, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-primary" />
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {icon(e.type)}
                        <span className="font-semibold">{e.title}</span>
                        <Badge variant="outline" className="text-xs">{e.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{e.date}</div>
                      <div className="text-sm">{e.detail}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {e.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-sm text-muted-foreground">No events recorded</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

