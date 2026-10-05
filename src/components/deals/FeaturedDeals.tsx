import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { listDeals, type Deal } from "@/api/deals";
import DealCard from "./DealCard";

const FeaturedDeals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    let active = true;
    void listDeals({ page: 1, pageSize: 3 })
      .then((res) => {
        if (active) setDeals(res.deals);
      })
      .catch(() => {
        if (active) setDeals([]);
      });

    return () => {
      active = false;
    };
  }, []);

  if (deals.length === 0) return null;

  return (
    <section className="bg-primary/5 py-16 lg:py-20">
      <div className="container-custom">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Better value
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold lg:text-4xl">
              Current Deals
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Save when you order a selected collection of our farm-fresh
              products together.
            </p>
          </div>
          <Link
            to="/deals"
            className="inline-flex items-center gap-2 font-medium text-primary"
          >
            View all deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} compact />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDeals;
