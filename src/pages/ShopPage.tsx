import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { CategoryFilterOptions, CatalogSortSelect } from "@/components/products/CatalogFilters";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Link, useSearchParams } from "react-router-dom";
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useProducts } from "@/context/Products/ProductsContext";
import { resolveImageUrl } from "@/api/client";
import ProductCard, { type ProductCardProps } from "@/components/products/ProductCard";
import { Product, ProductVariant } from "@/data/products";
import { cn } from "@/lib/utils";
import { sortByStorefrontCategoryOrder } from "@/lib/categoryOrder";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const slugifyCategory = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const guessCategoryNameFromSlug = (slug: string) =>
  String(slug || "")
    .trim()
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export interface ShopCatalogItem {
  product: Product;
  categories?: string[];
  lockedVariantId?: string;
  cardProps?: Pick<ProductCardProps, "linkTo" | "priceLabel" | "originalPriceLabel" | "maxQuantity" | "actionDisabled" | "imageFit">;
}

interface ShopPageProps {
  tourTarget?: string;
  subscriptionOnly?: boolean;
  beforeCatalog?: React.ReactNode;
  catalogId?: string;
  catalog?: {
    title: string;
    description: string;
    items: ShopCatalogItem[];
    loading: boolean;
    error: string;
    retry: () => void;
    emptyMessage: string;
  };
  cardActionLabel?: (params: {
    product: Product;
    lockedVariantId?: string;
  }) => string;
  cardActionClassName?: (params: {
    product: Product;
    lockedVariantId?: string;
  }) => string | undefined;
  onCardAction?: (params: {
    product: Product;
    variant: ProductVariant | undefined;
    quantity: number;
    lockedVariantId?: string;
  }) => void;
  cardAfterActionContent?: (params: {
    product: Product;
    lockedVariantId?: string;
  }) => React.ReactNode;
  hideCardQuantityStepper?: boolean;
  productGridClassName?: string;
  contentGapClassName?: string;
  embedded?: boolean;
  sidebarStickyTopClassName?: string;
  sidebarStickyTopOffset?: number;
}

