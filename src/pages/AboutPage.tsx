import React from "react";
import { Link } from "react-router-dom";
import { Leaf, Heart, Award, Truck, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-farm.jpg";

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Leaf,
      title: "Unbeatable Freshness",
      description:
        "We pride ourselves on delivering milk the very same day it's milked, ensuring ultimate freshness.",
    },
    {
      icon: Heart,
      title: "Supporting Local Farmers",
      description:
        "Our mission is to offer top-quality goods sourced exclusively from local Yorkshire family-run farms.",
    },
    {
      icon: Award,
      title: "100% Natural",
      description:
        "Enjoy pure, wholesome products with no chemicals, additives, preservatives, or hormones.",
    },
    {
      icon: Truck,
      title: "Convenient Delivery",
      description:
        "Get fresh milk delivered twice a week, right to your doorstep, in our temperature-controlled refrigerated vans.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Our farm"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl lg:text-5xl font-semibold text-card mb-6">
              About Us
            </h1>
            <p className="text-lg text-card/90">
              We're a small, dedicated team passionate about bringing the finest
              milk, dairy, and more directly from local Yorkshire family-run
              farms to your doorstep.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-6">
                Our Mission
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We're a small, dedicated team passionate about bringing the
                  finest milk, dairy, and more directly from local Yorkshire
                  family-run farms to your doorstep. Our mission is to make
                  top-quality, farm-fresh goods accessible and affordable for
                  everyone. Our journey began when we noticed natural,
                  farm-fresh products were becoming harder to find, while
                  supermarket alternatives, often full of additives, grew in
                  popularity. We wanted to bring back the tradition of milk
                  deliveries, just like in the old days, with the same milk and
                  the same process. By choosing us, you're not only receiving
                  the best essentials for your daily needs, but you're also
                  supporting our community and its farmers. Starting with small
                  communities, our commitment to service and quality has allowed
                  us to grow and now serve thousands of homes. Experience the
                  taste of freshness and support local farms with every
                  delivery!
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                <img
                  src={heroImage}
                  alt="Our farm"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-6 shadow-large border border-border">
                <p className="font-heading text-4xl font-semibold text-primary mb-1">
                  1000s
                </p>
                <p className="text-sm text-muted-foreground">Homes served</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              What We Stand For
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quality, service, and supporting Yorkshire farms guide everything
              we do.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="bg-card p-6 rounded-2xl border border-border opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Farm Section */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              From Farm to Door
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We source from local Yorkshire family-run farms and deliver in
              refrigerated vans to keep your order in optimal condition.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl overflow-hidden bg-muted"
              >
                <img
                  src={heroImage}
                  alt={`Farm life ${i}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
            Taste the Difference
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Experience the taste of freshness today and support local farms with
            every delivery.
          </p>
          <Link to="/shop" className="btn-gold inline-flex items-center gap-2">
            Shop Our Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
