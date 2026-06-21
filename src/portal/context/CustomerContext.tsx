import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError } from "@/api/client";
import { type PortalCustomer, portalAuthApi } from "@/api/portalAuth";

type CustomerContextValue = {
  customer: PortalCustomer | null;
  loading: boolean;
  error: string | null;
  refreshCustomer: () => Promise<void>;
  updateCustomerProfile: (payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    themePreference?: "light" | "dark";
  }) => Promise<void>;
};

const CustomerContext = createContext<CustomerContextValue | undefined>(
  undefined,
);

function readCustomerFromEnvelope(payload: unknown): PortalCustomer | null {
  if (!payload || typeof payload !== "object") return null;

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  const customerWrapper = (data as { customer?: unknown }).customer;
  if (customerWrapper && typeof customerWrapper === "object") {
    return customerWrapper as PortalCustomer;
  }

  return data as PortalCustomer;
}

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customer, setCustomer] = useState<PortalCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCustomer = async () => {
    setError(null);
    try {
      const res = await portalAuthApi.me();
      setCustomer(readCustomerFromEnvelope(res));
    } catch (err) {
      setCustomer(null);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load your account details.");
      }
    }
  };

  const updateCustomerProfile = async (payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    themePreference?: "light" | "dark";
  }) => {
    setError(null);
    const res = await portalAuthApi.updateProfile(payload);
    const updated = readCustomerFromEnvelope(res);
    if (updated) setCustomer(updated);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshCustomer();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<CustomerContextValue>(
    () => ({
      customer,
      loading,
      error,
      refreshCustomer,
      updateCustomerProfile,
    }),
    [customer, loading, error],
  );

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const usePortalCustomer = (): CustomerContextValue => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("usePortalCustomer must be used within CustomerProvider");
  }
  return context;
};
