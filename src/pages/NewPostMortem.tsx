import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const postMortemSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  examiningVeterinarian: z.string().min(1, "Examining veterinarian is required"),
  dateOfDeath: z.string().min(1, "Date of death is required"),
  timeOfDeath: z.string().min(1, "Time of death is required"),
  bodyCondition: z.enum(["very_poor", "poor", "fair", "good", "excellent"]),
  externalExamination: z.string().min(1, "External examination findings are required"),
  internalExamination: z.string().min(1, "Internal examination findings are required"),
  grossFindings: z.string().min(1, "Gross findings are required"),
  organSystems: z.object({
    cardiovascular: z.boolean(),
    respiratory: z.boolean(),
    gastrointestinal: z.boolean(),
    urogenital: z.boolean(),
    nervous: z.boolean(),
    musculoskeletal: z.boolean(),
    integumentary: z.boolean(),
    endocrine: z.boolean(),
  }),
  organFindings: z.string().optional(),
  samplesCollected: z.string().optional(),
  histopathologyRequested: z.boolean(),
  toxicologyRequested: z.boolean(),
  microbiologyRequested: z.boolean(),
  causeOfDeath: z.string().min(1, "Cause of death is required"),
  mannerOfDeath: z.enum(["natural", "accidental", "euthanasia", "undetermined"]),
  additionalComments: z.string().optional(),
});

type PostMortemFormData = z.infer<typeof postMortemSchema>;

const veterinarians = [
  "Dr. Smith",
  "Dr. Johnson", 
  "Dr. Brown",
  "Dr. Wilson",
  "Dr. Davis",
  "Dr. Thompson",
];

export default function NewPostMortem() {
  const navigate = useNavigate();

  const form = useForm<PostMortemFormData>({
    resolver: zodResolver(postMortemSchema),
    defaultValues: {
      patientId: "",
      examiningVeterinarian: "",
      dateOfDeath: "",
      timeOfDeath: "",
      bodyCondition: "fair",
      externalExamination: "",
      internalExamination: "",
      grossFindings: "",
      organSystems: {
        cardiovascular: false,
        respiratory: false,
        gastrointestinal: false,
        urogenital: false,
        nervous: false,
        musculoskeletal: false,
        integumentary: false,
        endocrine: false,
      },
      organFindings: "",
      samplesCollected: "",
      histopathologyRequested: false,
      toxicologyRequested: false,
      microbiologyRequested: false,
      causeOfDeath: "",
      mannerOfDeath: "natural",
      additionalComments: "",
    },
  });

  const onSubmit = (data: PostMortemFormData) => {
    console.log("Post mortem report data:", data);
    
    const reportId = `PM${Date.now().toString().slice(-6)}`;
    
    toast.success(`Post mortem report ${reportId} created successfully!`);
    navigate("/postmortem");
  };

  const organSystemLabels = {
    cardiovascular: "Cardiovascular System",
    respiratory: "Respiratory System", 
    gastrointestinal: "Gastrointestinal System",
    urogenital: "Urogenital System",
    nervous: "Nervous System",
    musculoskeletal: "Musculoskeletal System",
    integumentary: "Integumentary System",
    endocrine: "Endocrine System",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Post Mortem Examination Report</h1>
          <p className="text-muted-foreground">
            Create a comprehensive post-mortem examination report
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="examiningVeterinarian"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Examining Veterinarian</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select veterinarian" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {veterinarians.map((vet) => (
                            <SelectItem key={vet} value={vet}>
                              {vet}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Condition</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_poor">Very Poor</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfDeath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Death</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeOfDeath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Death</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Examination Findings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Examination Findings</h3>
                
                <FormField
                  control={form.control}
                  name="externalExamination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Examination</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe external examination findings..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internalExamination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Examination</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe internal examination findings..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grossFindings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross Findings</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe gross pathological findings..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Organ Systems Examined */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Organ Systems Examined</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(organSystemLabels).map(([key, label]) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={`organSystems.${key as keyof typeof organSystemLabels}`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">
                              {label}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="organFindings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Organ Findings</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detail specific findings for examined organ systems..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Samples and Additional Testing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Samples & Additional Testing</h3>
                
                <FormField
                  control={form.control}
                  name="samplesCollected"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Samples Collected</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List all samples collected (tissues, fluids, etc.)..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="histopathologyRequested"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Histopathology Requested
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toxicologyRequested"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Toxicology Requested
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="microbiologyRequested"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Microbiology Requested
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Conclusions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Conclusions</h3>
                
                <FormField
                  control={form.control}
                  name="causeOfDeath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cause of Death</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Primary cause of death based on examination findings..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mannerOfDeath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manner of Death</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="natural">Natural</SelectItem>
                          <SelectItem value="accidental">Accidental</SelectItem>
                          <SelectItem value="euthanasia">Euthanasia</SelectItem>
                          <SelectItem value="undetermined">Undetermined</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional observations, recommendations, or comments..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/postmortem")}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Post Mortem Report</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
