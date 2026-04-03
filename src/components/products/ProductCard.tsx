import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Product, ProductVariant } from "@/data/products";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { toast } from "sonner";
import { resolveImageUrl } from "@/api/client";

interface ProductCardProps {
  product: Product;
  lockedVariantId?: string;
  hideVariantSelector?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lockedVariantId,
  hideVariantSelector,
}) => {
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
  const { addItem } = useCart();

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

  const allergensText = (() => {
    const allergens = (product as any)?.allergens;
    if (Array.isArray(allergens))
      return allergens.length ? allergens.join(", ") : "None";
    if (typeof allergens === "string")
      return allergens.trim() ? allergens.trim() : "None";
    return "None";
  })();

  const storageNotesText = (() => {
    const storageNotes =
      (product as any)?.storageNotes ?? (product as any)?.storage;
    if (typeof storageNotes === "string")
      return storageNotes.trim() ? storageNotes.trim() : "Not provided";
    return "Not provided";
  })();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, selectedVariant, quantity);
    toast.success(`${product.name} added to cart`, {
      description: selectedVariant
        ? `${selectedVariant.name} × ${quantity}`
        : `× ${quantity}`,
    });
    setQuantity(1);
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

          {(hideVariantSelector || lockedVariantId) &&
            product.variants &&
            product.variants.length > 1 &&
            selectedVariant && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {selectedVariant.name}
              </p>
            )}

          {/* Short Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.shortDescription}
          </p>

          <div className="space-y-1 mb-3">
            <p className="text-xs text-muted-foreground line-clamp-2">
              <span className="font-medium">Allergens:</span> {allergensText}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              <span className="font-medium">Storage notes:</span>{" "}
              {storageNotesText}
            </p>
          </div>

          {/* Price */}
          <p className="text-lg font-semibold text-primary mb-3">
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

        {/* Quantity and Add to Cart */}
        <div className="flex items-center gap-3">
          <QuantityStepper
            quantity={quantity}
            onQuantityChange={setQuantity}
            size="sm"
          />
          <button
            onClick={handleAddToCart}
            disabled={currentStockStatus === "out-of-stock"}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
