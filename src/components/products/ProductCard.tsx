import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingBag } from 'lucide-react';
import { Product, ProductVariant } from '@/data/products';
import { useCart } from '@/context/CartContext';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.[0]
  );
  const { addItem } = useCart();

  const currentPrice = selectedVariant?.price ?? product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, selectedVariant, quantity);
    toast.success(`${product.name} added to cart`, {
      description: selectedVariant ? `${selectedVariant.name} × ${quantity}` : `× ${quantity}`,
    });
    setQuantity(1);
  };

  const getBadgeClass = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'bestseller':
      case 'award winning':
        return 'badge-bestseller';
      case 'limited':
      case 'local':
      case 'raw':
        return 'badge-gold';
      default:
        return 'badge-fresh';
    }
  };

  return (
    <div className="card-product group">
      <Link to={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
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
          {product.stockStatus === 'low-stock' && (
            <span className="absolute top-3 right-3 badge-gold">
              Low Stock
            </span>
          )}
          {product.stockStatus === 'out-of-stock' && (
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
          <h3 className="font-heading text-lg font-medium mb-1 line-clamp-1">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.shortDescription}
          </p>

          {/* Price */}
          <p className="text-lg font-semibold text-primary mb-3">
            £{currentPrice.toFixed(2)}
          </p>
        </div>
      </Link>

      {/* Add to Cart Section */}
      <div className="px-4 pb-4 pt-0">
        {/* Variant Selector */}
        {product.variants && product.variants.length > 1 && (
          <div className="mb-3">
            <select
              value={selectedVariant?.id || ''}
              onChange={(e) => {
                const variant = product.variants?.find((v) => v.id === e.target.value);
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
            disabled={product.stockStatus === 'out-of-stock'}
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
