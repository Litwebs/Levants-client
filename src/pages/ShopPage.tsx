import React, { useState, useEffect, useMemo } from "react";
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

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { products, loading, error, fetchProducts } = useProducts();

  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "featured";
  const searchQuery = searchParams.get("q") || "";

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : [],
  );
  const [sortBy, setSortBy] = useState(sortParam);

  useEffect(() => {
    fetchProducts({
      category:
        selectedCategories.length === 1 ? selectedCategories[0] : undefined,
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
  }, [selectedCategories, searchQuery, sortBy]);

  // Derive unique categories from products
  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    products.forEach((p) =>
      catMap.set(p.category, (catMap.get(p.category) || 0) + 1),
    );
    return Array.from(catMap.entries()).map(([name, count]) => ({
      name,
      slug: name,
      count,
    }));
  }, [products]);

  // Map backend products to ProductCard-compatible shape
  const mappedProducts = useMemo(() => {
    return products.map((p) => ({
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
        : p.variants.some((v) => v.lowStock)
          ? ("low-stock" as const)
          : ("in-stock" as const),
      badges: [] as string[],
    }));
  }, [products]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );
  };

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
            Fresh dairy delivered to your door. {mappedProducts.length} products
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
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({category.count})
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
                  onChange={(e) => setSortBy(e.target.value)}
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
                Showing {mappedProducts.length} products
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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
            {!loading && !error && mappedProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {mappedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && mappedProducts.length === 0 && (
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
                    <span className="text-sm text-muted-foreground ml-auto">
                      ({category.count})
                    </span>
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
