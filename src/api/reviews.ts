import api from "@/api/client";

export interface Review {
  _id: string;
  orderId: string;
  customerName: string;
  description: string;
  rating: number;
  imageUrl: string | null;
  isVisible: boolean;
  createdAt: string;
}

export interface ReviewsMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReviewsListResponse {
  success: boolean;
  data: { reviews: Review[] };
  meta: ReviewsMeta;
}

export interface VerifyOrderResponse {
  success: boolean;
}

export interface SubmitReviewResponse {
  success: boolean;
  data: { review: Review };
}

export async function verifyOrderId(orderId: string): Promise<VerifyOrderResponse> {
  return api.get<VerifyOrderResponse>(`/reviews/verify/${encodeURIComponent(orderId)}`);
}

export async function fetchReviews(page: number, pageSize: number): Promise<ReviewsListResponse> {
  return api.get<ReviewsListResponse>("/reviews", { page, pageSize });
}

export interface SubmitReviewPayload {
  orderId: string;
  customerName: string;
  description: string;
  rating: number;
  image?: File | null;
}

export async function submitReview(payload: SubmitReviewPayload): Promise<SubmitReviewResponse> {
  const formData = new FormData();
  formData.append("orderId", payload.orderId);
  formData.append("customerName", payload.customerName);
  formData.append("description", payload.description);
  formData.append("rating", String(payload.rating));
  if (payload.image) {
    formData.append("image", payload.image);
  }
  return api.postForm<SubmitReviewResponse>("/reviews", formData);
}
