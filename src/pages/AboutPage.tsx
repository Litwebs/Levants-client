import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart, Award, Truck, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-farm.jpg';

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Leaf,
      title: 'Farm Fresh',
      description: 'All our products are made from milk produced by our own herd of grass-fed cows, ensuring the freshest quality.',
    },
    {
      icon: Heart,
      title: 'Animal Welfare',
      description: "Our cows live happy lives on open pastures. We believe happy cows produce the best milk, and we're committed to their well-being.",
    },
    {
      icon: Award,
      title: 'Traditional Methods',
      description: 'We combine time-honoured dairy techniques with modern food safety standards to create products of exceptional quality.',
    },
    {
      icon: Truck,
      title: 'Local Delivery',
      description: 'We deliver locally in refrigerated packaging, reducing food miles and ensuring products arrive perfectly fresh.',
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
              Our Story
            </h1>
            <p className="text-lg text-card/90">
              From our family farm to your family table—discover the passion and care behind every Levants Dairy product.
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
                A Family Tradition Since 1952
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Levants Dairy began over 70 years ago when the Levant family started selling fresh milk to their neighbours. What started as a small operation with just a handful of cows has grown into a beloved local dairy, serving thousands of households.
                </p>
                <p>
                  Today, we're proud to continue the family tradition, now in our third generation. While we've grown, our commitment to quality remains unchanged. Every bottle of milk, every wedge of cheese, and every pat of butter is made with the same care and attention to detail that defined our grandparents' dairy.
                </p>
                <p>
                  We believe that food should be simple, honest, and delicious. That's why we use only the freshest ingredients, traditional methods, and a whole lot of love in everything we make.
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
                <p className="font-heading text-4xl font-semibold text-primary mb-1">70+</p>
                <p className="text-sm text-muted-foreground">Years of dairy excellence</p>
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
              Our values guide everything we do, from how we care for our cows to how we deliver to your door.
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
                <h3 className="font-heading text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
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
              Life on the Farm
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Take a glimpse into daily life at Levants Farm, where our cows graze freely on lush pastures.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-muted">
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
            Experience the freshness of farm-to-door dairy. Order today and discover why our customers keep coming back.
          </p>
          <Link
            to="/shop"
            className="btn-gold inline-flex items-center gap-2"
          >
            Shop Our Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
