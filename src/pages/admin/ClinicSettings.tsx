import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkflowContext } from "@/contexts/WorkflowContext";
import type { WorkflowStepId } from "@/config/workflow";
import { logChange } from "@/lib/audit";

const STORAGE_KEY = "acf_workflow_order";

export default function ClinicSettings() {
  const { workflow, setWorkflowOrder } = useWorkflowContext();
  const [order, setOrder] = useState<WorkflowStepId[]>(() =>
    workflow.map((w) => w.id),
  );
  useEffect(() => {
    setOrder(workflow.map((w) => w.id));
  }, [workflow]);

  const [dragging, setDragging] = useState<WorkflowStepId | null>(null);

  const onDragStart = (id: WorkflowStepId) => setDragging(id);
  const onDragOver = (e: React.DragEvent<HTMLButtonElement>, overId: WorkflowStepId) => {
    e.preventDefault();
    if (!dragging || dragging === overId) return;
    const current = [...order];
    const from = current.indexOf(dragging);
    const to = current.indexOf(overId);
    if (from < 0 || to < 0) return;
    current.splice(from, 1);
    current.splice(to, 0, dragging);
    setOrder(current);
  };
  const save = () => {
    setWorkflowOrder(order);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {}
    logChange({
      entityType: "System",
      entityId: "workflow",
      field: "Workflow Order",
      previousValue: workflow.map((w) => w.id).join(" → "),
      newValue: order.join(" → "),
      changedBy: "admin",
      reason: "Reordered via Clinic Settings",
    });
  };
  const reset = () => {
    setOrder(workflow.map((w) => w.id));
  };

  const stageBadges = useMemo(
    () =>
      order.map((id) => (
        <Badge key={id} variant="outline" className="text-xs">
          {id}
        </Badge>
      )),
    [order],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clinic Settings</h1>
        <p className="text-muted-foreground">Configure workflow order and system behavior</p>
      </div>
      <Card className="backdrop-blur-lg bg-card/70 border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Workflow Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">{stageBadges}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {order.map((id) => (
              <button
                key={id}
                draggable
                onDragStart={() => onDragStart(id)}
                onDragOver={(e) => onDragOver(e, id)}
                className="rounded-md border border-border p-3 bg-background/60 hover:bg-accent/40 transition-colors text-left"
                title="Drag to reorder"
              >
                <div className="text-sm font-medium">{id}</div>
                <div className="text-xs text-muted-foreground">Drag and drop to change sequence</div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>Save Order</Button>
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

