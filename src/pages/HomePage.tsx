import React, { useEffect, useMemo } from "react";
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
import heroImage from "@/assets/hero-farm.jpg";

const HomePage: React.FC = () => {
  const { products, fetchProducts } = useProducts();

  useEffect(() => {
    if (products.length === 0) fetchProducts({});
  }, []);

  const featuredProducts = useMemo(() => {
    return products.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.pricing.min,
      shortDescription: p.description.slice(0, 120),
      longDescription: p.description,
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

  const testimonials = [
    {
      id: 1,
      name: "Sarah Mitchell",
      location: "Cambridge",
      rating: 5,
      text: "The freshest milk I've ever tasted! You can really tell the difference compared to supermarket brands. Our whole family loves it.",
    },
    {
      id: 2,
      name: "James Thompson",
      location: "Oxford",
      rating: 5,
      text: "The mature cheddar is absolutely divine. Perfectly aged with incredible depth of flavour. Will be ordering again!",
    },
    {
      id: 3,
      name: "Emma Wilson",
      location: "Norwich",
      rating: 5,
      text: "So convenient having fresh dairy delivered to my door. The milkshakes are a particular favourite with my kids!",
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
              Farm-fresh dairy, delivered to your door.
            </h1>
            <p className="text-lg sm:text-xl text-card/90 mb-8 opacity-0 animate-fade-in-up stagger-1">
              Milk, milkshakes, double cream, butter, and artisan cheeses—fresh
              and local from our farm to your table.
            </p>
            <div className="flex flex-wrap gap-4 mb-10 opacity-0 animate-fade-in-up stagger-2">
              <Link
                to="/shop"
                className="btn-primary inline-flex items-center gap-2"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/delivery"
                className="btn-secondary inline-flex items-center gap-2"
              >
                How Delivery Works
              </Link>
            </div>
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

      {/* Best Sellers */}
      {featuredProducts.length > 0 && (
        <section className="py-16 lg:py-24 bg-secondary/30">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
                  Our Products
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  Our most loved products, handpicked by our customers.
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
              {featuredProducts.map((product, index) => (
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
                  "Enter your delivery details and pay securely via Stripe.",
                icon: "💳",
              },
              {
                step: "03",
                title: "Receive Fresh & Chilled",
                description:
                  "Your order arrives in insulated packaging to keep everything perfectly fresh.",
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
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <Truck className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              Do We Deliver to You?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              We deliver locally with chilled packaging to keep your dairy
              perfectly fresh.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Enter your postcode"
                className="flex-1 px-4 py-3 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground/50 transition-colors"
              />
              <button className="btn-gold">Check Availability</button>
            </div>
            <p className="text-sm text-primary-foreground/60 mt-4">
              Free delivery on orders over £25
            </p>
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
              Experience the freshness of farm-to-door dairy. Order today and
              enjoy free delivery on your first order over £25.
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
