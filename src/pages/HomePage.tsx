import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  Leaf,
  Shield,
  Snowflake,
  Star,
  MapPin,
  Quote,
  RefreshCw,
} from "lucide-react";
import { useProducts } from "@/context/Products/ProductsContext";
import { resolveImageUrl } from "@/api/client";
import ProductCard from "@/components/products/ProductCard";
import CategoryCard from "@/components/products/CategoryCard";
import OrderTypeChoice from "@/components/commerce/OrderTypeChoice";
import FeaturedDeals from "@/components/deals/FeaturedDeals";
import heroImage from "@/assets/hero-farm.jpg";
import { checkDeliveryPostcode } from "@/api/delivery";
import { useBusinessInfo } from "@/context/BusinessInfoContext";
import { useCart } from "@/context/CartContext";
import { sortByStorefrontCategoryOrder } from "@/lib/categoryOrder";
import { toast } from "sonner";
import { isPortalLoggedIn } from "@/lib/portalAuth";
import { cn } from "@/lib/utils";

const HomePage: React.FC = () => {
  const { products, meta, fetchProducts } = useProducts();
  const { addItem } = useCart();
  const businessInfo = useBusinessInfo();
  const subscriptionPath = "/portal/subscriptions/new";
  const subscriptionHref = isPortalLoggedIn()
    ? subscriptionPath
    : `/login?redirect=${encodeURIComponent(subscriptionPath)}`;
  const [postcode, setPostcode] = useState("");
  const [checkingPostcode, setCheckingPostcode] = useState(false);
  const [postcodeResult, setPostcodeResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const postcodeResultStyle = cn(
    "text-sm font-semibold leading-6 sm:text-base",
    postcodeResult?.type === "success"
      ? "text-emerald-300"
      : "text-gold",
  );

  const handleCheckPostcode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostcodeResult(null);
    if (!postcode.trim()) {
      setPostcodeResult({
        type: "error",
        message: "Please enter your postcode.",
      });
      return;
    }

    setCheckingPostcode(true);
    try {
      const res = await checkDeliveryPostcode(postcode);
      if (res.deliverable) {
        setPostcodeResult({
          type: "success",
          message: res.message || "Great news — we deliver to your area.",
        });
      } else {
        setPostcodeResult({
          type: "error",
          message:
            res.message ||
            "Sorry — we don’t currently deliver to this postcode.",
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to check postcode. Please try again.";
      setPostcodeResult({ type: "error", message });
    } finally {
      setCheckingPostcode(false);
    }
  };

  useEffect(() => {
    if (products.length === 0) fetchProducts({});
  }, [fetchProducts, products.length]);

  const bestSellerProducts = useMemo(() => {
    const bestSellerCategories = new Set([
      "milk",
      "eggs",
      "butter",
      "honey",
      "bread",
    ]);

    const filtered = products.filter((p) => {
      const category = String(p.category || "")
        .trim()
        .toLowerCase();
      return bestSellerCategories.has(category);
    });

    return filtered.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.pricing.min,
      shortDescription: p.description.slice(0, 120),
      longDescription: p.description,
      allergens: p.allergens,
      storageNotes: p.storageNotes,
      images: [
        resolveImageUrl(p.thumbnailImage),
        ...p.galleryImages.map(resolveImageUrl),
      ].filter((u): u is string => Boolean(u)),
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        ingredients: v.ingredients,
        allergens: v.allergens,
        nutritionalInformation: v.nutritionalInformation,
        price: v.price,
        thumbnailImage: v.thumbnailImage,
        stockStatus:
          v.stockQuantity <= 0
            ? ("out-of-stock" as const)
            : v.lowStock
              ? ("low-stock" as const)
              : ("in-stock" as const),
      })),
      stockStatus: p.variants.every((v) => v.stockQuantity <= 0)
        ? ("out-of-stock" as const)
        : ("in-stock" as const),
      badges: [] as string[],
    }));
  }, [products]);

  const shopByCategoryItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const key = String(product.category || "")
        .trim()
        .toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    if (!meta?.categories?.length) return [];

    // Deduplicate by lowercase title, preferring entries with an image
    const seen = new Map<string, (typeof meta.categories)[number]>();
    for (const cat of meta.categories) {
      const key = cat.title.trim().toLowerCase();
      if (!key) continue;
      const existing = seen.get(key);
      if (!existing || (!existing.image && cat.image)) {
        seen.set(key, cat);
      }
    }

    return sortByStorefrontCategoryOrder(
      Array.from(seen.values()).map((cat) => {
        const slug = cat.title.trim().toLowerCase();
        return {
          id: slug,
          name: cat.title,
          slug,
          description: cat.subtitle,
          image: cat.image?.url ?? "",
          productCount: counts.get(slug) ?? 0,
        };
      }),
      (category) => category.name,
    );
  }, [products, meta]);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Mitchen",
      location: "Bradford",
      rating: 5,
      text: "Great products and amazing service. Would highly recommend.",
      imageSrc: "/reviews/rev1.jpeg",
      imageAlt: "Levants delivery at the doorstep",
    },
    {
      id: 2,
      name: "Fatima",
      location: "Dewsbury",
      rating: 5,
      text: "Best tasting milkshakes. Kids loved them. The eggs have a beautiful goldy yolk. Quality products and does not break the bank.",
      imageSrc: "/reviews/rev2.jpeg",
      imageAlt: "Milk, milkshakes, and eggs delivered",
    },
    {
      id: 3,
      name: "Adam",
      location: "Bradford",
      rating: 5,
      text: `Been ordering from ${businessInfo.companyName} for the last 9 months. Huge difference compared to superamarkets`,
      imageSrc: "/reviews/rev3.jpeg",
      imageAlt: `${businessInfo.companyName} delivery`,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero and deals */}
      <section aria-labelledby="home-heading" className="relative isolate overflow-hidden bg-forest-dark text-white">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
        </div>
        <div className="container-custom grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,4.5fr)_minmax(0,7.5fr)] lg:gap-10 lg:py-16">
          <div className="min-w-0 max-w-xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              <Leaf className="h-4 w-4" aria-hidden="true" /> Fresh from the farm
            </p>
            <h1 id="home-heading" className="font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-5xl xl:text-6xl">
              Farm fresh.<br />
              To your doorstep.
            </h1>
            <p className="mb-7 mt-5 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              Milk, dairy and everyday favourites, delivered fresh. Order once or make it a weekly ritual.
            </p>
            <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/shop"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Shop fresh <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to={subscriptionHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Weekly subscription <RefreshCw className="w-4 h-4" aria-hidden="true" />
                </Link>
            </div>
            <div className="mt-8 border-t border-white/25 pt-6">
              <label htmlFor="hero-postcode" className="mb-3 block text-sm font-medium">
                Fresh delivery starts with your postcode
              </label>
                <form
                  className="max-w-md"
                  onSubmit={handleCheckPostcode}
                >
                  <div className="flex items-stretch gap-2 rounded-full border border-white/30 bg-white/10 p-1.5 backdrop-blur-md focus-within:ring-2 focus-within:ring-white/70">
                    <div className="relative min-w-0 flex-1">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/85" aria-hidden="true" />
                      <input
                        id="hero-postcode"
                        type="text"
                        placeholder="Enter your postcode"
                        autoComplete="postal-code"
                        className="h-11 w-full rounded-full bg-transparent pl-9 pr-2 text-sm uppercase text-white placeholder:normal-case placeholder:text-white/75 focus:outline-none"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        disabled={checkingPostcode}
                        aria-describedby={postcodeResult ? "hero-postcode-result" : undefined}
                      />
                    </div>
                    <button
                      className="shrink-0 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:px-5 sm:text-sm"
                      type="submit"
                      disabled={checkingPostcode}
                    >
                      {checkingPostcode ? "Checking…" : "Check delivery"}
                    </button>
                  </div>
                </form>
                {postcodeResult && (
                  <p id="hero-postcode-result" className={cn("mt-3 max-w-md", postcodeResultStyle)} role="status" aria-live="polite">
                    <span>{postcodeResult.message}</span>
                  </p>
                )}
                <Link
                  to="/delivery"
                  className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-sm text-xs text-white/80 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  How delivery works <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/85">
              <div className="flex items-center gap-1.5">
                <Leaf className="h-4 w-4 text-gold" aria-hidden="true" />
                <span>Farm fresh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Snowflake className="h-4 w-4 text-gold" aria-hidden="true" />
                <span>Chilled delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-gold" aria-hidden="true" />
                <span>Secure checkout</span>
              </div>
            </div>
          </div>
          <FeaturedDeals fallbackImage={heroImage} onImage />
        </div>
      </section>

      <section className="border-b border-border bg-secondary/30 py-14 lg:py-20">
        <div className="container-custom">
          <OrderTypeChoice id="order-options" />
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse our range by category.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {shopByCategoryItems.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellerProducts.length > 0 && (
        <section className="py-16 lg:py-24 bg-secondary/30">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
                  Best Sellers
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  Our most loved products: milk, eggs, butter, honey, and bread.
                </p>
              </div>
              <Link
                to="/shop"
                className="hidden sm:inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
              >
                View All Products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestSellerProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="h-full opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProductCard
                    product={product}
                    actionLabel="Add to basket"
                    onAction={({ product, variant, quantity }) => {
                      addItem(product, variant, quantity);
                      toast.success(`${product.name} added to your basket`, {
                        description: `${variant?.name || "Selected option"} × ${quantity}`,
                      });
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="sm:hidden mt-8 text-center">
              <Link
                to="/shop"
                className="btn-outline inline-flex items-center gap-2"
              >
                View All Products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting farm-fresh dairy delivered to your door is as easy as 1,
              2, 3.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Choose How to Order",
                description:
                  "Place a one-time order or set up a flexible weekly subscription.",
                icon: "🗓️",
              },
              {
                step: "02",
                title: "Pick Your Favourites",
                description:
                  "Choose fresh milk, cream, butter, eggs, bakery favourites, and more.",
                icon: "🛒",
              },
              {
                step: "03",
                title: "Receive Fresh & Chilled",
                description:
                  "Your order arrives in temperature controlled refrigerated vans to keep everything perfectly fresh.",
                icon: "❄️",
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="text-center p-6 rounded-2xl bg-card border border-border opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-sm text-primary font-semibold mb-2">
                  Step {item.step}
                </div>
                <h3 className="font-heading text-xl font-medium mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Area */}
      <section
        id="postcode-check"
        className="py-16 lg:py-24 bg-primary text-primary-foreground"
      >
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <Truck className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              Do We Deliver to You?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              We currently deliver to Bradford and surrounding areas. Enter your
              postcode to confirm we deliver to your area.
            </p>
            <form className="max-w-xl mx-auto" onSubmit={handleCheckPostcode}>
              <div className="flex flex-col sm:flex-row sm:items-stretch rounded-xl overflow-hidden border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/80" />
                  <input
                    type="text"
                    placeholder="Enter your postcode"
                    className="w-full h-12 pl-10 pr-4 bg-transparent text-primary-foreground placeholder:text-primary-foreground/70 focus:outline-none"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    disabled={checkingPostcode}
                  />
                </div>
                <button
                  className="btn-gold whitespace-nowrap rounded-none"
                  type="submit"
                  disabled={checkingPostcode}
                >
                  {checkingPostcode ? "Checking..." : "Check My Postcode"}
                </button>
              </div>

              {postcodeResult && (
                <div
                  className={cn("mt-4 text-left", postcodeResultStyle)}
                  role="status"
                  aria-live="polite"
                >
                  <span>{postcodeResult.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of happy customers enjoying farm-fresh dairy.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-3 lg:gap-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="bg-card p-4 lg:p-6 rounded-2xl border border-border opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                {testimonial.imageSrc ? (
                  <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={testimonial.imageSrc}
                      alt={testimonial.imageAlt || testimonial.name}
                      className="w-full aspect-[3/4] object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-4">
              Ordered from us? We'd love to hear what you think.
            </p>
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Leave a Review
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container-custom">
          <div className="bg-card rounded-3xl p-8 lg:p-12 text-center border border-border shadow-large">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              Ready to Taste the Difference?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Experience the taste of freshness and support local farms with
              every delivery.
            </p>
            <Link
              to="/shop"
              className="btn-primary inline-flex items-center gap-2"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
