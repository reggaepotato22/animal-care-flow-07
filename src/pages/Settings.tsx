import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";

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

  const accessibleSettings = settingsCategories.filter(
    (category) => !category.permission || has(category.permission as any)
  );

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
