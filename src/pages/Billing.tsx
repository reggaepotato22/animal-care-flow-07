import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES, mpesaStkPushPlaceholder } from "@/lib/kenya";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

type LineItem = {
  id: string;
  description: string;
  amount: number;
};

export default function Billing() {
  const [phone, setPhone] = useState("+2547XXXXXXXX");
  const [items] = useState<LineItem[]>([
    { id: "li1", description: "Consultation", amount: 1500 },
    { id: "li2", description: "Amoxicillin 500mg x 10", amount: 800 },
  ]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle"|"waiting"|"success">("idle");

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  const pay = async () => {
    setOpen(true);
    setStatus("waiting");
    await mpesaStkPushPlaceholder({
      phone,
      amount: total,
      accountReference: "ACF-Invoice-001",
      description: "Vet services",
    });
    setTimeout(() => setStatus("success"), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Pharmacy</h1>
        <p className="text-muted-foreground">Invoices generated from completed steps</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.description}</TableCell>
                    <TableCell className="text-right">{formatKES(i.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{formatKES(total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="max-w-xs" />
            <Button onClick={pay}>Pay with M-Pesa</Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Payment Gateway</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {status === "waiting" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                Waiting for Customer Pin...
              </motion.div>
            )}
            {status === "success" && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-sm text-success">
                Payment Successful
              </motion.div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Amount: {formatKES(total)} • {phone}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
