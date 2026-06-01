import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Star,
  Upload,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageOff,
  Quote,
} from "lucide-react";
import { ApiError } from "@/api/client";
import {
  verifyOrderId,
  fetchReviews,
  submitReview,
  type Review,
  type ReviewsMeta,
} from "@/api/reviews";

const PAGE_SIZE_OPTIONS = [10, 30, 50];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

// ---------------------------------------------------------------------------
// Star component (interactive or display-only)
// ---------------------------------------------------------------------------
interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = "md",
}) => {
  const [hover, setHover] = useState(0);
  const interactive = Boolean(onChange);

  const sizeClass =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";

  return (
    <div
      className="flex gap-0.5"
      role={interactive ? "radiogroup" : undefined}
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (interactive ? hover || value : value);
        return (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            aria-label={
              interactive
                ? `Rate ${star} star${star > 1 ? "s" : ""}`
                : undefined
            }
            className={interactive ? "focus:outline-none" : "cursor-default"}
          >
            <Star
              className={`${sizeClass} transition-colors ${
                filled
                  ? "fill-accent text-accent"
                  : "fill-transparent text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------
const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const dateStr = new Date(review.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-card p-4 lg:p-6 rounded-2xl border border-border flex flex-col">
      <Quote className="w-8 h-8 text-primary/20 mb-4 shrink-0" />
      {review.imageUrl && (
        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted">
          <img
            src={review.imageUrl}
            alt={`Review by ${review.customerName}`}
            className="w-full aspect-[3/4] object-cover"
            loading="lazy"
            onError={(e) => {
              (
                e.currentTarget as HTMLImageElement
              ).parentElement!.style.display = "none";
            }}
          />
        </div>
      )}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < review.rating ? "fill-gold text-gold" : "fill-transparent text-muted-foreground/30"}`}
          />
        ))}
      </div>
      <p className="text-foreground mb-6 leading-relaxed break-words flex-1">
        "{review.description}"
      </p>
      <div>
        <p className="font-medium">{review.customerName}</p>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reviews display section
// ---------------------------------------------------------------------------
const ReviewsDisplay: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<ReviewsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReviews(p, ps);
      setReviews(res.data?.reviews ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, pageSize);
  }, [load, page, pageSize]);

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <ImageOff className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {reviews.map((r) => (
              <div key={r._id} className="break-inside-avoid mb-6">
                <ReviewCard review={r} />
              </div>
            ))}
          </div>

          {(totalPages > 1 || total > PAGE_SIZE_OPTIONS[0]) && (
            <div className="flex flex-wrap items-center justify-between gap-4 mt-10 pt-6 border-t border-border text-sm">
              <span className="text-muted-foreground">
                Showing {rangeStart}–{rangeEnd} of {total}
              </span>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-border bg-background
                      text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s} / page
                      </option>
                    ))}
                  </select>
                  <ChevronLeft className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-[-90deg] text-muted-foreground" />
                </div>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border font-medium
                    hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="text-muted-foreground whitespace-nowrap">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border font-medium
                    hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review submission form (2-step)
// ---------------------------------------------------------------------------
type Step = "verify" | "form" | "success";

const ReviewSubmitForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("verify");
  const [verifiedOrderId, setVerifiedOrderId] = useState("");

  // Step 1 state
  const [orderId, setOrderId] = useState(
    () => searchParams.get("orderId") ?? "",
  );
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Auto-verify when orderId is pre-filled from the URL (e.g. from email link)
  useEffect(() => {
    const fromUrl = searchParams.get("orderId")?.trim();
    if (!fromUrl) return;
    setVerifyError(null);
    setVerifying(true);
    verifyOrderId(fromUrl)
      .then(() => {
        setVerifiedOrderId(fromUrl);
        setStep("form");
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setVerifyError(
              "Order not found. Please check your order number and try again.",
            );
          } else if (err.status === 409) {
            setVerifyError(
              "A review has already been submitted for this order.",
            );
          } else {
            setVerifyError(
              err.message || "Something went wrong. Please try again.",
            );
          }
        } else {
          setVerifyError("Something went wrong. Please try again.");
        }
      })
      .finally(() => setVerifying(false));
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2 state
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderId.trim();
    if (!trimmed) return;
    setVerifyError(null);
    setVerifying(true);
    try {
      await verifyOrderId(trimmed);
      setVerifiedOrderId(trimmed);
      setStep("form");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setVerifyError(
            "Order not found. Please check your order number and try again.",
          );
        } else if (err.status === 409) {
          setVerifyError("A review has already been submitted for this order.");
        } else {
          setVerifyError(
            err.message || "Something went wrong. Please try again.",
          );
        }
      } else {
        setVerifyError("Something went wrong. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setSubmitError("Image must be 8 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSubmitError(null);
    setImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setSubmitError("Please enter your name.");
      return;
    }
    if (rating === 0) {
      setSubmitError("Please select a star rating.");
      return;
    }
    if (!description.trim()) {
      setSubmitError("Please write a review.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitReview({
        orderId: verifiedOrderId,
        customerName: customerName.trim(),
        description: description.trim(),
        rating,
        image,
      });
      setStep("success");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(
          err.message || "Failed to submit review. Please try again.",
        );
      } else {
        setSubmitError("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep("verify");
    setOrderId("");
    setVerifiedOrderId("");
    setCustomerName("");
    setRating(0);
    setDescription("");
    removeImage();
    setVerifyError(null);
    setSubmitError(null);
  };

  if (step === "success") {
    return (
      <div className="text-center py-10">
        <CheckCircle className="w-16 h-16 text-primary-foreground mx-auto mb-4" />
        <h3 className="font-heading text-2xl font-semibold text-primary-foreground mb-2">
          Thank You!
        </h3>
        <p className="text-primary-foreground/70 mb-6">
          Your review has been submitted and is awaiting approval.
        </p>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/30 px-6 py-2.5
            rounded-xl font-medium transition-colors"
        >
          Submit Another Review
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-white/40";
  const labelCls =
    "block text-sm font-medium text-primary-foreground/80 mb-1.5";

  return (
    <div>
      {step === "verify" && (
        <>
          <p className="text-sm text-primary-foreground/70 mb-6">
            Enter your order number to leave a review.
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="orderId" className={labelCls}>
                Order Number
              </label>
              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setVerifyError(null);
                }}
                placeholder="e.g. ORD-12345"
                required
                className={inputCls}
              />
            </div>
            {verifyError && (
              <p className="text-sm text-red-300">{verifyError}</p>
            )}
            <button
              type="submit"
              disabled={verifying || !orderId.trim()}
              className="w-full flex items-center justify-center gap-2 bg-white text-primary
                px-6 py-2.5 rounded-xl font-semibold hover:bg-white/90 disabled:opacity-50
                disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {verifying ? "Checking…" : "Check Order"}
            </button>
          </form>
        </>
      )}

      {step === "form" && (
        <>
          <div className="flex items-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => setStep("verify")}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-sm text-primary-foreground/70">
              Order{" "}
              <span className="font-semibold text-primary-foreground">
                #{verifiedOrderId}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerName" className={labelCls}>
                  Your Name <span className="text-red-300">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Sarah M."
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <p className={labelCls}>
                  Rating <span className="text-red-300">*</span>
                </p>
                <div className="pt-1">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className={labelCls}>
                Review <span className="text-red-300">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Share your experience with Levants Dairy…"
                required
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-primary-foreground/40 mt-1 text-right">
                {description.length}/1000
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-xl border border-white/20"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-white/20 hover:bg-white/30 text-white
                      rounded-full p-0.5 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="reviewImage"
                  className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed
                    border-white/30 px-4 py-2.5 text-sm text-primary-foreground/60 hover:bg-white/10 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Photo (optional, max 8 MB)
                  <input
                    id="reviewImage"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 bg-white text-primary
                  px-8 py-2.5 rounded-xl font-semibold hover:bg-white/90 disabled:opacity-50
                  disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>

            {submitError && (
              <p className="text-sm text-red-300">{submitError}</p>
            )}
          </form>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Count-up animation hook
// ---------------------------------------------------------------------------
function useCountUp(target: number | null, duration = 1200, decimals = 0) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (target - from) * eased;
      setDisplay(parseFloat(value.toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, decimals]);

  return display;
}

// ---------------------------------------------------------------------------
// Reviews page
// ---------------------------------------------------------------------------
function useReviewStats() {
  const [total, setTotal] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchReviews(1, 200)
      .then((res) => {
        if (!mounted) return;
        const reviews = res.data?.reviews ?? [];
        const t =
          typeof res.meta?.total === "number" ? res.meta.total : reviews.length;
        setTotal(t);
        if (reviews.length > 0) {
          const avg =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          setAvgRating(Math.round(avg * 10) / 10);
        } else {
          setAvgRating(0);
        }
      })
      .catch(() => {
        setTotal(0);
        setAvgRating(0);
      })
      .finally(() => {
        if (mounted) setStatsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { total, avgRating, statsLoading };
}

const ReviewsPage: React.FC = () => {
  const { total, avgRating, statsLoading } = useReviewStats();
  const animatedTotal = useCountUp(statsLoading ? null : (total ?? 0), 1400, 0);
  const animatedAvg = useCountUp(
    statsLoading ? null : (avgRating ?? 0),
    1400,
    1,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero + integrated form */}
      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="container-custom max-w-3xl">
          <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
            Customer Reviews
          </h1>
          <p className="text-primary-foreground/70 mb-8">
            Honest feedback from our customers — and ordered from us? Share
            yours below.
          </p>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-10 mb-10">
            <div>
              {statsLoading ? (
                <div className="h-12 w-20 rounded-lg bg-white/10 animate-pulse" />
              ) : (
                <p className="font-heading text-5xl lg:text-6xl font-semibold leading-none">
                  {animatedTotal.toLocaleString()}
                </p>
              )}
              <p className="text-primary-foreground/60 text-sm mt-2 uppercase tracking-wide">
                Reviews
              </p>
            </div>
            <div>
              {statsLoading ? (
                <div className="h-12 w-24 rounded-lg bg-white/10 animate-pulse" />
              ) : (
                <div className="flex items-end gap-2 leading-none">
                  <p className="font-heading text-5xl lg:text-6xl font-semibold">
                    {animatedAvg.toFixed(1)}
                  </p>
                  <span className="text-primary-foreground/40 text-2xl mb-1">
                    / 5
                  </span>
                </div>
              )}
              {!statsLoading && (
                <div className="flex gap-0.5 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < Math.floor(avgRating ?? 0);
                    const partial = !filled && i < (avgRating ?? 0);
                    return (
                      <div key={i} className="relative w-5 h-5">
                        {/* empty star */}
                        <Star className="absolute inset-0 w-5 h-5 fill-transparent text-white/25" />
                        {/* filled / partial fill */}
                        {(filled || partial) && (
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                              width: filled
                                ? "100%"
                                : `${((avgRating ?? 0) % 1) * 100}%`,
                            }}
                          >
                            <Star className="w-5 h-5 fill-gold text-gold" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-primary-foreground/60 text-sm mt-1.5 uppercase tracking-wide">
                Average Rating
              </p>
            </div>
          </div>

          <ReviewSubmitForm />
        </div>
      </section>

      {/* Reviews grid */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <ReviewsDisplay />
        </div>
      </section>
    </div>
  );
};

export default ReviewsPage;
