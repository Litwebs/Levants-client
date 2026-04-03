import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useProducts } from "@/context/Products/ProductsContext";
import { resolveImageUrl } from "@/api/client";
import ProductCard from "@/components/products/ProductCard";
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

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { products, meta, loading, error, fetchProducts } = useProducts();

  const backendCategoriesRef = useRef<string[]>([]);
  useEffect(() => {
    if (Array.isArray(meta?.categories)) {
      backendCategoriesRef.current = meta.categories;
    }
  }, [meta?.categories]);

  const PAGE_SIZE = 12;

  const categoryParams = searchParams.getAll("category").filter(Boolean);
  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "featured";
  const searchQuery = searchParams.get("q") || "";
  const pageParam = Number(searchParams.get("page") || "1");
  const currentPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParams.length
      ? categoryParams.map(slugifyCategory)
      : categoryParam
        ? [slugifyCategory(categoryParam)]
        : [],
  );
  const [sortBy, setSortBy] = useState(sortParam);

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
      page: currentPage,
      pageSize: PAGE_SIZE,
      category: categoryFilter,
      search: searchQuery || undefined,
      sort:
        sortBy === "price-low"
          ? "price_asc"
          : sortBy === "price-high"
            ? "price_desc"
            : sortBy === "name"
              ? "name_asc"
              : undefined,
    });
  }, [currentPage, fetchProducts, searchQuery, selectedCategories, sortBy]);

  const prevSearchQueryRef = useRef(searchQuery);
  useEffect(() => {
    if (prevSearchQueryRef.current !== searchQuery) {
      setPage(1, { replace: true });
      prevSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery, setPage]);

  // Categories should be stable across pages (backend provides full list)
  const categories = useMemo(() => {
    const backendCategories = Array.isArray(meta?.categories)
      ? meta?.categories
      : [];
    if (backendCategories.length) {
      return backendCategories
        .map((name) => ({ name, slug: slugifyCategory(name) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Fallback: derive from currently loaded products (may be incomplete).
    const catSet = new Set<string>();
    products.forEach((p) => catSet.add(p.category));
    return Array.from(catSet.values())
      .map((name) => ({ name, slug: slugifyCategory(name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [meta?.categories, products]);

  const totalAvailable = meta?.total ?? products.length;
  const totalPages = meta?.totalPages;
  const clampedPage = totalPages
    ? Math.min(currentPage, totalPages)
    : currentPage;

  useEffect(() => {
    if (totalPages && clampedPage !== currentPage)
      setPage(clampedPage, { replace: true });
  }, [clampedPage, currentPage, setPage, totalPages]);

  // Map backend products to ProductCard-compatible shape
  const mappedProducts = useMemo(() => {
    return products.map((p) => ({
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
  }, [products]);

  const productVariantCards = useMemo(() => {
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
  }, [mappedProducts]);

  const toggleCategory = (slug: string) => {
    if (currentPage !== 1) setPage(1);
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );
  };

  const handleSortChange = useCallback(
    (value: string) => {
      if (currentPage !== 1) setPage(1);
      setSortBy(value);
    },
    [currentPage, setPage],
  );

  const clearFilters = () => {
    setSelectedCategories([]);
    setSortBy("featured");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary/30 py-12 lg:py-16">
        <div className="container-custom">
          <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
            Shop All Products
          </h1>
          <p className="text-muted-foreground">
            Fresh dairy delivered to your door. {totalAvailable} products
            available.
          </p>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category.slug}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.slug)}
                        onChange={() => toggleCategory(category.slug)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors capitalize">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {(selectedCategories.length > 0 || sortBy !== "featured") && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Bar */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex-1 btn-outline flex items-center justify-center gap-2 py-2.5"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {selectedCategories.length > 0 && (
                  <span className="badge-fresh text-xs py-0.5">
                    {selectedCategories.length}
                  </span>
                )}
              </button>
              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full input-field py-2.5 pr-10 appearance-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Desktop Sort Bar */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <p className="text-muted-foreground">
                Showing {productVariantCards.length} items
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input-field py-2 pr-10 appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={() => fetchProducts({})}
                  className="btn-outline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && productVariantCards.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {productVariantCards.map(
                    ({ product, lockedVariantId }, index) => (
                      <div
                        key={lockedVariantId ?? product.id}
                        className="h-full opacity-0 animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <ProductCard
                          product={product}
                          lockedVariantId={lockedVariantId}
                          hideVariantSelector
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
                  No products found matching your filters.
                </p>
                <button onClick={clearFilters} className="btn-outline">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-card z-50 lg:hidden animate-slide-in-right p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold">Filters</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-8">
              <h3 className="font-medium mb-4">Categories</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <label
                    key={category.slug}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.slug)}
                      onChange={() => toggleCategory(category.slug)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="capitalize">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 btn-outline py-3"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 btn-primary py-3"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopPage;
