import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Music2 } from "lucide-react";
import img from "@/assets/mark.jpeg";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { name: "All Products", path: "/shop" },
      { name: "Milk", path: "/shop?category=milk" },
      { name: "Cheese", path: "/shop?category=cheese" },
      { name: "Butter & Cream", path: "/shop?category=cream" },
      { name: "Honey", path: "/shop?category=honey" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Our Farm", path: "/about#farm" },
      { name: "Sustainability", path: "/about#sustainability" },
      { name: "Careers", path: "/careers" },
    ],
    support: [
      { name: "Delivery Information", path: "/delivery" },
      { name: "FAQs", path: "/delivery#faqs" },
      { name: "Contact Us", path: "/contact" },
      { name: "Returns Policy", path: "/delivery#returns" },
    ],
  };

  return (
    <footer className="bg-border text-foreground overflow-x-hidden">
      {/* Main Footer Links */}
      <div className="container-custom py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-3 mb-4 flex-nowrap"
            >
              <img
                src="/Logo.jpg"
                alt="Levants logo"
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full object-cover shrink-0"
                loading="lazy"
              />
              <h2 className="font-heading text-2xl font-semibold whitespace-nowrap">
                Levants Dairy
              </h2>
            </Link>
            <p className="text-muted-foreground text-sm italic mb-6 max-w-xs">
              Farm Fresh To Your Door
            </p>

            <div className="mb-6 max-w-xs">
              <img
                src={img}
                alt="Red Tractor Certified Standards — Traceable, safe & farmed with care"
                className="h-14 w-auto opacity-90 object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/share/1Chyt7LZXT/?mibextid=wwXIfr"
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@levantsdairy?_r=1&_t=ZN-952qaABGMmk"
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Music2 className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/levantsdairy?igsh=MTR4ajAzOGs5M24xZQ=="
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-foreground/10">
        <div className="container-custom py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm text-center sm:text-left">
              © {currentYear} Levants Dairy. All rights reserved.{" "}
              <span className="text-foreground font-medium">Powered by</span>{" "}
              <a
                href="https://litwebs.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-semibold underline underline-offset-4 hover:opacity-90 transition-opacity"
              >
                Litwebs
              </a>
              .
            </p>
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
              <img
                src="/placeholder.svg"
                alt="Visa"
                className="h-6 opacity-70"
              />
              <img
                src="/placeholder.svg"
                alt="Mastercard"
                className="h-6 opacity-70"
              />
              <img
                src="/placeholder.svg"
                alt="Apple Pay"
                className="h-6 opacity-70"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
