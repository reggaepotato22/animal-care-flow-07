import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, AlertTriangle } from "lucide-react";

interface Patient {
  id: string;
  patientId?: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  sex: string;
  color: string;
  microchip: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  allergies: string[];
  behavioralWarnings?: Array<{ text: string; level: "low" | "medium" | "high" }>;
}

interface EditPatientDialogProps {
  patient: Patient;
  children: React.ReactNode;
  onPatientUpdate?: (updatedPatient: Patient) => void;
}

export function EditPatientDialog({ patient, children, onPatientUpdate }: EditPatientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: patient.name,
    species: patient.species,
    breed: patient.breed,
    age: patient.age,
    weight: patient.weight,
    sex: patient.sex,
    color: patient.color,
    microchip: patient.microchip,
    owner: patient.owner,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    allergies: patient.allergies?.join(", ") || "",
    behavioralWarnings: patient.behavioralWarnings || []
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedPatient: Patient = {
      ...patient,
      ...formData,
      allergies: formData.allergies.split(",").map(a => a.trim()).filter(a => a),
      behavioralWarnings: formData.behavioralWarnings
    };

    // In a real app, this would make an API call
    onPatientUpdate?.(updatedPatient);
    
    toast({
      title: "Patient Updated",
      description: `${formData.name}'s information has been successfully updated.`,
    });
    
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pet Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Select value={formData.species} onValueChange={(value) => handleInputChange("species", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                    <SelectItem value="Bird">Bird</SelectItem>
                    <SelectItem value="Rabbit">Rabbit</SelectItem>
                    <SelectItem value="Hamster">Hamster</SelectItem>
                    <SelectItem value="Guinea Pig">Guinea Pig</SelectItem>
                    <SelectItem value="Ferret">Ferret</SelectItem>
                    <SelectItem value="Reptile">Reptile</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => handleInputChange("breed", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="e.g., 3 years, 6 months"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="e.g., 25kg, 4.2kg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Neutered Male">Neutered Male</SelectItem>
                    <SelectItem value="Spayed Female">Spayed Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color/Markings</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microchip">Microchip ID</Label>
                <Input
                  id="microchip"
                  value={formData.microchip}
                  onChange={(e) => handleInputChange("microchip", e.target.value)}
                  placeholder="15-digit microchip number"
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Owner Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner Name</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => handleInputChange("owner", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Alerts & Critical Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alerts &amp; Critical Info
            </h3>
            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange("allergies", e.target.value)}
                placeholder="Enter allergies separated by commas (e.g., Beef, Pollen, Dairy)"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple allergies with commas. Leave empty if none known.
              </p>
            </div>

            {/* Special Handling Warnings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Special Handling Warnings</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Biting, epilepsy, aggression — highlighted in clinical records.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, behavioralWarnings: [...prev.behavioralWarnings, { text: "", level: "medium" as const }] }))}
                  className="shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Warning
                </Button>
              </div>
              {formData.behavioralWarnings.length > 0 && (
                <div className="space-y-2">
                  {formData.behavioralWarnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${w.level === "high" ? "bg-red-500" : w.level === "medium" ? "bg-orange-400" : "bg-blue-400"}`} />
                      <Input
                        value={w.text}
                        onChange={e => {
                          const updated = [...formData.behavioralWarnings];
                          updated[i] = { ...updated[i], text: e.target.value };
                          setFormData(prev => ({ ...prev, behavioralWarnings: updated }));
                        }}
                        placeholder="e.g., bites when in pain"
                        className="flex-1"
                      />
                      <Select
                        value={w.level}
                        onValueChange={val => {
                          const updated = [...formData.behavioralWarnings];
                          updated[i] = { ...updated[i], level: val as "low" | "medium" | "high" };
                          setFormData(prev => ({ ...prev, behavioralWarnings: updated }));
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
                        onClick={() => setFormData(prev => ({ ...prev, behavioralWarnings: prev.behavioralWarnings.filter((_, idx) => idx !== i) }))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Patient
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}