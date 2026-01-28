import { useMemo, useState } from "react";
import { Search, Plus, Mail, MessageSquare, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type TemplateChannel = "sms" | "email";
type TemplateCategory = "appointment" | "vaccine" | "lab" | "follow-up" | "general";

type TemplateItem = {
  id: string;
  name: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject: string;
  body: string;
  active: boolean;
  updatedAt: string;
  variables: string[];
};

type TemplateFormState = {
  name: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject: string;
  body: string;
  active: boolean;
  variables: string;
};

const mockTemplates: TemplateItem[] = [
  {
    id: "tpl-1",
    name: "Appointment Confirmation - SMS",
    channel: "sms",
    category: "appointment",
    subject: "Appointment confirmation",
    body: "Hi {ownerName}, {petName} is booked for {appointmentDate} at {appointmentTime}. Reply YES to confirm.",
    active: true,
    updatedAt: "2024-02-10",
    variables: ["ownerName", "petName", "appointmentDate", "appointmentTime"],
  },
  {
    id: "tpl-2",
    name: "Appointment Reminder - Email",
    channel: "email",
    category: "appointment",
    subject: "Appointment reminder for {petName}",
    body: "Hello {ownerName}, this is a reminder for {petName}'s appointment on {appointmentDate} at {appointmentTime}.",
    active: true,
    updatedAt: "2024-02-05",
    variables: ["ownerName", "petName", "appointmentDate", "appointmentTime"],
  },
  {
    id: "tpl-3",
    name: "Vaccine Due - Email",
    channel: "email",
    category: "vaccine",
    subject: "{petName} vaccine due",
    body: "{petName} is due for {vaccineName} on {dueDate}. Schedule a visit at {clinicPhone}.",
    active: true,
    updatedAt: "2024-01-22",
    variables: ["petName", "vaccineName", "dueDate", "clinicPhone"],
  },
  {
    id: "tpl-4",
    name: "Lab Results Ready - SMS",
    channel: "sms",
    category: "lab",
    subject: "Lab results ready",
    body: "Lab results for {petName} are ready. Please call {clinicPhone} to review.",
    active: false,
    updatedAt: "2024-02-01",
    variables: ["petName", "clinicPhone"],
  },
  {
    id: "tpl-5",
    name: "Follow-up Reminder - SMS",
    channel: "sms",
    category: "follow-up",
    subject: "Follow-up reminder",
    body: "{petName} is due for a follow-up on {followUpDate}. Reply YES to schedule.",
    active: true,
    updatedAt: "2024-02-12",
    variables: ["petName", "followUpDate"],
  },
];

const categoryLabels: Record<TemplateCategory, string> = {
  appointment: "Appointment",
  vaccine: "Vaccine",
  lab: "Lab",
  "follow-up": "Follow-up",
  general: "General",
};

export default function NotificationTemplates() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<TemplateChannel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [templates, setTemplates] = useState<TemplateItem[]>(mockTemplates);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TemplateFormState>({
    name: "",
    channel: "sms",
    category: "appointment",
    subject: "",
    body: "",
    active: true,
    variables: "",
  });

  const filtered = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        tpl.name.toLowerCase().includes(search.toLowerCase()) ||
        tpl.subject.toLowerCase().includes(search.toLowerCase());
      const matchesChannel = channelFilter === "all" || tpl.channel === channelFilter;
      const matchesCategory = categoryFilter === "all" || tpl.category === categoryFilter;
      return matchesSearch && matchesChannel && matchesCategory;
    });
  }, [templates, search, channelFilter, categoryFilter]);

  const openEditor = (template?: TemplateItem) => {
    if (template) {
      setEditingId(template.id);
      setFormState({
        name: template.name,
        channel: template.channel,
        category: template.category,
        subject: template.subject,
        body: template.body,
        active: template.active,
        variables: template.variables.join(", "),
      });
    } else {
      setEditingId(null);
      setFormState({
        name: "",
        channel: "sms",
        category: "appointment",
        subject: "",
        body: "",
        active: true,
        variables: "",
      });
    }
    setEditorOpen(true);
  };

  const saveTemplate = () => {
    const variables = formState.variables
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const updatedAt = new Date().toISOString().split("T")[0];

    if (editingId) {
      setTemplates((prev) =>
        prev.map((tpl) =>
          tpl.id === editingId
            ? {
                ...tpl,
                name: formState.name,
                channel: formState.channel,
                category: formState.category,
                subject: formState.subject,
                body: formState.body,
                active: formState.active,
                variables,
                updatedAt,
              }
            : tpl
        )
      );
    } else {
      const newTemplate: TemplateItem = {
        id: `tpl-${Date.now()}`,
        name: formState.name,
        channel: formState.channel,
        category: formState.category,
        subject: formState.subject,
        body: formState.body,
        active: formState.active,
        variables,
        updatedAt,
      };
      setTemplates((prev) => [newTemplate, ...prev]);
    }

    setEditorOpen(false);
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Templates</h1>
          <p className="text-muted-foreground">
            Manage reusable templates for automated and manual notifications.
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => openEditor()}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter templates</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="appointment">Appointment</SelectItem>
              <SelectItem value="vaccine">Vaccine</SelectItem>
              <SelectItem value="lab">Lab</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span>{template.name}</span>
                <Badge variant={template.active ? "default" : "secondary"} className="text-xs">
                  {template.active ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>{template.subject}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                {template.channel === "sms" ? (
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mail className="h-4 w-4 text-muted-foreground" />
                )}
                <Badge variant="outline" className="text-xs">
                  {template.channel.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[template.category]}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-3">
                {template.body}
              </div>
              <div className="flex flex-wrap gap-1">
                {template.variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-[10px]">
                    {`{${variable}}`}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Updated {template.updatedAt}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditor(template)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteTemplate(template.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Template" : "New Template"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Update template content and variables." : "Create a reusable notification template."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Template name</p>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g., Appointment Reminder - SMS"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Channel</p>
                <Select
                  value={formState.channel}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, channel: value as TemplateChannel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Category</p>
                <Select
                  value={formState.category}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, category: value as TemplateCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="vaccine">Vaccine</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Subject</p>
              <Input
                value={formState.subject}
                onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Email subject or short label"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Body</p>
              <Textarea
                value={formState.body}
                onChange={(event) => setFormState((prev) => ({ ...prev, body: event.target.value }))}
                className="min-h-[140px]"
                placeholder="Compose the notification body..."
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Variables (comma separated)</p>
              <Input
                value={formState.variables}
                onChange={(event) => setFormState((prev) => ({ ...prev, variables: event.target.value }))}
                placeholder="ownerName, petName, appointmentDate"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formState.active}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, active: Boolean(checked) }))}
              />
              Active template
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full" onClick={saveTemplate}>
                Save Template
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
