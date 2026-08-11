import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Pencil,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApiError, resolveApiUrl, resolveImageUrl } from "@/api/client";
import { portalOrdersApi, type PortalOrder } from "@/api/portalOrders";
import { portalAddressesApi, type PortalAddress } from "@/api/portalAddresses";

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAddressOption = (address: PortalAddress) =>
  [address.label, address.line1, address.city, address.postcode]
    .filter(Boolean)
    .join(" - ");

const getAddressId = (address: PortalAddress) =>
  address._id || address.id || "";

const addressMatchesOrder = (address: PortalAddress, order: PortalOrder) => {
  const normalize = (value?: string | null) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const deliveryAddress = order.deliveryAddress;

  return (
    normalize(address.line1) === normalize(deliveryAddress.line1) &&
    normalize(address.line2) === normalize(deliveryAddress.line2) &&
    normalize(address.city) === normalize(deliveryAddress.city) &&
    normalize(address.postcode) === normalize(deliveryAddress.postcode) &&
    normalize(address.country) === normalize(deliveryAddress.country)
  );
};

const formatMoney = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount || 0);

const formatStatusLabel = (value?: string | null) => {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getOrderStatusBadgeClass = (status?: string | null) => {
  switch (status) {
    case "paid":
    case "refunded":
      return "bg-forest/10 text-forest dark:bg-emerald-500/20 dark:text-emerald-200";
    case "partially_paid":
    case "partially_refunded":
    case "refund_pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200";
    case "failed":
    case "cancelled":
    case "refund_failed":
      return "bg-destructive/10 text-destructive dark:bg-red-500/20 dark:text-red-200";
    default:
      return "bg-foreground/5 text-foreground dark:bg-slate-500/20 dark:text-slate-100";
  }
};

const getDeliveryStatusBadgeClass = (status?: string | null) => {
  switch (status) {
    case "delivered":
      return "bg-forest/10 text-forest dark:bg-emerald-500/20 dark:text-emerald-200";
    case "returned":
      return "bg-destructive/10 text-destructive dark:bg-red-500/20 dark:text-red-200";
    case "dispatched":
    case "in_transit":
      return "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200";
    default:
      return "bg-foreground/5 text-foreground dark:bg-slate-500/20 dark:text-slate-100";
  }
};

const getRefundStatusBadgeClass = (status?: string | null) => {
  switch (status) {
    case "succeeded":
      return "bg-forest/10 text-forest dark:bg-emerald-500/20 dark:text-emerald-200";
    case "failed":
      return "bg-destructive/10 text-destructive dark:bg-red-500/20 dark:text-red-200";
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200";
  }
};

type DeliveryFlowStatus =
  | "ordered"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "returned";

const DELIVERY_FLOW: Array<{ key: DeliveryFlowStatus; label: string }> = [
  { key: "ordered", label: "Ordered" },
  { key: "dispatched", label: "Dispatched" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

const getDeliveryStatus = (order: PortalOrder): DeliveryFlowStatus => {
  const status = (order.deliveryStatus || "ordered") as DeliveryFlowStatus;
  if (
    ["ordered", "dispatched", "in_transit", "delivered", "returned"].includes(
      status,
    )
  ) {
    return status;
  }
  return "ordered";
};

const formatAddress = (order: PortalOrder) => {
  const a = order.deliveryAddress;
  return [a.line1, a.line2, a.city, a.postcode, a.country]
    .filter(Boolean)
    .join(", ");
};

const canDownloadReceipt = (order: PortalOrder) =>
  Boolean(order.stripePaymentIntentId || order.stripeCheckoutSessionId);

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<PortalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [addresses, setAddresses] = useState<PortalAddress[]>([]);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [deliveryAddressId, setDeliveryAddressId] = useState("");
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!id) {
        setError("Missing order ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await portalOrdersApi.getById(id);
        const data = (res as any)?.data;
        const loadedOrder = data?.order || null;
        if (!cancelled) {
          setOrder(loadedOrder);
        }

        try {
          const addressRes = await portalAddressesApi.list();
          if (!cancelled) {
            const savedAddresses =
              ((addressRes as any)?.data?.addresses as PortalAddress[]) || [];
            setAddresses(savedAddresses);
            const currentAddress = loadedOrder
              ? savedAddresses.find((address) =>
                  addressMatchesOrder(address, loadedOrder),
                )
              : null;
            setDeliveryAddressId(
              currentAddress ? getAddressId(currentAddress) : "",
            );
          }
        } catch {
          if (!cancelled) setAddresses([]);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to load order details. Please try again.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const deliveryStatus = useMemo(
    () => (order ? getDeliveryStatus(order) : "ordered"),
    [order],
  );

  const currentAddressId = useMemo(
    () =>
      order
        ? getAddressId(
            addresses.find((address) => addressMatchesOrder(address, order)) ||
              ({} as PortalAddress),
          )
        : "",
    [addresses, order],
  );

  const hasDeliveryChanges = deliveryAddressId !== currentAddressId;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm text-muted-foreground py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading order details...
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error || "Order not found"}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/portal/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const deliveryProofUrl = resolveImageUrl(
    order.metadata?.deliveryProofUrl as string | undefined,
  );
  const deliveryNotes = [
    order.metadata?.deliveryNotes,
    order.metadata?.deliveryNote,
    order.metadata?.driverNotes,
    order.metadata?.note,
  ].find((v) => typeof v === "string" && v.trim().length > 0) as
    | string
    | undefined;
  const deliveredAt =
    typeof order.metadata?.deliveredAt === "string"
      ? order.metadata.deliveredAt
      : null;
  const customerName =
    [order.customerDetails?.firstName, order.customerDetails?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    order.deliveryAddress?.fullName ||
    null;
  const customerEmail = order.customerDetails?.email || null;
  const customerPhone =
    order.customerDetails?.phone || order.deliveryAddress?.phone || null;
  const hasCustomerDetails = Boolean(
    customerName || customerEmail || customerPhone,
  );
  const hasPaidAt = Boolean(order.paidAt);
  const hasDeliveredAt = Boolean(deliveredAt);
  const hasPaymentDeliveryEvents = hasPaidAt || hasDeliveredAt;
  const hasRefunds =
    (order.refunds && order.refunds.length > 0) ||
    Boolean(
      order.refund?.refundedAt ||
      order.refund?.reason ||
      order.refund?.stripeRefundId,
    );
  const isReturned = deliveryStatus === "returned";
  const flowSteps = isReturned
    ? [
        ...DELIVERY_FLOW.slice(0, 3),
        { key: "returned" as const, label: "Returned" },
      ]
    : DELIVERY_FLOW;
  const currentStepIndex = flowSteps.findIndex((s) => s.key === deliveryStatus);

  const handleDownloadReceipt = async () => {
    if (!order) return;
    try {
      setReceiptLoading(true);
      const res = await portalOrdersApi.getReceiptUrl(order._id);
      const receiptUrl = (res as any)?.data?.receiptUrl as string | undefined;
      if (receiptUrl) {
        window.open(resolveApiUrl(receiptUrl), "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Unable to download receipt right now.";
      setError(msg);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleSaveDelivery = async () => {
    if (!order) return;
    if (!deliveryAddressId) {
      setError("Please select a saved delivery address.");
      return;
    }
    try {
      setDeliverySaving(true);
      setError(null);
      setDeliveryNotice(null);
      const res = await portalOrdersApi.updateDelivery(order._id, {
        deliveryAddressId,
      });
      const updatedOrder = (res as any)?.data?.order as PortalOrder | undefined;
      if (updatedOrder) {
        setOrder(updatedOrder);
        const updatedAddress = addresses.find((address) =>
          addressMatchesOrder(address, updatedOrder),
        );
        setDeliveryAddressId(
          updatedAddress ? getAddressId(updatedAddress) : "",
        );
      }
      setIsEditingDelivery(false);
      setDeliveryNotice("Delivery details updated.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to update delivery details.",
      );
    } finally {
      setDeliverySaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/portal/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            {order.orderId}
          </h1>
          <p className="text-xs text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}
          >
            {formatStatusLabel(order.status)}
          </span>
          {order.deliveryStatus && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDeliveryStatusBadgeClass(order.deliveryStatus)}`}
            >
              {formatStatusLabel(order.deliveryStatus)}
            </span>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Order Timeline
          </p>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {flowSteps.map((step, i) => {
              const done =
                i < currentStepIndex ||
                (deliveryStatus === "delivered" && step.key === "delivered");
              const active = i === currentStepIndex;
              const returnedStep = step.key === "returned";

              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center min-w-[70px]">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                        returnedStep
                          ? active
                            ? "border-destructive text-destructive"
                            : "border-muted-foreground/30 text-muted-foreground/30"
                          : done
                            ? "bg-forest border-forest text-primary-foreground"
                            : active
                              ? "border-forest text-forest"
                              : "border-muted-foreground/30 text-muted-foreground/40"
                      }`}
                    >
                      {returnedStep ? (
                        <XCircle className="h-4 w-4" />
                      ) : done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : active ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs text-center ${
                        active
                          ? returnedStep
                            ? "text-destructive font-medium"
                            : "text-forest font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {i < flowSteps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mt-3.5 min-w-[16px] ${
                        i < currentStepIndex
                          ? returnedStep
                            ? "bg-border"
                            : "bg-forest"
                          : "bg-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-4">
        <h3 className="font-semibold text-foreground">Order Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hasCustomerDetails && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Customer Details
              </p>
              {customerName && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Name
                  </p>
                  <p className="text-sm text-foreground">{customerName}</p>
                </div>
              )}
              {customerEmail && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Email
                  </p>
                  <p className="text-sm text-foreground">{customerEmail}</p>
                </div>
              )}
              {customerPhone && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Phone
                  </p>
                  <p className="text-sm text-foreground">{customerPhone}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Delivery Information
            </p>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                Address
              </p>
              <p className="text-sm text-foreground">{formatAddress(order)}</p>
            </div>
            {order.deliveryDate && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Estimated Delivery
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(order.deliveryDate)}
                </p>
              </div>
            )}
            {order.deliveryChangeAllowed && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingDelivery((value) => !value);
                    setDeliveryNotice(null);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Change delivery
                </Button>
              </div>
            )}
            {order.customerInstructions && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Instructions
                </p>
                <p className="text-sm text-muted-foreground italic">
                  {order.customerInstructions}
                </p>
              </div>
            )}
          </div>
        </div>

        {deliveryNotice && (
          <p className="text-sm text-forest">{deliveryNotice}</p>
        )}

        {isEditingDelivery && order.deliveryChangeAllowed && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Change Delivery
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Changes are available until{" "}
                    {formatDateTime(order.deliveryChangeCutoffAt)}.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingDelivery(false)}
                  disabled={deliverySaving}
                >
                  Cancel
                </Button>
              </div>

              <div>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Saved delivery address
                  <select
                    value={deliveryAddressId}
                    onChange={(event) =>
                      setDeliveryAddressId(event.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    disabled={deliverySaving}
                  >
                    {!currentAddressId && (
                      <option value="">Current delivery address</option>
                    )}
                    {addresses.map((address) => {
                      const addressId = getAddressId(address);
                      return (
                        <option key={addressId} value={addressId}>
                          {formatAddressOption(address)}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveDelivery()}
                disabled={deliverySaving || !hasDeliveryChanges}
              >
                {deliverySaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save delivery changes
              </Button>
            </div>
          </>
        )}

        {hasPaymentDeliveryEvents && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Payment and Delivery Events
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hasPaidAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Paid At
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(order.paidAt)}
                    </p>
                  </div>
                )}
                {hasDeliveredAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Delivered At
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(deliveredAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Items Ordered
          </p>
          {canDownloadReceipt(order) && (
            <div className="mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleDownloadReceipt()}
                disabled={receiptLoading}
              >
                {receiptLoading ? "Preparing..." : "Download Receipt"}
              </Button>
            </div>
          )}
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={`${item.sku}-${i}`}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sku} x {item.quantity}
                  </p>
                </div>
                <span className="font-semibold">
                  {formatMoney(item.subtotal, order.currency || "GBP")}
                </span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency || "GBP")}</span>
          </div>
        </div>
      </div>

      {hasRefunds && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-foreground">Refunds</h3>
          {order.refunds && order.refunds.length > 0 ? (
            <div className="space-y-2">
              {order.refunds.map((refund, idx) => (
                <div
                  key={`${refund.stripeRefundId || refund.refundedAt || idx}`}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {formatMoney(
                        refund.amount ?? 0,
                        refund.currency || order.currency || "GBP",
                      )}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRefundStatusBadgeClass(refund.status || "pending")}`}
                    >
                      {formatStatusLabel(refund.status || "pending")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Refunded at:{" "}
                    {formatDateTime(
                      refund.refundedAt || refund.createdAt || null,
                    )}
                  </p>
                  {refund.reason && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reason: {refund.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">
                Legacy refund record
              </p>
              {order.refund?.refundedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Refunded at: {formatDateTime(order.refund.refundedAt)}
                </p>
              )}
              {order.refund?.reason && (
                <p className="text-xs text-muted-foreground mt-1">
                  Reason: {order.refund.reason}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {deliveryNotes && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-foreground">Delivery Notes</h3>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              Delivery Team Notes
            </p>
            <p className="text-sm text-foreground">{deliveryNotes}</p>
          </div>
        </div>
      )}

      {deliveryProofUrl && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Delivery Proof
          </h3>
          <img
            src={deliveryProofUrl}
            alt="Delivery proof"
            className="w-full max-h-[420px] object-contain rounded-lg border border-border bg-muted/20"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