const ShopPage: React.FC<ShopPageProps> = ({
  subscriptionOnly = false,
  tourTarget,
  catalog,
  beforeCatalog,
  catalogId,
  cardActionLabel,
  cardActionClassName,
  onCardAction,
  cardAfterActionContent,
  hideCardQuantityStepper = false,
  productGridClassName,
  contentGapClassName,
  embedded = false,
  sidebarStickyTopClassName,
  sidebarStickyTopOffset,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const { products, meta, loading: productsLoading, error: productsError, fetchProducts } = useProducts();
  const loading = catalog?.loading ?? productsLoading;
  const error = catalog?.error ?? productsError;
  const { addItem } = useCart();

  const backendCategoriesRef = useRef<string[]>([]);
  useEffect(() => {
    if (Array.isArray(meta?.categories)) {
      backendCategoriesRef.current = meta.categories.map((c) => c.title);
    }
  }, [meta?.categories]);

  const PAGE_SIZE = 12;

  const selectedCategories = useMemo(() => searchParams.getAll("category").filter(Boolean).map(slugifyCategory), [searchParams]);
  const sortParam = searchParams.get("sort") || "featured";
  const sortBy = ["featured", "price-low", "price-high", "name"].includes(sortParam) ? sortParam : "featured";
  const searchQuery = searchParams.get("q") || "";
  const pageParam = Number(searchParams.get("page") || "1");
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const setPage = useCallback(
    (nextPage: number, opts?: { replace?: boolean }) => {
      const safePage = Math.max(1, Math.floor(nextPage));
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev);
          if (safePage <= 1) nextParams.delete("page");
          else nextParams.set("page", String(safePage));
          return nextParams;
        },
        { replace: opts?.replace },
      );
    },
    [setSearchParams],
  );

  const buildPaginationItems = (totalPages: number, current: number) => {
    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);
    for (let p = current - 1; p <= current + 1; p++) {
      if (p >= 1 && p <= totalPages) pages.add(p);
    }

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const items: Array<number | "ellipsis"> = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && prev !== undefined && p - prev > 1) items.push("ellipsis");
      items.push(p);
    }
    return items;
  };

  useEffect(() => {
    if (catalog) return;
    const backendCategories = backendCategoriesRef.current;
    const categoryBySlug = new Map(
      backendCategories.map((name) => [slugifyCategory(name), name]),
    );
    const selectedCategoryNames = Array.from(
      new Set(
        selectedCategories
          .map(
            (slug) =>
              categoryBySlug.get(slug) ??
              // Some APIs use lowercase category keys (e.g. "milk")
              slug ??
              guessCategoryNameFromSlug(slug),
          )
          .filter(Boolean),
      ),
    );

    // Backend validation expects `category` to be a string.
    // Send multiple categories as a comma-separated string.
    const categoryFilter = selectedCategoryNames.length
      ? selectedCategoryNames.join(",")
      : undefined;

    fetchProducts({
      subscriptionEligible: subscriptionOnly || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
      category: categoryFilter,
      search: searchQuery || undefined,
      sort:
        sortBy === "featured"
          ? "category_order"
          : sortBy === "price-low"
          ? "price_asc"
          : sortBy === "price-high"
            ? "price_desc"
            : sortBy === "name"
              ? "name_asc"
              : undefined,
    });
  }, [catalog, currentPage, fetchProducts, searchQuery, selectedCategories, sortBy, subscriptionOnly]);

  const prevSearchQueryRef = useRef(searchQuery);
  useEffect(() => {
    if (prevSearchQueryRef.current !== searchQuery) {
      setPage(1, { replace: true });
      prevSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery, setPage]);

  // Categories should be stable across pages (backend provides full list)
  const categories = useMemo(() => {
    if (catalog) {
      const names = new Map<string, string>();
      catalog.items.forEach(({ product, categories: itemCategories }) => {
        (itemCategories ?? [product.category]).filter(Boolean).forEach((name) => {
          names.set(slugifyCategory(name), name);
        });
      });
      return sortByStorefrontCategoryOrder(
        Array.from(names, ([slug, name]) => ({ slug, name })),
        (category) => category.name,
      );
    }
    const backendCategories = Array.isArray(meta?.categories)
      ? meta.categories.map((c) => c.title)
      : [];
    if (backendCategories.length) {
      const seen = new Set<string>();
      return sortByStorefrontCategoryOrder(
        backendCategories
        .map((name) => ({ name, slug: slugifyCategory(name) }))
        .filter(({ slug }) => {
          if (seen.has(slug)) return false;
          seen.add(slug);
          return true;
        }),
        (category) => category.name,
      );
    }

    // Fallback: derive from currently loaded products (may be incomplete).
    const catSet = new Set<string>();
    products.forEach((p) => catSet.add(p.category));
    return sortByStorefrontCategoryOrder(
      Array.from(catSet.values()).map((name) => ({
        name,
        slug: slugifyCategory(name),
      })),
      (category) => category.name,
    );
  }, [catalog, meta?.categories, products]);

  const catalogItems = useMemo(() => {
    if (!catalog) return [];
    const query = searchQuery.trim().toLowerCase();
    const filtered = catalog.items.filter(({ product, categories: itemCategories }) => {
      const matchesCategory = selectedCategories.length === 0 ||
        (itemCategories ?? [product.category]).some((name) => selectedCategories.includes(slugifyCategory(name)));
      const matchesSearch = !query || `${product.name} ${product.shortDescription} ${product.longDescription}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    if (sortBy === "price-low") return filtered.sort((a, b) => a.product.price - b.product.price);
    if (sortBy === "price-high") return filtered.sort((a, b) => b.product.price - a.product.price);
    if (sortBy === "name") return filtered.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return sortByStorefrontCategoryOrder(filtered, ({ product }) => product.category);
  }, [catalog, searchQuery, selectedCategories, sortBy]);

  const totalAvailable = catalog ? catalog.items.length : meta?.total ?? products.length;
  const totalPages = catalog
    ? catalog.loading ? undefined : Math.max(1, Math.ceil(catalogItems.length / PAGE_SIZE))
    : meta?.totalPages;
  const clampedPage = totalPages
    ? Math.min(currentPage, totalPages)
    : currentPage;

  useEffect(() => {
    if (totalPages && clampedPage !== currentPage)
      setPage(clampedPage, { replace: true });
  }, [clampedPage, currentPage, setPage, totalPages]);

  // Map backend products to ProductCard-compatible shape
  const mappedProducts = useMemo(() => {
    const mapped = products.map(p => ({ ...p, variants: p.variants.filter(v => !subscriptionOnly || v.isSubscriptionEligible !== false) }))
      .filter(p => !subscriptionOnly || p.variants.length > 0).map((p) => ({
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
        isSubscriptionEligible: v.isSubscriptionEligible,
        id: v.id,
        name: v.name,
        description: v.description,
        ingredients: v.ingredients,
        allergens: v.allergens,
        nutritionalInformation: v.nutritionalInformation,
        price: v.price,
        thumbnailImage: (v as any).thumbnailImage,
        image: (v as any).image,
        imageUrl: (v as any).imageUrl,
        imageId: (v as any).imageId,
        stockStatus:
          v.stockQuantity <= 0
            ? ("out-of-stock" as const)
            : v.lowStock
              ? ("low-stock" as const)
              : ("in-stock" as const),
      })),
      stockStatus: p.variants.every((v) => v.stockQuantity <= 0)
        ? ("out-of-stock" as const)
        : p.variants.some((v) => v.lowStock)
          ? ("low-stock" as const)
          : ("in-stock" as const),
      badges: [] as string[],
    }));

    return sortBy === "featured"
      ? sortByStorefrontCategoryOrder(mapped, (product) => product.category)
      : mapped;
  }, [products, sortBy, subscriptionOnly]);

  const productVariantCards = useMemo<ShopCatalogItem[]>(() => {
    if (catalog) return catalogItems.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
    return mappedProducts.flatMap((product) => {
      const variants = product.variants ?? [];
      if (variants.length === 0) {
        return [
          {
            product,
            lockedVariantId: undefined as string | undefined,
          },
        ];
      }

      return variants.map((variant, variantIndex) => {
        const variantImageUrl = resolveImageUrl(
          (variant as any)?.thumbnailImage ??
            (variant as any)?.image ??
            (variant as any)?.imageUrl ??
            (variant as any)?.imageId,
        );

        // If the variant has its own thumbnail, use it as the primary card image.
        // Fallback: map variant index -> product.galleryImages (already in product.images[1..]).
        const fallbackGalleryImage = product.images?.[variantIndex + 1];
        const primary =
          variantImageUrl ?? fallbackGalleryImage ?? product.images?.[0];
        const productForCard = primary
          ? {
              ...product,
              images: [
                primary,
                ...(product.images || []).filter((img) => img !== primary),
              ],
            }
          : product;

        return {
          product: productForCard,
          lockedVariantId: variant.id,
        };
      });
    });
  }, [catalog, catalogItems, clampedPage, mappedProducts]);

  const toggleCategory = (slug: string) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      const selected = next.getAll("category").filter(Boolean).map(slugifyCategory);
      const categories = selected.includes(slug) ? selected.filter(value => value !== slug) : [...selected, slug];
      next.delete("category");next.delete("page");
      categories.forEach(value => next.append("category", value));
      return next;
    });
  };
  const handleSortChange = useCallback((value: string) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (value === "featured") next.delete("sort");else next.set("sort", value);
      next.delete("page");return next;
    });
  }, [setSearchParams]);
  const clearFilters = () => { setSearchParams({}); };

  const handleStorefrontProductAction = ({
    product,
    variant,
    quantity,
  }: {
    product: Product;
    variant: ProductVariant | undefined;
    quantity: number;
  }) => {
    addItem(product, variant, quantity);
    toast.success(`${product.name} added to your basket`, {
      description: `${variant?.name || "Selected option"} × ${quantity}`,
    });
  };

  return (
    <div data-tour={tourTarget} className={embedded ? "bg-background" : "min-h-screen bg-background"}>
      {!embedded && (
        <div className="bg-secondary/30 py-12 lg:py-16">
          <div className="container-custom">
            <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
              {catalog?.title ?? "Shop All Products"}
            </h1>
            <p className="text-muted-foreground">
              {catalog ? `${catalog.description} ${totalAvailable} deals available.` : `Fresh dairy delivered to your door. ${totalAvailable} products available.`}
            </p>
          </div>
        </div>
      )}

      <div className={embedded ? "py-0" : "container-custom py-8 lg:py-12"}>
        {beforeCatalog}
        <div
          id={catalogId}
          className={cn(contentGapClassName || "flex flex-col lg:flex-row gap-8", catalogId && "scroll-mt-28")}
        >
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div
              className={cn(
                "sticky space-y-8",
                sidebarStickyTopOffset != null
                  ? undefined
                  : sidebarStickyTopClassName || "top-24",
              )}
              style={
                sidebarStickyTopOffset != null
                  ? { top: sidebarStickyTopOffset }
                  : undefined
              }
            >
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Categories
                </h3>
                <CategoryFilterOptions categories={categories} selected={selectedCategories} onToggle={toggleCategory} />
              </div>

              {(selectedCategories.length > 0 || sortBy !== "featured") && (
                <Button
                  onClick={clearFilters}
                  variant="ghost" size="touch" className="text-primary"
                >
                  <X className="w-4 h-4" /> Clear all filters
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {/* Mobile Filter Bar */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <Button
                ref={filterTrigger}
                onClick={() => setIsFilterOpen(true)}
                variant="outline" size="touch" className="flex-1"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {selectedCategories.length > 0 && (
                  <span className="badge-fresh text-xs py-0.5">
                    {selectedCategories.length}
                  </span>
                )}
              </Button>
              <div className="relative min-w-0 flex-1">
                <CatalogSortSelect value={sortBy} onChange={handleSortChange} />
              </div>
            </div>

            {/* Desktop Sort Bar */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <p className="text-muted-foreground">
                Showing {productVariantCards.length} items
              </p>
              <div className="flex items-center gap-3">
                <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                  Sort by:
                </span>
                <CatalogSortSelect value={sortBy} onChange={handleSortChange} />
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div role="status" aria-label={catalog ? "Loading deals" : "Loading products"} className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div role="alert" className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button
                  onClick={() => catalog ? catalog.retry() : fetchProducts({})}
                  variant="outline" size="touch"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && productVariantCards.length > 0 && (
              <>
                <div
                  className={
                    productGridClassName ||
                    "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  }
                >
                  {productVariantCards.map(
                    ({ product, lockedVariantId, cardProps }, index) => (
                      <div
                        key={lockedVariantId ?? product.id}
                        className="h-full opacity-0 animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <ProductCard
                          {...cardProps}
                          product={product}
                          lockedVariantId={lockedVariantId}
                          hideVariantSelector
                          hideQuantityStepper={hideCardQuantityStepper}
                          compactControls={!embedded}
                          actionLabel={
                            cardActionLabel?.({
                              product,
                              lockedVariantId,
                            }) ??
                            (!embedded ? "Add to basket" : undefined)
                          }
                          actionClassName={cardActionClassName?.({
                            product,
                            lockedVariantId,
                          })}
                          onAction={({ product, variant, quantity }) => {
                            if (onCardAction) {
                              onCardAction({
                                product,
                                variant,
                                quantity,
                                lockedVariantId,
                              });
                              return;
                            }

                            if (!embedded) {
                              handleStorefrontProductAction({
                                product,
                                variant,
                                quantity,
                              });
                            }
                          }}
                          afterActionContent={
                            cardAfterActionContent
                              ? () =>
                                  cardAfterActionContent({
                                    product,
                                    lockedVariantId,
                                  })
                              : undefined
                          }
                        />
                      </div>
                    ),
                  )}
                </div>

                {Boolean(totalPages && totalPages > 1) && (
                  <div className="mt-10">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (clampedPage > 1) setPage(clampedPage - 1);
                            }}
                            className={
                              clampedPage <= 1
                                ? "pointer-events-none opacity-50"
                                : undefined
                            }
                          />
                        </PaginationItem>

                        {buildPaginationItems(totalPages, clampedPage).map(
                          (item, idx) => (
                            <PaginationItem key={`${item}-${idx}`}>
                              {item === "ellipsis" ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  href="#"
                                  isActive={item === clampedPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPage(item);
                                  }}
                                >
                                  {item}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ),
                        )}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (clampedPage < totalPages)
                                setPage(clampedPage + 1);
                            }}
                            className={
                              clampedPage >= totalPages
                                ? "pointer-events-none opacity-50"
                                : undefined
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}

            {!loading && !error && productVariantCards.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  {catalog?.emptyMessage ?? "No products found matching your filters."}
                </p>
                <Button onClick={clearFilters} variant="outline" size="touch">
                  Clear Filters
                </Button>
                {catalog && (
                  <Button asChild variant="outline" size="touch" className="ml-3"><Link to="/shop">Browse all products</Link></Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="left" onCloseAutoFocus={event => { event.preventDefault();filterTrigger.current?.focus(); }} className="w-[min(22rem,100vw)] overflow-y-auto">
          <SheetTitle className="font-heading text-xl">Filters</SheetTitle>
          <SheetDescription className="mt-1">Choose the categories you want to browse.</SheetDescription>
          <div className="my-6"><h3 className="mb-3 font-medium">Categories</h3><CategoryFilterOptions categories={categories} selected={selectedCategories} onToggle={toggleCategory} /></div>
          <div className="flex gap-3"><Button type="button" variant="outline" size="touch" className="flex-1" onClick={clearFilters}>Clear All</Button><Button type="button" size="touch" className="flex-1" onClick={() => setIsFilterOpen(false)}>Apply</Button></div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ShopPage;
