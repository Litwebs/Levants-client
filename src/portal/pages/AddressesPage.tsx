import React, { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { mockAddresses, type Address } from "@/portal/data/mockData";
import {
  EmptyState,
  PageHeader,
  ConfirmationModal,
} from "@/portal/components/PortalUI";

const AddressForm: React.FC<{
  initial?: Partial<Address>;
  onSave: () => void;
  onCancel: () => void;
}> = ({ initial, onSave, onCancel }) => (
  <div className="space-y-4">
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>Full name</Label>
        <Input defaultValue={initial?.fullName} placeholder="Sarah Mitchell" />
      </div>
      <div className="space-y-1.5">
        <Label>Phone number</Label>
        <Input defaultValue={initial?.phone} placeholder="+44 7700 900000" />
      </div>
    </div>
    <div className="space-y-1.5">
      <Label>Address line 1</Label>
      <Input defaultValue={initial?.line1} placeholder="14 Meadow Lane" />
    </div>
    <div className="space-y-1.5">
      <Label>Address line 2 (optional)</Label>
      <Input defaultValue={initial?.line2} placeholder="Flat 3" />
    </div>
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>City</Label>
        <Input defaultValue={initial?.city} placeholder="Manchester" />
      </div>
      <div className="space-y-1.5">
        <Label>Postcode</Label>
        <Input defaultValue={initial?.postcode} placeholder="M14 5TF" />
      </div>
    </div>
    <div className="space-y-1.5">
      <Label>Delivery instructions (optional)</Label>
      <Textarea
        defaultValue={initial?.instructions}
        placeholder="Leave at the door if no answer…"
        rows={2}
      />
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="setDefault" defaultChecked={initial?.isDefault} />
      <Label htmlFor="setDefault" className="cursor-pointer font-normal">
        Set as default delivery address
      </Label>
    </div>
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave}>Save Address</Button>
    </div>
  </div>
);

const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [addOpen, setAddOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      setAddresses((prev) => prev.filter((a) => a.id !== deleteId));
      setDeleteId(null);
    }
  };

  const setDefault = (id: string) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Delivery Addresses"
        description="Manage where your orders get delivered"
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add address
          </Button>
        }
      />

      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-16 w-16" />}
          title="No saved addresses"
          description="Add a delivery address to place orders and subscriptions."
          action={<Button onClick={() => setAddOpen(true)}>Add Address</Button>}
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      {addr.fullName}
                    </p>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{addr.phone}</p>
                  <p className="text-sm text-foreground mt-1">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                    {addr.postcode}
                  </p>
                  {addr.instructions && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {addr.instructions}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditAddress(addr)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(addr.id)}
                    disabled={addr.isDefault}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {!addr.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-7 text-xs text-forest"
                  onClick={() => setDefault(addr.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                  Set as default
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSave={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={!!editAddress}
        onOpenChange={(v) => !v && setEditAddress(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          {editAddress && (
            <AddressForm
              initial={editAddress}
              onSave={() => setEditAddress(null)}
              onCancel={() => setEditAddress(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Address?"
        description="This address will be permanently removed from your account."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AddressesPage;
