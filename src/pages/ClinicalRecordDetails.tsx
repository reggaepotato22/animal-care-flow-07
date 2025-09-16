import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Stethoscope, Paperclip, FileText, Pill, Heart, FlaskConical, TestTube, Clock } from "lucide-react";
import { LabOrderDialog } from "@/components/LabOrderDialog";

// Mock data - in a real app this would come from an API
const mockRecord = {
  id: "1",
  patientName: "Sarah Johnson",
  petName: "Max",
  species: "Dog (Golden Retriever)",
  age: "3 years",
  weight: "28 kg",
  date: "2024-01-20",
  veterinarian: "Dr. Smith",
  complaint: "Limping on left front leg",
  diagnosis: "Mild sprain in left forelimb",
  treatment: "Rest, anti-inflammatory medication",
  status: "ongoing" as const,
  attachments: 2,
  soap: {
    subjective: "Owner reports that Max has been limping on his left front leg for the past 2 days. The limping is more pronounced after exercise and seems to improve with rest. No visible wounds or swelling noticed by owner. Max is still eating and drinking normally, with good energy levels overall.",
    objective: "Physical examination reveals mild lameness in left forelimb. Palpation shows slight tenderness in the carpal joint area. No swelling or heat detected. Range of motion is slightly reduced compared to right limb. Temperature: 38.5°C, Heart rate: 90 bpm, Respiratory rate: 24 breaths/min. All other systems appear normal.",
    assessment: "Based on clinical examination and history, diagnosis is mild sprain/strain of the left carpal joint, likely due to overexertion during play or exercise. No evidence of fracture or severe ligament damage.",
    plan: "1. Rest and restricted activity for 7-10 days\n2. Carprofen 25mg twice daily for 5 days (anti-inflammatory)\n3. Cold compress 10-15 minutes twice daily for first 48 hours\n4. Recheck appointment in 1 week\n5. If no improvement or worsening, consider radiographs"
  },
  medications: [
    { name: "Carprofen", dosage: "25mg", frequency: "Twice daily", duration: "5 days" },
    { name: "Rest", dosage: "Complete", frequency: "Continuous", duration: "7-10 days" }
  ],
  vitals: {
    temperature: "38.5°C",
    heartRate: "90 bpm",
    respiratoryRate: "24 breaths/min",
    weight: "28 kg"
  },
  labRequests: [
    {
      id: "LAB-001",
      orderDate: "2024-01-20",
      tests: ["Complete Blood Count", "Inflammation Markers"],
      priority: "Normal",
      status: "completed",
      results: "Normal values within range"
    },
    {
      id: "LAB-002", 
      orderDate: "2024-01-20",
      tests: ["Joint X-Ray Left Forelimb"],
      priority: "Urgent",
      status: "pending",
      results: null
    }
  ]
};

export default function ClinicalRecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "follow-up": return "bg-info/10 text-info border-info/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/records")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Records
        </Button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{mockRecord.petName} - Clinical Record</h1>
          <p className="text-muted-foreground flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {mockRecord.patientName}
            </span>
            <span>{mockRecord.species}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(mockRecord.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              {mockRecord.veterinarian}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LabOrderDialog 
            prefillData={{
              patientId: mockRecord.id,
              veterinarian: mockRecord.veterinarian,
              diagnosis: mockRecord.diagnosis
            }}
          >
            <Button variant="default" size="sm" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Lab Request
            </Button>
          </LabOrderDialog>
          
          <Badge className={getStatusColor(mockRecord.status)}>
            {mockRecord.status}
          </Badge>
        </div>
      </div>

      {/* Patient Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Patient Summary
              </CardTitle>
              <CardDescription>Basic patient information and visit overview</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Age</p>
              <p className="text-muted-foreground">{mockRecord.age}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Weight</p>
              <p className="text-muted-foreground">{mockRecord.weight}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Chief Complaint</p>
              <p className="text-muted-foreground">{mockRecord.complaint}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Diagnosis</p>
              <p className="text-muted-foreground">{mockRecord.diagnosis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <div className="grid gap-6">
        {/* SOAP Notes Section - Full Width */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            SOAP Notes
          </h2>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subjective</CardTitle>
                <CardDescription>Owner's concerns and observations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{mockRecord.soap.subjective}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objective</CardTitle>
                <CardDescription>Physical examination findings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{mockRecord.soap.objective}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment</CardTitle>
                <CardDescription>Clinical diagnosis and interpretation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{mockRecord.soap.assessment}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan</CardTitle>
                <CardDescription>Treatment plan and follow-up instructions</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{mockRecord.soap.plan}</pre>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lab Requests & Reports Section - Full Width */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Lab Requests & Reports
          </h2>
          <Card>
            <CardHeader>
              <CardDescription>Laboratory tests and diagnostic reports requested during this encounter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecord.labRequests.map((labRequest) => (
                  <div key={labRequest.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{labRequest.id}</span>
                        <Badge 
                          variant={labRequest.priority === "Urgent" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {labRequest.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(labRequest.orderDate).toLocaleDateString()}
                        </span>
                        <Badge 
                          className={`text-xs ${
                            labRequest.status === "completed" 
                              ? "bg-success/10 text-success border-success/20"
                              : labRequest.status === "pending"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-muted/10 text-muted-foreground border-muted/20"
                          }`}
                        >
                          {labRequest.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Tests Ordered:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {labRequest.tests.map((test, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {test}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {labRequest.results && (
                        <div>
                          <p className="text-sm font-medium">Results:</p>
                          <p className="text-sm text-muted-foreground mt-1">{labRequest.results}</p>
                        </div>
                      )}
                      
                      {labRequest.status === "pending" && (
                        <div className="pt-2">
                          <p className="text-sm text-muted-foreground italic">Results pending...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other Sections - Flexible Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vitals & Measurements Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Vital Signs & Measurements
            </h2>
            <Card>
              <CardHeader>
                <CardDescription>Physical measurements taken during examination</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-xl font-bold text-primary">{mockRecord.vitals.temperature}</p>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-xl font-bold text-primary">{mockRecord.vitals.heartRate}</p>
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-xl font-bold text-primary">{mockRecord.vitals.respiratoryRate}</p>
                    <p className="text-xs text-muted-foreground">Respiratory Rate</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-xl font-bold text-primary">{mockRecord.vitals.weight}</p>
                    <p className="text-xs text-muted-foreground">Weight</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medications Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Medications & Treatment
            </h2>
            <Card>
              <CardHeader>
                <CardDescription>Current medications and treatment instructions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecord.medications.map((med, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{med.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {med.dosage} - {med.frequency}
                        </p>
                        <Badge variant="outline" className="text-xs">{med.duration}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attachments Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              Attachments & Documents
            </h2>
            <Card>
              <CardHeader>
                <CardDescription>Related files, images, and diagnostic results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">X-ray_Left_Forelimb.jpg</p>
                      <p className="text-xs text-muted-foreground">Uploaded on {mockRecord.date}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">View</Button>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">Lab_Results_Complete_Blood_Count.pdf</p>
                      <p className="text-xs text-muted-foreground">Uploaded on {mockRecord.date}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">View</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}