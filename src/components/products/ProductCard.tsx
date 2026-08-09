import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Product, ProductVariant } from "@/data/products";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { resolveImageUrl } from "@/api/client";
import { isPortalLoggedIn } from "@/lib/portalAuth";

interface ProductCardProps {
  product: Product;
  lockedVariantId?: string;
  hideVariantSelector?: boolean;
  actionLabel?: string;
  onAction?: (params: {
    product: Product;
    variant: ProductVariant | undefined;
    quantity: number;
  }) => void;
  hideQuantityStepper?: boolean;
  actionClassName?: string;
  afterActionContent?: (params: {
    product: Product;
    variant: ProductVariant | undefined;
    quantity: number;
  }) => React.ReactNode;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lockedVariantId,
  hideVariantSelector,
  actionLabel,
  onAction,
  hideQuantityStepper,
  actionClassName,
  afterActionContent,
}) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const initialVariant = useMemo<ProductVariant | undefined>(() => {
    if (!product.variants?.length) return undefined;
    if (lockedVariantId) {
      return product.variants.find((v) => v.id === lockedVariantId);
    }
    return product.variants[0];
  }, [lockedVariantId, product.variants]);

  const [selectedVariant, setSelectedVariant] = useState<
    ProductVariant | undefined
  >(initialVariant);

  useEffect(() => {
    setSelectedVariant(initialVariant);
  }, [initialVariant, product.id]);

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStockStatus =
    selectedVariant?.stockStatus ?? product.stockStatus;

  const isVariantCard = Boolean(
    (hideVariantSelector || lockedVariantId) && selectedVariant,
  );

  const productLink = useMemo(() => {
    if (isVariantCard && selectedVariant?.id) {
      return {
        pathname: `/product/${product.id}`,
        search: `?variant=${encodeURIComponent(selectedVariant.id)}`,
      };
    }
    return `/product/${product.id}`;
  }, [isVariantCard, product.id, selectedVariant?.id]);

  const displayTitle = useMemo(() => {
    if ((hideVariantSelector || lockedVariantId) && selectedVariant) {
      return `${product.name} - ${selectedVariant.name}`;
    }
    return product.name;
  }, [hideVariantSelector, lockedVariantId, product.name, selectedVariant]);

  const displayImage = useMemo(() => {
    const images = Array.isArray(product.images) ? product.images : [];
    const fallback = images[0];
    if (!selectedVariant) return fallback;

    const variantImage = resolveImageUrl(
      (selectedVariant as any).thumbnailImage ??
        (selectedVariant as any).image ??
        (selectedVariant as any).imageUrl ??
        (selectedVariant as any).imageId,
    );
    if (variantImage) return variantImage;

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const variantIndex = product.variants.findIndex(
        (v) => v.id === selectedVariant.id,
      );
      const candidate =
        variantIndex >= 0 ? images[variantIndex + 1] : undefined;
      if (candidate) return candidate;
    }

    return fallback;
  }, [product.images, product.variants, selectedVariant]);

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAction) {
      onAction({ product, variant: selectedVariant, quantity });
      return;
    }

    if (isPortalLoggedIn()) {
      navigate("/portal/subscriptions/new");
      return;
    }

    navigate(
      `/login?redirect=${encodeURIComponent("/portal/subscriptions/new")}`,
    );
  };

  const getBadgeClass = (badge: string) => {
    switch (badge.toLowerCase()) {
      case "bestseller":
      case "award winning":
        return "badge-bestseller";
      case "limited":
      case "local":
      case "raw":
        return "badge-gold";
      default:
        return "badge-fresh";
    }
  };

  return (
    <div className="card-product group flex h-full flex-col">
      <Link to={productLink} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Badges */}
          {product.badges.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {product.badges.slice(0, 2).map((badge) => (
                <span key={badge} className={getBadgeClass(badge)}>
                  {badge}
                </span>
              ))}
            </div>
          )}
          {/* Stock Status */}
          {currentStockStatus === "low-stock" && (
            <span className="absolute top-3 right-3 badge-gold">Low Stock</span>
          )}
          {currentStockStatus === "out-of-stock" && (
            <span className="absolute top-3 right-3 badge-bestseller">
              Out of Stock
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {product.category}
          </p>

          {/* Name */}
          <h3
            className={
              isVariantCard
                ? "font-heading text-lg font-medium mb-1 whitespace-normal break-words"
                : "font-heading text-lg font-medium mb-1 line-clamp-1"
            }
          >
            {displayTitle}
          </h3>

          {/* Price */}
          <p className="mt-3 text-lg font-semibold text-primary">
            £{currentPrice.toFixed(2)}
          </p>
        </div>
      </Link>

      {/* Add to Cart Section */}
      <div className="mt-auto px-4 pb-4 pt-0">
        {/* Variant Selector */}
        {!hideVariantSelector &&
          product.variants &&
          product.variants.length > 1 && (
            <div className="mb-3">
              <select
                value={selectedVariant?.id || ""}
                onChange={(e) => {
                  const variant = product.variants?.find(
                    (v) => v.id === e.target.value,
                  );
                  setSelectedVariant(variant);
                }}
                className="w-full input-field text-sm py-2"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} - £{variant.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

        {/* Quantity and action button */}
        <div className="flex items-center gap-3">
          {!hideQuantityStepper && (
            <div className="shrink-0 [&>div]:h-10">
              <QuantityStepper
                quantity={quantity}
                onQuantityChange={setQuantity}
                size="sm"
              />
            </div>
          )}
          <button
            onClick={handleAction}
            disabled={currentStockStatus === "out-of-stock"}
            className={`h-10 min-w-0 flex-1 btn-primary flex items-center justify-center gap-2 whitespace-nowrap px-3 py-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              actionClassName || ""
            }`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap text-sm">
              {actionLabel || "Subscribe"}
            </span>
          </button>
        </div>

        {afterActionContent && (
          <div className="mt-3">
            {afterActionContent({
              product,
              variant: selectedVariant,
              quantity,
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
