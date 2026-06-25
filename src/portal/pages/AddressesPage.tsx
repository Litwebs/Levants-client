import React, { useState, useEffect, useRef } from "react";
import { MapPin, Plus, Pencil, Trash2, Check, Loader2 } from "lucide-react";
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
import { useAddresses } from "@/portal/context/AddressesContext";
import { type PortalAddress } from "@/api/portalAddresses";
import {
  EmptyState,
  PageHeader,
  ConfirmationModal,
} from "@/portal/components/PortalUI";

const DELIVERY_INSTRUCTIONS_LIMIT = 500;
const getAddressId = (address: PortalAddress) =>
  address._id || address.id || "";

interface AddressFormData {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
  deliveryInstructions: string;
  isDefault: boolean;
}

const AddressForm: React.FC<{
  initial?: PortalAddress;
  onSave: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ initial, onSave, onCancel, isLoading = false }) => {
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const line1Ref = useRef<HTMLInputElement>(null);
  const line2Ref = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const postcodeRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const deliveryInstructionsRef = useRef<HTMLTextAreaElement>(null);
  const isDefaultRef = useRef<HTMLInputElement>(null);
  const [instructionsLength, setInstructionsLength] = useState(
    initial?.deliveryInstructions?.length || 0,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      if (fullNameRef.current)
        fullNameRef.current.value = initial.fullName || "";
      if (phoneRef.current) phoneRef.current.value = initial.phone || "";
      if (line1Ref.current) line1Ref.current.value = initial.line1 || "";
      if (line2Ref.current) line2Ref.current.value = initial.line2 || "";
      if (cityRef.current) cityRef.current.value = initial.city || "";
      if (postcodeRef.current)
        postcodeRef.current.value = initial.postcode || "";
      if (countryRef.current) countryRef.current.value = initial.country || "";
      if (deliveryInstructionsRef.current)
        deliveryInstructionsRef.current.value =
          initial.deliveryInstructions || "";
      if (isDefaultRef.current)
        isDefaultRef.current.checked = initial.isDefault || false;
    }
  }, [initial]);

  const handleInstructionsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInstructionsLength(e.target.value.length);
  };

  const handleSave = async () => {
    setError(null);
    const formData: AddressFormData = {
      fullName: fullNameRef.current?.value || "",
      phone: phoneRef.current?.value || "",
      line1: line1Ref.current?.value || "",
      line2: line2Ref.current?.value || "",
      city: cityRef.current?.value || "",
      postcode: postcodeRef.current?.value || "",
      country: countryRef.current?.value || "",
      deliveryInstructions: deliveryInstructionsRef.current?.value || "",
      isDefault: isDefaultRef.current?.checked || false,
    };

    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save address";
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = isLoading || isSaving;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            ref={fullNameRef}
            placeholder="Sarah Mitchell"
            disabled={isDisabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            ref={phoneRef}
            placeholder="+44 7700 900000"
            disabled={isDisabled}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="line1">Address line 1 *</Label>
        <Input
          id="line1"
          ref={line1Ref}
          placeholder="14 Meadow Lane"
          disabled={isDisabled}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="line2">Address line 2 (optional)</Label>
        <Input
          id="line2"
          ref={line2Ref}
          placeholder="Flat 3"
          disabled={isDisabled}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            ref={cityRef}
            placeholder="Manchester"
            disabled={isDisabled}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            ref={postcodeRef}
            placeholder="M14 5TF"
            disabled={isDisabled}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="country">Country *</Label>
        <Input
          id="country"
          ref={countryRef}
          placeholder="United Kingdom"
          disabled={isDisabled}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deliveryInstructions">
          Delivery instructions (optional)
        </Label>
        <Textarea
          id="deliveryInstructions"
          ref={deliveryInstructionsRef}
          placeholder="Leave at the door if no answer…"
          rows={2}
          maxLength={DELIVERY_INSTRUCTIONS_LIMIT}
          onChange={handleInstructionsChange}
          disabled={isDisabled}
        />
        <p className="text-xs text-muted-foreground">
          {instructionsLength}/{DELIVERY_INSTRUCTIONS_LIMIT}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="setDefault" ref={isDefaultRef} disabled={isDisabled} />
        <Label htmlFor="setDefault" className="cursor-pointer font-normal">
          Set as default delivery address
        </Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isDisabled}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isDisabled}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Address
        </Button>
      </div>
    </div>
  );
};

