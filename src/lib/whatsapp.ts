export const WHATSAPP_PHONE_E164 = "447494927688";
export const WHATSAPP_DISPLAY_PHONE = "+44 7494 927688";

export function buildWhatsAppLink(message?: string, phone?: string) {
  const normalizedPhone =
    String(phone || "").replace(/\D/g, "") || WHATSAPP_PHONE_E164;
  const base = `https://wa.me/${normalizedPhone}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
