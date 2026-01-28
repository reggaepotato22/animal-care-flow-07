import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Bell,
  Mail,
  MessageSquare,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type NotificationStatus = "scheduled" | "sent" | "failed" | "cancelled";
type NotificationChannel = "sms" | "email";
type NotificationCategory = "appointment" | "vaccine" | "lab" | "follow-up";

type NotificationItem = {
  id: string;
  recipient: string;
  petName: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduledAt: string;
  deliveredAt?: string;
  templateName: string;
  subject: string;
  message: string;
  error?: string;
};

const mockNotifications: NotificationItem[] = [
  {
    id: "ntf-1",
    recipient: "Sarah Johnson",
    petName: "Max",
    category: "appointment",
    channel: "sms",
    status: "scheduled",
    scheduledAt: "2024-02-15T09:00:00",
    templateName: "Appointment Confirmation - SMS",
    subject: "Appointment reminder",
    message: "Reminder: Max has a checkup tomorrow at 9:00 AM. Reply YES to confirm.",
  },
  {
    id: "ntf-2",
    recipient: "Michael Chen",
    petName: "Whiskers",
    category: "vaccine",
    channel: "email",
    status: "sent",
    scheduledAt: "2024-02-10T13:30:00",
    deliveredAt: "2024-02-10T13:30:12",
    templateName: "Vaccine Due - Email",
    subject: "Vaccine due soon",
    message: "Whiskers is due for FVRCP on 2024-06-15. Please schedule a visit.",
  },
  {
    id: "ntf-3",
    recipient: "Emily Rodriguez",
    petName: "Luna",
    category: "lab",
    channel: "sms",
    status: "failed",
    scheduledAt: "2024-02-12T15:00:00",
    templateName: "Lab Results Ready - SMS",
    subject: "Lab results ready",
    message: "Luna’s lab results are ready. Please contact the clinic for details.",
    error: "Carrier rejected: invalid phone number",
  },
  {
    id: "ntf-4",
    recipient: "David Thompson",
    petName: "Rocky",
    category: "follow-up",
    channel: "email",
    status: "sent",
    scheduledAt: "2024-02-05T11:45:00",
    deliveredAt: "2024-02-05T11:45:08",
    templateName: "Follow-up Reminder - Email",
    subject: "Follow-up reminder",
    message: "Rocky is due for a follow-up on 2024-02-20. Schedule online or call us.",
  },
  {
    id: "ntf-5",
    recipient: "Lisa Anderson",
    petName: "Charlie",
    category: "appointment",
    channel: "sms",
    status: "cancelled",
    scheduledAt: "2024-02-14T10:00:00",
    templateName: "Appointment Reminder - SMS",
    subject: "Appointment reminder",
    message: "Reminder: Charlie has an appointment tomorrow at 10:00 AM.",
  },
];

const categoryLabels: Record<NotificationCategory, string> = {
  appointment: "Appointment",
  vaccine: "Vaccine",
  lab: "Lab",
  "follow-up": "Follow-up",
};

const statusBadge = (status: NotificationStatus) => {
  switch (status) {
    case "sent":
      return "bg-success/10 text-success border-success/20";
    case "scheduled":
      return "bg-primary/10 text-primary border-primary/20";
    case "failed":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted/10 text-muted-foreground border-muted/20";
  }
};

const statusIcon = (status: NotificationStatus) => {
  switch (status) {
    case "sent":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "scheduled":
      return <Clock className="h-4 w-4 text-primary" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function Notifications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | "all">("all");
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const filtered = useMemo(() => {
    return mockNotifications.filter((item) => {
      const matchesSearch =
        item.recipient.toLowerCase().includes(search.toLowerCase()) ||
        item.petName.toLowerCase().includes(search.toLowerCase()) ||
        item.subject.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesChannel = channelFilter === "all" || item.channel === channelFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesChannel && matchesCategory;
    });
  }, [search, statusFilter, channelFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications Center</h1>
          <p className="text-muted-foreground">
            Log of all system notifications sent to clients from bookings, reminders, lab updates, and other events.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          System generated
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          This center keeps a read-only log. Notification content is derived from templates.
        </div>
        <Button variant="outline" onClick={() => window.location.assign("/notifications/templates")}>
          Manage Templates
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter notification activity</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipient, pet, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
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
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Activity</CardTitle>
          <CardDescription>{filtered.length} notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.recipient}</p>
                      <p className="text-xs text-muted-foreground">{item.petName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[item.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      {item.channel === "sms" ? (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                      {item.channel.toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadge(item.status)}>
                      <span className="flex items-center gap-1">
                        {statusIcon(item.status)}
                        {item.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(item.scheduledAt), "PP p")}</TableCell>
                  <TableCell className="text-sm">
                    {item.deliveredAt ? format(new Date(item.deliveredAt), "PP p") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No notifications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.subject}</SheetTitle>
                <SheetDescription>
                  {selected.recipient} • {selected.petName}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{categoryLabels[selected.category]}</Badge>
                  <Badge className={statusBadge(selected.status)}>{selected.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Template: {selected.templateName}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Scheduled: {format(new Date(selected.scheduledAt), "PP p")}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {selected.channel === "sms" ? (
                      <MessageSquare className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Channel: {selected.channel.toUpperCase()}
                  </div>
                  {selected.deliveredAt && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      Delivered: {format(new Date(selected.deliveredAt), "PP p")}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Message</p>
                  <Textarea value={selected.message} readOnly className="min-h-[120px]" />
                </div>
                {selected.error && (
                  <div className="border border-destructive/20 bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                    {selected.error}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
