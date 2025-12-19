import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Truck, Snowflake, Star, ShoppingBag, Heart, Share2, Check } from 'lucide-react';
import { getProductById, products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/products/ProductCard';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { toast } from 'sonner';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = getProductById(id || '');
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'storage' | 'reviews'>('description');
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold mb-4">Product Not Found</h1>
          <Link to="/shop" className="btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price ?? product.price;
  const relatedProducts = products.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    toast.success(`${product.name} added to cart`, {
      description: selectedVariant ? `${selectedVariant.name} × ${quantity}` : `× ${quantity}`,
    });
  };

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'storage', label: 'Storage' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        {/* Back Button (Mobile) */}
        <button
          onClick={() => navigate(-1)}
          className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImage === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Badges */}
            {product.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.badges.map((badge) => (
                  <span key={badge} className="badge-fresh">
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Title & Price */}
            <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold text-primary mb-4">
              £{currentPrice.toFixed(2)}
            </p>

            {/* Short Description */}
            <p className="text-muted-foreground mb-6">
              {product.shortDescription}
            </p>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {product.stockStatus === 'in-stock' && (
                <>
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm text-primary font-medium">In Stock</span>
                </>
              )}
              {product.stockStatus === 'low-stock' && (
                <>
                  <Check className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gold font-medium">Low Stock - Order Soon!</span>
                </>
              )}
              {product.stockStatus === 'out-of-stock' && (
                <span className="text-sm text-destructive font-medium">Out of Stock</span>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {variant.name} - £{variant.price.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <QuantityStepper
                quantity={quantity}
                onQuantityChange={setQuantity}
                size="lg"
              />
              <button
                onClick={handleAddToCart}
                disabled={product.stockStatus === 'out-of-stock'}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Cart
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mb-8">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-sm">Add to Wishlist</span>
              </button>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Share</span>
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Next-Day Delivery Available</p>
                  <p className="text-xs text-muted-foreground">Order before 2pm for next-day delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Snowflake className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Delivered Chilled</p>
                  <p className="text-xs text-muted-foreground">Insulated packaging keeps products fresh</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-16">
          <div className="border-b border-border mb-6">
            <div className="flex gap-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-3xl">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed">{product.longDescription}</p>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-4">
                {product.ingredients && (
                  <div>
                    <h4 className="font-medium mb-2">Ingredients</h4>
                    <p className="text-muted-foreground">{product.ingredients}</p>
                  </div>
                )}
                {product.allergens && (
                  <div>
                    <h4 className="font-medium mb-2">Allergens</h4>
                    <p className="text-destructive">{product.allergens}</p>
                  </div>
                )}
                {!product.ingredients && !product.allergens && (
                  <p className="text-muted-foreground">No ingredient information available.</p>
                )}
              </div>
            )}

            {activeTab === 'storage' && (
              <div>
                {product.storage ? (
                  <p className="text-muted-foreground">{product.storage}</p>
                ) : (
                  <p className="text-muted-foreground">Keep refrigerated at 1-4°C.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">Based on 24 reviews</span>
                </div>
                <div className="bg-secondary/30 rounded-xl p-6 text-center">
                  <p className="text-muted-foreground mb-4">Be the first to share your thoughts!</p>
                  <button className="btn-outline">Write a Review</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl font-semibold mb-8">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
