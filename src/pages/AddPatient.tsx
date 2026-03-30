import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useRole } from "@/contexts/RoleContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generatePatientId } from "@/lib/utils";
import { ArrowLeft, Save, Plus, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { commonBreedsKE } from "@/lib/kenya";
import { addPatient } from "@/lib/patientStore";

const patientSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().min(1, "Breed is required"),
  age: z.string().min(1, "Age is required"),
  weight: z.string().min(1, "Weight is required"),
  gender: z.string().min(1, "Gender is required"),
  color: z.string().min(1, "Color is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhone: z.string().min(1, "Owner phone is required"),
  ownerEmail: z.string().email("Valid email is required"),
  ownerAddress: z.string().min(1, "Owner address is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  emergencyPhone: z.string().min(1, "Emergency phone is required"),
  medicalHistory: z.string().optional(),
  surgeries: z.string().optional(),
  chronicConditions: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  vaccinations: z.array(z.string()).default([]),
  behavioralWarnings: z.array(z.object({ text: z.string(), level: z.enum(["low", "medium", "high"]) })).default([]),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function AddPatient() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get("returnTo");
  const { has } = useRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientId] = useState(() => generatePatientId());
  const wf = useWorkflow({ patientId });

  useEffect(() => {
    if (!has("can_register_patients")) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to add patients.",
        variant: "destructive",
      });
      navigate("/patients");
    }
  }, [has, navigate, toast]);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      species: "",
      breed: "",
      age: "",
      weight: "",
      gender: "",
      color: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerAddress: "",
      emergencyContact: "",
      emergencyPhone: "",
      medicalHistory: "",
      surgeries: "",
      chronicConditions: "",
      allergies: [],
      medications: [],
      vaccinations: [],
      behavioralWarnings: [],
    },
  });
  const species = form.watch("species");
  const behavioralWarnings = form.watch("behavioralWarnings");

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Persist to localStorage so BookAppointmentDialog can find this patient
    try {
      const raw = localStorage.getItem("acf_known_patients");
      const existing = raw ? JSON.parse(raw) as Array<Record<string, string>> : [];
      const newEntry = {
        patientId,
        petName:    data.name,
        ownerName:  data.ownerName,
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail,
        species:    data.species,
      };
      if (!existing.find((p) => p.patientId === patientId)) {
        existing.push(newEntry);
      }
      localStorage.setItem("acf_known_patients", JSON.stringify(existing));
    } catch {}

    // Persist full patient record to patientStore so clinical records can read all fields
    try {
      addPatient({
        name: data.name,
        species: data.species,
        breed: data.breed,
        age: data.age,
        weight: data.weight,
        sex: data.gender,
        color: data.color,
        microchip: "",
        owner: data.ownerName,
        phone: data.ownerPhone,
        email: data.ownerEmail,
        address: data.ownerAddress,
        location: "",
        lastVisit: new Date().toISOString().split("T")[0],
        status: "healthy",
        allergies: data.allergies,
        behavioralWarnings: data.behavioralWarnings,
        medications: data.medications.map(m => ({ name: m, dosage: "", prescribed: new Date().toISOString().split("T")[0] })),
      });
    } catch {}

    try {
      const { logChange } = await import("@/lib/audit");
      logChange({
        entityType: "Patient",
        entityId: patientId,
        field: "New Patient",
        previousValue: "",
        newValue: data.name,
        changedBy: "receptionist",
        reason: "Registration",
      });
    } catch {}

    toast({
      title: "Patient Added Successfully",
      description: `${data.name} has been added with ID: ${patientId}. ${
        returnTo === "appointments"
          ? "Returning to appointment booking…"
          : ""
      }`,
    });

    // Set workflow to TRIAGE (Check-in)
    wf.goTo("TRIAGE");

    setIsSubmitting(false);

    // Return to appointment booking if that's where we came from
    if (returnTo === "appointments") {
      // Stamp the ID so the dialog can auto-select this patient immediately
      localStorage.setItem("acf_last_registered_patient", patientId);
      navigate("/appointments?bookNew=true");
    } else {
      navigate("/patients");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/patients")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Patient</h1>
          <p className="text-muted-foreground">
            Add a new animal patient to the system
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient ID Display */}
          <Card className="bg-muted/50 border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patient Identification Number</p>
                  <p className="text-2xl font-bold font-mono text-primary">{patientId}</p>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">Auto-Generated</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pet Information */}
            <Card>
              <CardHeader>
                <CardTitle>Pet Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pet name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dog">Dog</SelectItem>
                          <SelectItem value="cat">Cat</SelectItem>
                          <SelectItem value="bird">Bird</SelectItem>
                          <SelectItem value="rabbit">Rabbit</SelectItem>
                          <SelectItem value="hamster">Hamster</SelectItem>
                          <SelectItem value="reptile">Reptile</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed</FormLabel>
                      {species === "dog" || species === "cat" ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select breed" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(commonBreedsKE[species as "dog" | "cat"] || []).map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input placeholder="Enter breed" {...field} />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3 years" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 28kg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="owner@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 987-6543" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Critical Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alerts &amp; Critical Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any relevant medical history..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="surgeries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surgeries</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter previous surgeries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chronicConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chronic Conditions</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter chronic conditions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Add allergies (e.g., peanuts, dust)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Add medications (e.g., aspirin, insulin)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vaccinations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaccinations</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Add vaccinations (e.g., rabies, DHPP)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Behavioral / Special Handling Warnings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">Special Handling Warnings</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Biting, epilepsy, aggression, anxiety — these will appear as highlighted alerts in clinical records.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = form.getValues("behavioralWarnings");
                      form.setValue("behavioralWarnings", [...current, { text: "", level: "medium" }]);
                    }}
                    className="shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Warning
                  </Button>
                </div>
                {behavioralWarnings.length > 0 && (
                  <div className="space-y-2">
                    {behavioralWarnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-8 rounded-full shrink-0 ${w.level === "high" ? "bg-red-500" : w.level === "medium" ? "bg-orange-400" : "bg-blue-400"}`} />
                        <Input
                          value={w.text}
                          onChange={e => {
                            const updated = [...behavioralWarnings];
                            updated[i] = { ...updated[i], text: e.target.value };
                            form.setValue("behavioralWarnings", updated);
                          }}
                          placeholder="Describe the warning (e.g., bites when in pain)"
                          className="flex-1"
                        />
                        <Select
                          value={w.level}
                          onValueChange={val => {
                            const updated = [...behavioralWarnings];
                            updated[i] = { ...updated[i], level: val as "low" | "medium" | "high" };
                            form.setValue("behavioralWarnings", updated);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">🔵 Low</SelectItem>
                            <SelectItem value="medium">🟠 Medium</SelectItem>
                            <SelectItem value="high">🔴 High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const updated = behavioralWarnings.filter((_, idx) => idx !== i);
                            form.setValue("behavioralWarnings", updated);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/patients")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Adding Patient..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Patient
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
