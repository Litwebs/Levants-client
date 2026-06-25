import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ApiError } from "@/api/client";
import {
  type PortalAddress,
  type CreateAddressPayload,
  type UpdateAddressPayload,
  portalAddressesApi,
} from "@/api/portalAddresses";

type AddressesContextValue = {
  addresses: PortalAddress[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAddresses: () => Promise<void>;
  createAddress: (payload: CreateAddressPayload) => Promise<PortalAddress>;
  updateAddress: (
    id: string,
    payload: UpdateAddressPayload,
  ) => Promise<PortalAddress>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<PortalAddress>;
};

const AddressesContext = createContext<AddressesContextValue | undefined>(
  undefined,
);

const getAddressId = (address: PortalAddress) =>
  address._id || address.id || "";

export const AddressesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [addresses, setAddresses] = useState<PortalAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await portalAddressesApi.list();
      const data = (res as any)?.data;
      if (data?.addresses) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load addresses");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createAddress = useCallback(
    async (payload: CreateAddressPayload): Promise<PortalAddress> => {
      setError(null);
      try {
        const res = await portalAddressesApi.create(payload);
        const data = (res as any)?.data;
        const newAddress = data?.address;
        if (newAddress) {
          setAddresses((prev) => [...prev, newAddress]);
          return newAddress;
        }
        throw new Error("Invalid response from server");
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to create address";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const updateAddress = useCallback(
    async (
      id: string,
      payload: UpdateAddressPayload,
    ): Promise<PortalAddress> => {
      setError(null);
      try {
        const res = await portalAddressesApi.update(id, payload);
        const data = (res as any)?.data;
        const updatedAddress = data?.address;
        if (updatedAddress) {
          setAddresses((prev) =>
            prev.map((a) => (getAddressId(a) === id ? updatedAddress : a)),
          );
          return updatedAddress;
        }
        throw new Error("Invalid response from server");
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to update address";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const deleteAddress = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await portalAddressesApi.delete(id);
      setAddresses((prev) => prev.filter((a) => getAddressId(a) !== id));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete address";
      setError(message);
      throw err;
    }
  }, []);

  const setDefaultAddress = useCallback(
    async (id: string): Promise<PortalAddress> => {
      setError(null);
      try {
        const res = await portalAddressesApi.setDefault(id);
        const data = (res as any)?.data;
        const updatedAddress = data?.address;
        if (updatedAddress) {
          // Update all addresses - only one can be default
          setAddresses((prev) =>
            prev.map((a) => ({
              ...a,
              isDefault: getAddressId(a) === id,
            })),
          );
          return updatedAddress;
        }
        throw new Error("Invalid response from server");
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to set default address";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const value = useMemo<AddressesContextValue>(
    () => ({
      addresses,
      loading,
      error,
      fetchAddresses,
      createAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [
      addresses,
      loading,
      error,
      fetchAddresses,
      createAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    ],
  );

  return (
    <AddressesContext.Provider value={value}>
      {children}
    </AddressesContext.Provider>
  );
};

export const useAddresses = () => {
  const context = useContext(AddressesContext);
  if (!context) {
    throw new Error("useAddresses must be used within AddressesProvider");
  }
  return context;
};
