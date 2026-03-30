import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  TestTube, 
  FileText, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EncounterItem {
  id: string;
  type: string;
  title: string;
  status: string;
  timestamp: string;
  details?: any;
}

interface EncounterSidebarProps {
  encounterItems?: EncounterItem[];
  onItemClick?: (item: EncounterItem) => void;
}

// Mock encounter items (cleared)
const mockEncounterItems: EncounterItem[] = [];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3" />;
    case "in-progress":
      return <AlertCircle className="h-3 w-3 animate-pulse" />;
    case "completed":
      return <CheckCircle className="h-3 w-3" />;
    case "cancelled":
      return <XCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "in-progress":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "completed":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "lab":
      return <TestTube className="h-4 w-4" />;
    case "imaging":
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export function EncounterSidebar({ 
  encounterItems = mockEncounterItems, 
  onItemClick 
}: EncounterSidebarProps) {
  const [open, setOpen] = useState(false);

  const pendingItems = encounterItems.filter(item => item.status === "pending");
  const inProgressItems = encounterItems.filter(item => item.status === "in-progress");
  const completedItems = encounterItems.filter(item => item.status === "completed");
  const activeCount = pendingItems.length + inProgressItems.length;

  const ItemCard = ({ item, faded = false }: { item: EncounterItem; faded?: boolean }) => (
    <Card
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors", faded && "opacity-70")}
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            <span className="text-xs font-medium">{item.title}</span>
          </div>
          {getStatusIcon(item.status)}
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-xs", getStatusColor(item.status))}>
            {item.status.replace("-", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
        </div>
        {item.details?.estimatedTime && (
          <p className="text-xs text-muted-foreground mt-1">Est. {item.details.estimatedTime}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Floating Action Button — fixed bottom-right, above the bottom footer */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-14 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open Encounter Progress"
      >
        <Activity className="h-4 w-4" />
        <span className="text-xs font-semibold">Encounter Progress</span>
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
            {activeCount}
          </span>
        )}
      </button>

      {/* Sheet Drawer — slides in from right, never blocks scrolling when closed */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <SheetTitle className="text-sm">Encounter Progress</SheetTitle>
            </div>
            <SheetDescription className="text-xs">
              Items being processed for this visit
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">

              {inProgressItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">In Progress</h4>
                  {inProgressItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              )}

              {pendingItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Pending</h4>
                  {pendingItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              )}

              {completedItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Completed</h4>
                  {completedItems.map(item => <ItemCard key={item.id} item={item} faded />)}
                </div>
              )}

              {encounterItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No items in progress</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Items will appear here as they are requested</p>
                </div>
              )}

            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}