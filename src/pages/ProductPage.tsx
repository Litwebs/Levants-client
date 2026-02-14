import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Truck, Snowflake, Star, ShoppingBag, Share2, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useProducts } from '@/context/Products/ProductsContext';
import { getFileUrl } from '@/api/client';
import { useCart } from '@/context/CartContext';
import QuantityStepper from '@/components/ui/QuantityStepper';
import ProductCard from '@/components/products/ProductCard';
import { toast } from 'sonner';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProduct, loading, fetchProductById, products, fetchProducts } = useProducts();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id]);

  useEffect(() => {
    if (products.length === 0) fetchProducts({});
  }, []);

  const product = currentProduct;

  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0]);

  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedVariant(product.variants[0]);
      setActiveImage(0);
    }
  }, [product]);

  const images = useMemo(() => {
    if (!product) return [];
    return [getFileUrl(product.thumbnailImage), ...product.galleryImages.map(getFileUrl)];
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [products, product]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold mb-4">Product Not Found</h1>
          <Link to="/shop" className="btn-primary">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price ?? product.pricing.min;
  const isOutOfStock = selectedVariant ? selectedVariant.stockQuantity <= 0 : product.variants.every(v => v.stockQuantity <= 0);
  const isLowStock = selectedVariant?.lowStock ?? false;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    // Map to CartContext expected shape
    const cartProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.pricing.min,
      shortDescription: product.description.slice(0, 120),
      longDescription: product.description,
      images,
      variants: product.variants.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price,
        stockStatus: v.stockQuantity <= 0 ? 'out-of-stock' as const : v.lowStock ? 'low-stock' as const : 'in-stock' as const,
      })),
      stockStatus: isOutOfStock ? 'out-of-stock' as const : 'in-stock' as const,
      badges: [] as string[],
    };
    const cartVariant = {
      id: selectedVariant.id,
      name: selectedVariant.name,
      price: selectedVariant.price,
      stockStatus: selectedVariant.stockQuantity <= 0 ? 'out-of-stock' as const : selectedVariant.lowStock ? 'low-stock' as const : 'in-stock' as const,
    };
    addItem(cartProduct, cartVariant, quantity);
    toast.success(`${product.name} added to cart`, {
      description: `${selectedVariant.name} × ${quantity}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <button onClick={() => navigate(-1)} className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === index ? 'border-primary' : 'border-transparent hover:border-border'}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">{product.name}</h1>

            <p className="text-2xl font-semibold text-primary mb-4">
              {product.pricing.min === product.pricing.max
                ? `£${currentPrice.toFixed(2)}`
                : `£${product.pricing.min.toFixed(2)} – £${product.pricing.max.toFixed(2)}`}
            </p>

            <p className="text-muted-foreground mb-6">{product.description.slice(0, 200)}</p>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {isOutOfStock ? (
                <span className="text-sm text-destructive font-medium">Out of Stock</span>
              ) : isLowStock ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gold font-medium">Low Stock – Order Soon!</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm text-primary font-medium">In Stock</span>
                </>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Select Option</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stockQuantity <= 0}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {variant.name} – £{variant.price.toFixed(2)}
                      {variant.lowStock && variant.stockQuantity > 0 && (
                        <span className="ml-1.5 text-xs text-gold">(Low stock)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <QuantityStepper quantity={quantity} onQuantityChange={setQuantity} size="lg" />
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" /> Add to Cart
              </button>
            </div>

            {/* Share */}
            <div className="flex items-center gap-4 mb-8">
              <button onClick={handleShare} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
              {[
                { id: 'description', label: 'Description' },
                { id: 'reviews', label: 'Reviews' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-3xl">
            {activeTab === 'description' && (
              <p className="text-foreground leading-relaxed">{product.description}</p>
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
            <h2 className="font-heading text-2xl font-semibold mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => {
                const mapped = {
                  id: rp.id,
                  name: rp.name,
                  category: rp.category,
                  price: rp.pricing.min,
                  shortDescription: rp.description.slice(0, 120),
                  longDescription: rp.description,
                  images: [getFileUrl(rp.thumbnailImage), ...rp.galleryImages.map(getFileUrl)],
                  variants: rp.variants.map(v => ({
                    id: v.id, name: v.name, price: v.price,
                    stockStatus: v.stockQuantity <= 0 ? 'out-of-stock' as const : v.lowStock ? 'low-stock' as const : 'in-stock' as const,
                  })),
                  stockStatus: rp.variants.every(v => v.stockQuantity <= 0) ? 'out-of-stock' as const : 'in-stock' as const,
                  badges: [] as string[],
                };
                return <ProductCard key={rp.id} product={mapped} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
