import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, registerUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Building2, UserCircle, Eye, EyeOff } from "lucide-react";
import { createAccount, getAccountScopedKey, setActiveAccountId } from "@/lib/accountStore";
import { saveStaff } from "@/lib/staffStore";
import type { Role } from "@/lib/rbac";

const ROLE_OPTIONS: { value: Role; label: string; desc: string }[] = [
  { value: "SuperAdmin",   label: "Super Admin",   desc: "Full system access — manage all users, settings and data" },
  { value: "Vet",          label: "Veterinarian",  desc: "Clinical staff — create records, prescribe, manage consultations" },
  { value: "Nurse",        label: "Nurse / Attendant", desc: "Triage, clinical support and patient assessment" },
  { value: "Receptionist", label: "Receptionist",  desc: "Front-desk — register patients, book appointments, billing" },
  { value: "Pharmacist",   label: "Pharmacist",    desc: "Dispense medication and manage inventory" },
];

interface StaffMember {
  name: string;
  role: "doctor" | "receptionist" | "admin";
  email: string;
}

export default function Signup() {
  const [clinicName, setClinicName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState<Role>("SuperAdmin");
  const [showPassword, setShowPassword] = useState(false);
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
      if (!clinicName.trim() || !adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
        setError("Please fill in all required fields");
        return;
      }
      if (adminPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      setStep(2);
      return;
    }

    const account = createAccount({
      name: clinicName,
      ownerEmail: adminEmail,
      mode: "demo",
    });
    setActiveAccountId(account.id);

    // Store clinic data scoped to this account
    localStorage.setItem(
      getAccountScopedKey("vetcare_clinic_data", account.id),
      JSON.stringify({ accountId: account.id, name: clinicName, adminEmail, createdAt: new Date().toISOString() })
    );

    // Store the admin's role for this account
    localStorage.setItem(
      getAccountScopedKey("acf_role", account.id),
      JSON.stringify(adminRole)
    );

    // Store the profile display name
    localStorage.setItem(
      getAccountScopedKey("acf_profile_name", account.id),
      adminName.trim() || clinicName
    );

    const staffRecords = staff.map((s, i) => ({
      id: `staff-${Date.now()}-${i}`,
      name: s.name,
      email: s.email || "",
      phone: "",
      role: s.role,
      department: s.role === "doctor" ? "Clinical" : "Front Office",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      schedule: "",
      availability: "available",
      avatar: null,
    }));
    saveStaff(staffRecords);

    // Register the admin user with their chosen role
    registerUser({
      id: `user-${Date.now()}`,
      email: adminEmail.trim().toLowerCase(),
      name: adminName.trim() || clinicName,
      password: adminPassword,
      accountId: account.id,
      role: adminRole,
    });

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
          {/* InnoVetPro logo */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <svg width="14" height="18" viewBox="0 0 10 14" fill="none" className="text-primary">
              <path d="M1 5C1 3 2 1 5 1C8 1 9 3 9 5C9 8 7.5 10 5 10C2.5 10 1 8 1 5Z" fill="currentColor" opacity="0.7"/>
              <path d="M1 2L2.5 4M9 2L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M3 11L3 13M7 11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg width="11" height="20" viewBox="0 0 9 16" fill="none" className="text-primary">
              <path d="M2 5C2 3 3 1.5 4.5 1.5C6 1.5 7 3 7 5C7 7.5 6 9 4.5 9C3 9 2 7.5 2 5Z" fill="currentColor" opacity="0.8"/>
              <path d="M2.5 2L2 0.5M6.5 2L7 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M2.5 10L2 13M6.5 10L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg width="18" height="18" viewBox="0 0 13 14" fill="none" className="text-primary">
              <path d="M2 6C2 3.5 3.5 1.5 6.5 1.5C9.5 1.5 11 3.5 11 6C11 9 9 11 6.5 11C4 11 2 9 2 6Z" fill="currentColor"/>
              <path d="M10.5 2L12 1M2.5 3L1 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M3.5 12L3 13.5M9.5 12L10 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-bold text-xl tracking-tight ml-1" style={{ color: "hsl(190,19%,13%)" }}>
              Inno<span className="text-primary">vet</span>Pro
            </span>
          </div>
          {/* Step progress pills */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {[1, 2].map(n => (
              <div
                key={n}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  n <= step ? "w-8 bg-primary" : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>
          <CardTitle className="text-xl font-bold">
            {step === 1 ? "Create Your Clinic Account" : "Add Staff Members"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Set up your clinic with a separate, isolated account"
              : `Step 2 of 2 — ${clinicName} · ${adminName}`}
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
                  <Label htmlFor="clinicName">Clinic Name <span className="text-destructive">*</span></Label>
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
                  <Label htmlFor="adminName">Your Full Name <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminName"
                      placeholder="Dr. Jane Smith"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminRole">Your Role <span className="text-destructive">*</span></Label>
                  <Select value={adminRole} onValueChange={(v) => setAdminRole(v as Role)}>
                    <SelectTrigger id="adminRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          <div>
                            <span className="font-medium">{r.label}</span>
                            <p className="text-xs text-muted-foreground">{r.desc}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="you@yourclinic.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
