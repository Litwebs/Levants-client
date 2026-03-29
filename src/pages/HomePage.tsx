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
} from "lucide-react";
import { useProducts } from "@/context/Products/ProductsContext";
import { resolveImageUrl } from "@/api/client";
import ProductCard from "@/components/products/ProductCard";
import CategoryCard from "@/components/products/CategoryCard";
import heroImage from "@/assets/hero-farm.jpg";
import productEgg from "../../public/categories/eggs.jpeg";
import productJuice from "../../public/categories/juices.jpeg";
import productMilk from "../../public/categories/milk.jpeg";
import productCream from "../../public/categories/cream.jpeg";
import productMilkshake from "../../public/categories/milkshakes.jpeg";
import productButter from "../../public/categories/butter.jpeg";
import productCheddar from "../../public/categories/cheese.jpeg";
import productBakery from "../../public/categories/bakary.jpeg";
import productHoney from "../../public/categories/honey.jpeg";
import productGhee from "../../public/categories/ghee.jpeg";
import { checkDeliveryPostcode } from "@/api/delivery";

const SHOP_BY_CATEGORY = [
  {
    slug: "milk",
    name: "Milk",
    description: "Farm fresh, unhomogenised",
    image: productMilk,
  },
  {
    slug: "cream",
    name: "Cream",
    description: "Grass fed, free range",
    image: productCream,
  },
  {
    slug: "milkshakes",
    name: "Milkshakes",
    description: "Fresh, no additives or preservatives",
    image: productMilkshake,
  },
  {
    slug: "eggs",
    name: "Eggs",
    description: "Free range, golden yolks",
    image: productEgg,
  },
  {
    slug: "butter",
    name: "Butter",
    description: "Grass fed, farmhouse",
    image: productButter,
  },
  {
    slug: "ghee",
    name: "Ghee",
    description: "Grass fed, free range",
    image: productGhee,
  },
  {
    slug: "cheese",
    name: "Cheese",
    description: "Award winning, traditional",
    image: productCheddar,
  },
  {
    slug: "honey",
    name: "Honey",
    description: "Raw, local, award winning",
    image: productHoney,
  },
  {
    slug: "juices",
    name: "Juices",
    description: "Fresh juices",
    image: productJuice,
  },
  {
    slug: "bread",
    name: "Bakery",
    description: "Freshly baked, artisanal",
    image: productBakery,
  },
] as const;

const HomePage: React.FC = () => {
  const { products, fetchProducts } = useProducts();
  const [postcode, setPostcode] = useState("");
  const [checkingPostcode, setCheckingPostcode] = useState(false);
  const [postcodeResult, setPostcodeResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
  }, []);

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

    return SHOP_BY_CATEGORY.map((c) => ({
      id: c.slug,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      productCount: counts.get(c.slug) ?? 0,
    }));
  }, [products]);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Mitchen",
      location: "Bradford",
      rating: 5,
      text: "Great products and amazing service. Would highly recommend.",
      imageSrc: "/reviews/sarah.jpg",
      imageAlt: "Levants delivery at the doorstep",
    },
    {
      id: 2,
      name: "Craig",
      location: "Leeds",
      rating: 5,
      text: "The freshest best tasting milk I’ve ever had with cream on top just like the good old days. In glass bottle too. Would highly recommend!",
      imageSrc: "/reviews/craig.jpg",
      imageAlt: "Glass bottles of milk outside a door",
    },
    {
      id: 3,
      name: "Fatima",
      location: "Dewsbury",
      rating: 5,
      text: "Best tasting milkshakes. Kids loved them. The eggs have a beautiful goldy yolk. Quality products and does not break the bank.",
      imageSrc: "/reviews/fatima.jpg",
      imageAlt: "Milk, milkshakes, and eggs delivered",
    },
    {
      id: 4,
      name: "Adam",
      location: "Bradford",
      rating: 5,
      text: "Been ordering from Levants Dairy for the last 9 months. Huge difference compared to superamarkets",
      imageSrc: "/reviews/adam.jpg",
      imageAlt: "Levants Dairy delivery",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Beautiful countryside farm with grazing cows"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/50 to-transparent" />
        </div>
        <div className="container-custom relative z-10 py-20">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-card mb-6 opacity-0 animate-fade-in-up">
              Farm-fresh milk, dairy, and more—delivered to your doorstep. 🥛 🚪
            </h1>
            <p className="text-lg sm:text-xl text-card/90 mb-8 opacity-0 animate-fade-in-up stagger-1">
              Milk, Milkshakes, Cream, Butter, Eggs and more - Fresh and Local
            </p>
            <div className="flex flex-col gap-4 mb-6 opacity-0 animate-fade-in-up stagger-2">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
                <Link
                  to="/shop"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>

                <form
                  className="w-full sm:w-auto"
                  onSubmit={handleCheckPostcode}
                >
                  <div className="flex flex-col sm:flex-row sm:items-stretch rounded-xl overflow-hidden border border-card/20 bg-card/15 backdrop-blur-sm">
                    <div className="relative flex-1 sm:w-72">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-card/80" />
                      <input
                        type="text"
                        placeholder="Enter your postcode"
                        className="w-full h-12 pl-10 pr-4 bg-transparent text-card placeholder:text-card/70 focus:outline-none"
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
                </form>

                <Link
                  to="/delivery"
                  className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
                >
                  How Delivery Works
                </Link>
              </div>
            </div>

            {postcodeResult && (
              <div
                className="mb-4 text-base font-semibold text-card bg-card/10 border border-card/20 rounded-xl px-4 py-3 opacity-0 animate-fade-in-up"
                role="status"
                aria-live="polite"
              >
                {postcodeResult.message}
              </div>
            )}
            <div className="flex flex-wrap gap-6 opacity-0 animate-fade-in-up stagger-3">
              <div className="trust-badge text-card/80">
                <Leaf className="w-5 h-5 text-gold" />
                <span>Farm Fresh</span>
              </div>
              <div className="trust-badge text-card/80">
                <MapPin className="w-5 h-5 text-gold" />
                <span>Local</span>
              </div>
              <div className="trust-badge text-card/80">
                <Snowflake className="w-5 h-5 text-gold" />
                <span>Chilled Delivery</span>
              </div>
              <div className="trust-badge text-card/80">
                <Shield className="w-5 h-5 text-gold" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
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
                  <ProductCard product={product} />
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
                title: "Choose Your Favourites",
                description:
                  "Browse our range of fresh milk, cream, butter, cheese, and more.",
                icon: "🛒",
              },
              {
                step: "02",
                title: "Checkout Securely",
                description:
                  "Enter your delivery details and pay securely via Apple Pay, Google Pay, or credit card.",
                icon: "💳",
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
                  className="mt-4 text-base font-semibold text-primary-foreground bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl px-4 py-3 opacity-0 animate-fade-in-up"
                  role="status"
                  aria-live="polite"
                >
                  {postcodeResult.message}
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
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="bg-card p-6 lg:p-8 rounded-2xl border border-border opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                {testimonial.imageSrc ? (
                  <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={testimonial.imageSrc}
                      alt={testimonial.imageAlt || testimonial.name}
                      className="w-full aspect-[4/3] object-cover"
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
