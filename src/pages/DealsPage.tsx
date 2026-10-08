import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { listDeals, type Deal } from "@/api/deals";
import { resolveImageUrl } from "@/api/client";
import { dealPresentation } from "@/components/deals/dealPresentation";
import FeaturedPackages from "@/components/deals/FeaturedPackages";
import { useCart } from "@/context/CartContext";
import ShopPage, { type ShopCatalogItem } from "./ShopPage";

const DealsPage = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadSequence = useRef(0);
  const { addDeal, deals: basketDeals, openCart } = useCart();

  const loadDeals = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError("");
    try {
      // Load every page so category filters and sorting cover the whole catalog.
      const first = await listDeals({ page: 1, pageSize: 100 });
      if (sequence !== loadSequence.current) return;
      const loaded = [...first.deals];
      for (let page = 2; page <= (first.meta?.totalPages ?? 1); page++) {
        const result = await listDeals({ page, pageSize: 100 });
        if (sequence !== loadSequence.current) return;
        loaded.push(...result.deals);
      }
      setDeals(Array.from(new Map(loaded.map((deal) => [deal.id, deal])).values()));
    } catch {
      if (sequence !== loadSequence.current) return;
      setDeals([]);
      setError("We couldn’t load the deals. Please try again.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeals();
    return () => { loadSequence.current += 1; };
  }, [loadDeals]);

  const items = useMemo<ShopCatalogItem[]>(() => deals.map((deal) => {
    const value = dealPresentation(deal);
    const inBasket = basketDeals.find((entry) => entry.deal.id === deal.id)?.quantity ?? 0;
    const available = Number.isFinite(deal.maxPackages) ? Math.max(0, Math.min(99, deal.maxPackages)) : 0;
    const expired = Boolean(deal.endsAt && new Date(deal.endsAt).getTime() <= Date.now());
    const categories = Array.from(new Set(deal.items.map((item) => item.product.category).filter(Boolean)));
    const image = resolveImageUrl(deal.imageUrl) ??
      resolveImageUrl(deal.items[0]?.variant.thumbnailImage) ??
      resolveImageUrl(deal.items[0]?.product.thumbnailImage);
    return {
      product: {
        id: deal.id,
        name: deal.name,
        category: categories[0] ?? "Product packages",
        price: deal.packagePrice,
        shortDescription: deal.description,
        longDescription: deal.items.map((item) => `${item.product.name} ${item.variant.name}`).join(" "),
        images: image ? [image] : [],
        stockStatus: available <= 0 || expired ? "out-of-stock" : "in-stock",
        badges: value.saving ? [`Save ${value.percent !== null ? `${value.percent}%` : value.saving}`] : [],
      },
      categories,
      cardProps: {
        linkTo: `/deals/${deal.slug}`,
        priceLabel: value.price,
        originalPriceLabel: value.original ?? undefined,
        maxQuantity: Math.max(1, available - inBasket),
        actionDisabled: !value.validPrice,
      },
    };
  }), [basketDeals, deals]);

  const catalog = useMemo(() => ({
    title: "Deals & Product Packages",
    description: "Fresh favourites at a better package price.",
    items,
    loading,
    error,
    retry: () => void loadDeals(),
    emptyMessage: deals.length ? "No deals found matching your filters." : "No deals available right now. Check back soon for new offers.",
  }), [deals.length, error, items, loadDeals, loading]);

  return (
    <ShopPage
      catalog={catalog}
      catalogId="all-deals"
      beforeCatalog={<FeaturedPackages deals={error ? [] : deals} loading={loading} />}
      cardActionLabel={({ product }) => {
        const deal = deals.find((entry) => entry.id === product.id);
        const inBasket = basketDeals.find((entry) => entry.deal.id === product.id)?.quantity ?? 0;
        if (product.stockStatus === "out-of-stock") return "Unavailable";
        if (deal && !dealPresentation(deal).validPrice) return "Price unavailable";
        return deal && inBasket >= Math.min(99, deal.maxPackages) ? "View basket" : "Add to basket";
      }}
      onCardAction={({ product, quantity }) => {
        const deal = deals.find((entry) => entry.id === product.id);
        if (!deal || !dealPresentation(deal).validPrice || product.stockStatus === "out-of-stock") return;
        const inBasket = basketDeals.find((entry) => entry.deal.id === deal.id)?.quantity ?? 0;
        const remaining = Math.min(99, deal.maxPackages) - inBasket;
        if (remaining <= 0) { openCart(); return; }
        const added = Math.min(quantity, remaining);
        addDeal(deal, added);
        toast.success(`${deal.name} added to your basket`, { description: `Package deal × ${added}` });
      }}
    />
  );
};

export default DealsPage;
