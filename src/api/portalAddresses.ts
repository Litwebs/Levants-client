import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type PortalAddress = {
  id?: string;
  _id?: string;
  label?: string;
  fullName?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAddressPayload = Omit<PortalAddress, "_id" | "createdAt" | "updatedAt">;
export type UpdateAddressPayload = Partial<CreateAddressPayload>;

type AddressesListResponse = {
  addresses: PortalAddress[];
};

type AddressResponse = {
  address: PortalAddress;
};

const addressesBase = "/portal/addresses";

export const portalAddressesApi = {
  // Get all addresses for current customer
  list: () =>
    api.get<ApiEnvelope<AddressesListResponse>>(`${addressesBase}`),

  // Create new address
  create: (payload: CreateAddressPayload) =>
    api.post<ApiEnvelope<AddressResponse>>(`${addressesBase}`, payload),

  // Update specific address
  update: (addressId: string, payload: UpdateAddressPayload) =>
    api.patch<ApiEnvelope<AddressResponse>>(`${addressesBase}/${addressId}`, payload),

  // Delete specific address
  delete: (addressId: string) =>
    api.delete<ApiEnvelope<null>>(`${addressesBase}/${addressId}`),

  // Set address as default
  setDefault: (addressId: string) =>
    api.post<ApiEnvelope<AddressResponse>>(`${addressesBase}/${addressId}/default`),
};
