import api from '@/api/client';
type ImageRef = string | { url?: string } | null;
export type ProductPresentation = { id?: string; _id?: string; description?: string; thumbnailImage?: ImageRef; variants?: Array<{ id?: string; _id?: string; description?: string; thumbnailImage?: ImageRef }> };
/** Read existing public product metadata only. Never replace the purchased package snapshot. */
export async function getProductPresentation(id: string): Promise<ProductPresentation | null> {
  const response = await api.get<{ data?: ProductPresentation | { product?: ProductPresentation } }>(`/products/${encodeURIComponent(id)}`);
  const data = response.data;
  const product = data && 'product' in data ? data.product : data as ProductPresentation | undefined;
  return product && String(product.id ?? product._id) === id ? product : null;
}
