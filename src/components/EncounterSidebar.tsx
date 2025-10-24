import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  ChevronRight, 
  TestTube, 
  FileText, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LabRequest {
  id: string;
  testName: string;
  priority: "routine" | "urgent" | "stat";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  requestedAt: string;
  estimatedCompletion?: string;
}

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

const mockEncounterItems: EncounterItem[] = [
  {
    id: "1",
    type: "lab",
    title: "Complete Blood Count",
    status: "pending",
    timestamp: "10:30 AM",
    details: { priority: "routine", estimatedTime: "2 hours" }
  },
  {
    id: "2", 
    type: "lab",
    title: "Chemistry Panel",
    status: "in-progress",
    timestamp: "10:32 AM",
    details: { priority: "urgent", estimatedTime: "1 hour" }
  }
];

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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const headerEl = document.querySelector("header");
      const h = headerEl instanceof HTMLElement ? headerEl.offsetHeight : 0;
      setHeaderHeight(h);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pendingItems = encounterItems.filter(item => item.status === "pending");
  const inProgressItems = encounterItems.filter(item => item.status === "in-progress");
  const completedItems = encounterItems.filter(item => item.status === "completed");


  return (
    <div 
      className={cn(
        "fixed right-0 bg-background border-l shadow-lg transition-all duration-300 z-40",
        isCollapsed ? "w-16" : "w-80"
      )}
      style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}
    >
      {/* Collapse/Expand Button */}
      <div className="absolute -left-6 top-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-6 p-0 bg-background shadow-md"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Sidebar Content */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          {isCollapsed ? (
            <div className="flex justify-center">
              <FileText className="h-5 w-5" />
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-sm">Encounter Progress</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Items being processed
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {/* In Progress Section */}
            {inProgressItems.length > 0 && (
              <div>
                {!isCollapsed && (
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    IN PROGRESS
                  </h4>
                )}
                <div className="space-y-2">
                  {inProgressItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onItemClick?.(item)}
                    >
                      <CardContent className={cn("p-3", isCollapsed && "p-2")}>
                        {isCollapsed ? (
                          <div className="flex flex-col items-center space-y-1">
                            {getTypeIcon(item.type)}
                            {getStatusIcon(item.status)}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(item.type)}
                                <span className="text-xs font-medium">
                                  {item.title}
                                </span>
                              </div>
                              {getStatusIcon(item.status)}
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getStatusColor(item.status))}
                              >
                                {item.status.replace("-", " ")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.timestamp}
                              </span>
                            </div>
                            {item.details?.estimatedTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Est. {item.details.estimatedTime}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Section */}
            {pendingItems.length > 0 && (
              <div>
                {!isCollapsed && (
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    PENDING
                  </h4>
                )}
                <div className="space-y-2">
                  {pendingItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onItemClick?.(item)}
                    >
                      <CardContent className={cn("p-3", isCollapsed && "p-2")}>
                        {isCollapsed ? (
                          <div className="flex flex-col items-center space-y-1">
                            {getTypeIcon(item.type)}
                            {getStatusIcon(item.status)}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(item.type)}
                                <span className="text-xs font-medium">
                                  {item.title}
                                </span>
                              </div>
                              {getStatusIcon(item.status)}
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getStatusColor(item.status))}
                              >
                                {item.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.timestamp}
                              </span>
                            </div>
                            {item.details?.priority && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Priority: {item.details.priority}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Section */}
            {completedItems.length > 0 && (
              <div>
                {!isCollapsed && (
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    COMPLETED
                  </h4>
                )}
                <div className="space-y-2">
                  {completedItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors opacity-75"
                      onClick={() => onItemClick?.(item)}
                    >
                      <CardContent className={cn("p-3", isCollapsed && "p-2")}>
                        {isCollapsed ? (
                          <div className="flex flex-col items-center space-y-1">
                            {getTypeIcon(item.type)}
                            {getStatusIcon(item.status)}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(item.type)}
                                <span className="text-xs font-medium">
                                  {item.title}
                                </span>
                              </div>
                              {getStatusIcon(item.status)}
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getStatusColor(item.status))}
                              >
                                {item.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.timestamp}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {encounterItems.length === 0 && (
              <div className="text-center py-8">
                {isCollapsed ? (
                  <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
                ) : (
                  <div>
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No items in progress
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Items will appear here as they are requested
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}