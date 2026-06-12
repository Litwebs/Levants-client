import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  Receipt,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  mockPaymentMethods,
  mockPayments,
  mockPayments as payHistory,
} from "@/portal/data/mockData";
import { PaymentStatusBadge } from "@/portal/components/StatusBadges";
import { EmptyState, PageHeader } from "@/portal/components/PortalUI";

const PaymentsPage: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);

  const failedPayments = mockPayments.filter((p) => p.status === "failed");
  const pendingPayments = mockPayments.filter((p) => p.status === "pending");

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Payments"
        description="Manage your payment methods and view payment history"
      />

      {/* Failed payment alert */}
      {failedPayments.length > 0 && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {failedPayments.length} failed payment
            {failedPayments.length > 1 ? "s" : ""}. Please update your payment
            method.{" "}
            <button className="underline font-medium">Resolve now</button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Paid", value: "—", color: "text-foreground" },
          {
            label: "Pending",
            value: pendingPayments.length,
            color: "text-yellow-600",
          },
          {
            label: "Failed",
            value: failedPayments.length,
            color: "text-destructive",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-2xl p-4 text-center"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Payment Methods</h3>
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add method
          </Button>
        </div>

        {mockPaymentMethods.length === 0 ? (
          <EmptyState
            title="No payment methods"
            description="Add a payment method to place orders."
          />
        ) : (
          <div className="space-y-2">
            {mockPaymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border"
              >
                <div className="w-10 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {pm.label} •••• {pm.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {pm.expiry}
                  </p>
                </div>
                {pm.isDefault && (
                  <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                    Default
                  </span>
                )}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
        {payHistory.length === 0 ? (
          <EmptyState title="No payment history" />
        ) : (
          <div className="divide-y divide-border">
            {payHistory.map((pay) => (
              <div
                key={pay.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {pay.reference}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pay.date} · {pay.referenceType}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <PaymentStatusBadge status={pay.status} />
                  <span className="text-sm font-bold text-foreground">
                    {pay.amount}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Receipt className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Card Number</Label>
              <Input placeholder="•••• •••• •••• ••••" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" />
              </div>
              <div className="space-y-1.5">
                <Label>CVC</Label>
                <Input placeholder="•••" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Name on card</Label>
              <Input placeholder="Sarah Mitchell" />
            </div>
            <p className="text-xs text-muted-foreground">
              Card details are stored securely. No real processing in this demo.
            </p>
            <Button className="w-full" onClick={() => setAddModalOpen(false)}>
              Add Payment Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
