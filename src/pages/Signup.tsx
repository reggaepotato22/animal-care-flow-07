import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Info, Building2, UserCircle } from "lucide-react";

interface StaffMember {
  name: string;
  role: "doctor" | "receptionist" | "admin";
  email: string;
}

export default function Signup() {
  const [clinicName, setClinicName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"doctor" | "receptionist" | "admin">("doctor");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAddStaff = () => {
    if (!newStaffName.trim()) return;
    setStaff([...staff, { name: newStaffName, role: newStaffRole, email: newStaffEmail }]);
    setNewStaffName("");
    setNewStaffEmail("");
  };

  const removeStaff = (index: number) => {
    setStaff(staff.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      if (!clinicName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
        setError("Please fill in all required fields");
        return;
      }
      setStep(2);
      return;
    }

    // Save clinic and staff data
    const clinicData = {
      name: clinicName,
      adminEmail,
      staff,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("vetcare_clinic_data", JSON.stringify(clinicData));
    localStorage.setItem("vetcare_staff", JSON.stringify(staff));

    // Auto login with the created account
    const success = await login(adminEmail, adminPassword);
    if (success) {
      navigate("/", { replace: true });
    } else {
      setError("Account created but login failed. Please try logging in.");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              <Info className="h-3 w-3 mr-1" />
              Demo Application
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {step === 1 ? "Create Demo Account" : "Add Staff Members"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Set up your demo clinic account" 
              : "Add doctors and receptionists to your clinic"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clinicName"
                      placeholder="Enter your clinic name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@yourclinic.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Create a password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">Add Staff Members</span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Staff name"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={newStaffRole}
                      onValueChange={(value: "doctor" | "receptionist" | "admin") => setNewStaffRole(value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Email (optional)"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={handleAddStaff}>
                      Add
                    </Button>
                  </div>

                  {staff.length > 0 && (
                    <div className="border rounded-md p-3 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Added Staff ({staff.length})
                      </p>
                      {staff.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted/50 rounded-md p-2"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant={member.role === "doctor" ? "default" : "secondary"}>
                              {member.role}
                            </Badge>
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStaff(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