const AddressesPage: React.FC = () => {
  const {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const [addOpen, setAddOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<PortalAddress | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [defaultLoading, setDefaultLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleDelete = async () => {
    if (!deleteAddressId) return;
    try {
      setDeleteLoading(true);
      setFormError(null);
      await deleteAddress(deleteAddressId);
      setDeleteAddressId(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete address";
      setFormError(errorMessage);
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  const requestDelete = (address: PortalAddress) => {
    const addressId = getAddressId(address);
    if (!addressId) {
      setFormError(
        "This address is missing an ID and cannot be deleted. Please refresh the page.",
      );
      return;
    }
    setFormError(null);
    setDeleteAddressId(addressId);
  };

  const requestEdit = (address: PortalAddress) => {
    const addressId = getAddressId(address);
    if (!addressId) {
      setFormError(
        "This address is missing an ID and cannot be edited. Please refresh the page.",
      );
      return;
    }
    setEditAddress(address);
  };

  const handleSetDefault = async () => {
    if (!defaultAddressId) return;
    try {
      setDefaultLoading(true);
      setFormError(null);
      await setDefaultAddress(defaultAddressId);
      setDefaultAddressId(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set default address";
      setFormError(errorMessage);
      throw err;
    } finally {
      setDefaultLoading(false);
    }
  };

  const requestSetDefault = (address: PortalAddress) => {
    const addressId = getAddressId(address);
    if (!addressId) {
      setFormError(
        "This address is missing an ID and cannot be updated. Please refresh the page.",
      );
      return;
    }
    setFormError(null);
    setDefaultAddressId(addressId);
  };

  const handleSaveNew = async (data: AddressFormData) => {
    try {
      setFormError(null);
      await createAddress(data);
      setAddOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create address";
      setFormError(errorMessage);
      throw err;
    }
  };

  const handleSaveEdit = async (data: AddressFormData) => {
    const addressId = editAddress ? getAddressId(editAddress) : "";
    if (!addressId) return;
    try {
      setFormError(null);
      await updateAddress(addressId, data);
      setEditAddress(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update address";
      setFormError(errorMessage);
      throw err;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Delivery Addresses"
        description="Manage where your orders get delivered"
        action={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setAddOpen(true);
            }}
            disabled={loading || addresses.length >= 10}
            title={
              addresses.length >= 10 ? "Maximum 10 addresses per account" : ""
            }
          >
            <Plus className="h-4 w-4" />
            Add address
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}
      {formError && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {formError}
        </div>
      )}
      {addresses.length >= 10 && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-900 rounded-lg text-sm border border-amber-200">
          You've reached the maximum of 10 saved addresses. Delete an address to
          add a new one.
        </div>
      )}

      {loading && !addresses.length ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-16 w-16" />}
          title="No saved addresses"
          description="Add a delivery address to place orders and subscriptions."
          action={
            <Button onClick={() => setAddOpen(true)} disabled={loading}>
              Add Address
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={getAddressId(addr)}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      {addr.fullName || "Unnamed Address"}
                    </p>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  {addr.phone && (
                    <p className="text-xs text-muted-foreground">
                      {addr.phone}
                    </p>
                  )}
                  <p className="text-sm text-foreground mt-1">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                    {addr.postcode}
                    {addr.country ? `, ${addr.country}` : ""}
                  </p>
                  {addr.deliveryInstructions && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {addr.deliveryInstructions}
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => requestEdit(addr)}
                    disabled={formLoading}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => requestDelete(addr)}
                    disabled={addr.isDefault || formLoading || deleteLoading}
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
                  onClick={() => requestSetDefault(addr)}
                  disabled={formLoading || defaultLoading || deleteLoading}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSave={handleSaveNew}
            onCancel={() => setAddOpen(false)}
            isLoading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={!!editAddress}
        onOpenChange={(v) => !v && setEditAddress(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          {editAddress && (
            <AddressForm
              initial={editAddress}
              onSave={handleSaveEdit}
              onCancel={() => setEditAddress(null)}
              isLoading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteAddressId}
        onOpenChange={(open) => !open && setDeleteAddressId(null)}
        title="Delete Address"
        description="Are you sure you want to delete this address? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteLoading}
      />

      <ConfirmationModal
        open={!!defaultAddressId}
        onOpenChange={(open) => !open && setDefaultAddressId(null)}
        title="Set Default Address"
        description="Set this as your default delivery address?"
        confirmLabel="Set as default"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleSetDefault}
        isLoading={defaultLoading}
      />
    </div>
  );
};

export default AddressesPage;
