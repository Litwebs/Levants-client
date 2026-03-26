export const WHATSAPP_PHONE_E164 = "447494927688";
export const WHATSAPP_DISPLAY_PHONE = "+44 7494 927688";

export function buildWhatsAppLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_PHONE_E164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
