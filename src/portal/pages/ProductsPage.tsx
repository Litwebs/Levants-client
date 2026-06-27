import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  RefreshCcw,
  ChevronDown,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockProducts, type PortalProduct } from "@/portal/data/mockData";
import { PageHeader } from "@/portal/components/PortalUI";
import { cn } from "@/lib/utils";
import QuantityStepper from "@/components/ui/QuantityStepper";

const categories = [
  "All",
  "Milk",
  "Cheese",
  "Yogurt",
  "Butter",
  "Cream",
  "Labneh",
  "Bundles",
  "Offers",
];

const stockBadge = (status: PortalProduct["stockStatus"]) => {
  if (status === "out-of-stock")
    return (
      <span className="text-xs font-medium text-destructive">Out of stock</span>
    );
  if (status === "low-stock")
    return (
      <span className="text-xs font-medium text-yellow-600">Low stock</span>
    );
  return <span className="text-xs font-medium text-green-600">In stock</span>;
};

const ProductDetailModal: React.FC<{
  product: PortalProduct | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}> = ({ product, open, onOpenChange }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image */}
          <div className="aspect-video bg-muted rounded-xl overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80";
              }}
            />
          </div>

          {/* Category + stock */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{product.category}</Badge>
            {stockBadge(product.stockStatus)}
          </div>

          <p className="text-sm text-muted-foreground">
            {product.shortDescription}
          </p>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Size / Variant
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(i)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                      selectedVariant === i
                        ? "border-forest bg-forest text-primary-foreground"
                        : "border-border hover:border-forest",
                    )}
                  >
                    {v.name} · {v.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Quantity
              </p>
              <QuantityStepper
                quantity={quantity}
                onQuantityChange={setQuantity}
                min={1}
                max={20}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Price
              </p>
              <p className="text-xl font-bold text-foreground">
                {product.variants[selectedVariant]?.price ?? product.price}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
            {product.subscribable && (
              <Button variant="outline" asChild className="flex-1">
                <Link
                  to="/portal/subscriptions/new"
                  onClick={() => onOpenChange(false)}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Subscribe
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [selectedProduct, setSelectedProduct] = useState<PortalProduct | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = mockProducts.filter((p) => {
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    return 0;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Browse Products"
        description="Fresh dairy products from local farms, delivered to your door"
      />

      {/* Search + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-44">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-forest text-primary-foreground border-forest"
                : "border-border text-muted-foreground hover:border-forest hover:text-foreground",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">
            Try adjusting your search or category filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((product) => (
            <div
              key={product.id}
              className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image */}
              <button
                className="aspect-square bg-muted overflow-hidden block"
                onClick={() => {
                  setSelectedProduct(product);
                  setModalOpen(true);
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80";
                  }}
                />
              </button>

              {/* Content */}
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className="text-xs text-muted-foreground">
                    {product.category}
                  </p>
                  {product.subscribable && (
                    <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                      Subscribable
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-tight mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2 flex-1">
                  {product.shortDescription}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">
                    {product.variants[0]?.price ?? product.price}
                  </span>
                  {stockBadge(product.stockStatus)}
                </div>

                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    disabled={product.stockStatus === "out-of-stock"}
                    onClick={() => {
                      setSelectedProduct(product);
                      setModalOpen(true);
                    }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add
                  </Button>
                  {product.subscribable && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <Link to="/portal/subscriptions/new">
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default ProductsPage;
