import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Settings as SettingsIcon,
  Palette,
  Workflow,
  ChevronRight,
  Shield,
  Users,
  Bell,
  Link,
  FileText,
  Database,
  Stethoscope,
  Printer,
  CreditCard,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { clearCache, clearAllData, resetSamplePatients } from "@/lib/patientStore";

const settingsCategories = [
  {
    id: "generate-link",
    name: "Generate Upload Link",
    description: "Create secure upload links for owners, labs, and specialists",
    icon: Link,
    href: "/generate-link",
    permission: null,
  },
  {
    id: "communications",
    name: "Communications",
    description: "Email templates, SMTP configuration, and branding",
    icon: Mail,
    href: "/settings/communications",
    permission: "can_manage_users",
  },
  {
    id: "appearance",
    name: "Appearance",
    description: "Customize the look and feel of your clinic portal",
    icon: Palette,
    href: "/appearance",
    permission: null,
  },
  {
    id: "workflow",
    name: "Workflow Settings",
    description: "Configure clinical workflows and automation",
    icon: Workflow,
    href: "/workflow-settings",
    permission: null,
  },
  {
    id: "templates",
    name: "Clinical Templates",
    description: "Manage SOAP, procedure, and discharge note templates",
    icon: FileText,
    href: "/settings/templates",
    permission: "can_manage_users",
  },
  {
    id: "billing",
    name: "Billing & Payments",
    description: "Configure pricing, taxes, and payment methods",
    icon: CreditCard,
    href: "/settings/billing",
    permission: "can_manage_users",
  },
  {
    id: "printing",
    name: "Printing & Forms",
    description: "Configure print templates and physical forms",
    icon: Printer,
    href: "/settings/printing",
    permission: null,
  },
  {
    id: "inventory",
    name: "Inventory Settings",
    description: "Manage medications, vaccines, and supplies",
    icon: Database,
    href: "/settings/inventory",
    permission: "can_manage_users",
  },
  {
    id: "diagnostics",
    name: "Lab & Diagnostics",
    description: "Configure lab integrations and test catalogs",
    icon: Stethoscope,
    href: "/settings/diagnostics",
    permission: "can_manage_users",
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Manage notification preferences and templates",
    icon: Bell,
    href: "/admin/notifications",
    permission: "can_manage_users",
  },
  {
    id: "users",
    name: "User Management",
    description: "Manage staff accounts and permissions",
    icon: Users,
    href: "/admin/users",
    permission: "can_manage_users",
  },
  {
    id: "clinic",
    name: "Clinic Settings",
    description: "General clinic configuration and preferences",
    icon: Shield,
    href: "/admin/settings",
    permission: "can_manage_users",
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { has } = useRole();
  const { toast } = useToast();
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const accessibleSettings = settingsCategories.filter(
    (category) => !category.permission || has(category.permission as any)
  );

  const handleClearCache = () => {
    clearCache();
    setClearCacheDialogOpen(false);
    toast({
      title: "Cache Cleared",
      description: "Temporary data has been cleared. Patient records are preserved.",
    });
  };

  const handleClearAllData = () => {
    clearAllData();
    setClearAllDialogOpen(false);
    toast({
      title: "All Data Cleared",
      description: "All application data has been reset. The page will reload.",
      variant: "destructive",
    });
    // Reload after a short delay to reset the app state
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleResetSamplePatients = () => {
    resetSamplePatients();
    toast({
      title: "Sample Patients Reset",
      description: "5 sample patients have been recreated.",
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-teal-600" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your clinic's configuration, communications, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleSettings.map((category) => (
          <Card
            key={category.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(category.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <category.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Management Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-orange-500" />
                Clear Cache
              </CardTitle>
              <CardDescription className="text-xs">
                Remove temporary data while preserving patient records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setClearCacheDialogOpen(true)}
              >
                Clear Cache
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Reset Sample Patients
              </CardTitle>
              <CardDescription className="text-xs">
                Recreate the 5 sample patients with fresh data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResetSamplePatients}
              >
                Reset Patients
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Clear All Data
              </CardTitle>
              <CardDescription className="text-xs">
                Delete all data including patients. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setClearAllDialogOpen(true)}
              >
                Clear Everything
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clear Cache Dialog */}
      <Dialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-orange-500" />
              Clear Cache?
            </DialogTitle>
            <DialogDescription>
              This will clear temporary data like attachments, appointments, and cached data, 
              but will preserve all patient records. You won't lose any clinical data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearCacheDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Data Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Clear All Data?
            </DialogTitle>
            <DialogDescription className="text-red-600/80">
              This will permanently delete ALL data including patients, records, attachments, 
              appointments, and settings. This action cannot be undone. The page will reload 
              after clearing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAllData}>
              Yes, Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {accessibleSettings.length === 0 && (
        <div className="text-center py-12">
          <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">No Settings Available</h3>
          <p className="text-muted-foreground">
            You don't have permission to access any settings.
          </p>
        </div>
      )}
    </div>
  );
}
