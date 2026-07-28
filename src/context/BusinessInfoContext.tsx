import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api, { resolveImageUrl } from "@/api/client";

export type BusinessInfo = {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
};

const FALLBACK_BUSINESS_INFO: BusinessInfo = {
  companyName: "Levants Dairy",
  email: "levantsdairy1@gmail.com",
  phone: "+44 7494 927688",
  address: "",
  logoUrl: "/Logo.jpg",
};

const BusinessInfoContext = createContext<BusinessInfo>(
  FALLBACK_BUSINESS_INFO,
);

export const BusinessInfoProvider = ({ children }: { children: ReactNode }) => {
  const [businessInfo, setBusinessInfo] = useState(FALLBACK_BUSINESS_INFO);

  useEffect(() => {
    let active = true;

    void api
      .get<{
        success: boolean;
        data?: {
          business?: {
            companyName?: string;
            email?: string;
            phone?: string;
            address?: string;
            logo?: string | { url?: string | null } | null;
          };
        };
      }>("/business-info/public")
      .then((response) => {
        if (!active) return;
        const business = response.data?.business;
        if (!business) return;

        setBusinessInfo({
          companyName:
            String(business.companyName || "").trim() ||
            FALLBACK_BUSINESS_INFO.companyName,
          email:
            String(business.email || "").trim() ||
            FALLBACK_BUSINESS_INFO.email,
          phone:
            String(business.phone || "").trim() ||
            FALLBACK_BUSINESS_INFO.phone,
          address: String(business.address || "").trim(),
          logoUrl:
            resolveImageUrl(business.logo) || FALLBACK_BUSINESS_INFO.logoUrl,
        });
      })
      .catch(() => {
        // Retain the legacy branding when the public settings endpoint is
        // temporarily unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.title = businessInfo.companyName;
    const favicon = document.querySelector<HTMLLinkElement>(
      "link[rel~='icon']",
    );
    if (favicon) favicon.href = businessInfo.logoUrl;
  }, [businessInfo.companyName, businessInfo.logoUrl]);

  const value = useMemo(() => businessInfo, [businessInfo]);

  return (
    <BusinessInfoContext.Provider value={value}>
      {children}
    </BusinessInfoContext.Provider>
  );
};

export const useBusinessInfo = () => useContext(BusinessInfoContext);
