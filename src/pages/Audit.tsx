import { useEffect, useState } from "react";
import { getLogs, subscribe, type AuditRecord } from "@/lib/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Audit() {
  const [rows, setRows] = useState<AuditRecord[]>([]);

  useEffect(() => {
    setRows(getLogs());
    const unsub = subscribe((r) => setRows(r));
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Trails</h1>
        <p className="text-muted-foreground">
          Complete change history across the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Field Updated</TableHead>
                  <TableHead>Previous Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Reason for Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.entityType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.entityId}</TableCell>
                    <TableCell className="font-medium">{r.field}</TableCell>
                    <TableCell className="text-sm">{r.previousValue}</TableCell>
                    <TableCell className="text-sm">{r.newValue}</TableCell>
                    <TableCell className="text-sm">{r.changedBy}</TableCell>
                    <TableCell className="text-sm">{r.reason || "—"}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No changes recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

