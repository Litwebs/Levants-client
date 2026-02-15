import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { Product, ProductVariant } from "@/data/products";
import { resolveImageUrl } from "@/api/client";

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | {
      type: "ADD_ITEM";
      payload: { product: Product; variant?: ProductVariant; quantity: number };
    }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId?: string } }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: string; variantId?: string; quantity: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

interface CartContextType extends CartState {
  addItem: (
    product: Product,
    variant?: ProductVariant,
    quantity?: number,
  ) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "levants-dairy-cart";

const getItemKey = (productId: string, variantId?: string): string => {
  return variantId ? `${productId}-${variantId}` : productId;
};

const getMaxStock = (
  product: Product,
  variant?: ProductVariant,
): number | undefined => {
  const vStock = (variant as any)?.stockQuantity;
  if (typeof vStock === "number") return vStock;

  const pvStock = product.variants?.find((v) => v.id === variant?.id)
    ? (product.variants?.find((v) => v.id === variant?.id) as any)
        ?.stockQuantity
    : undefined;
  if (typeof pvStock === "number") return pvStock;

  return undefined;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, variant, quantity } = action.payload;
      const itemKey = getItemKey(product.id, variant?.id);
      const maxStock = getMaxStock(product, variant);
      const existingIndex = state.items.findIndex(
        (item) => getItemKey(item.product.id, item.variant?.id) === itemKey,
      );

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const nextQtyRaw = updatedItems[existingIndex].quantity + quantity;
        const nextQty =
          typeof maxStock === "number"
            ? Math.min(nextQtyRaw, Math.max(0, maxStock))
            : nextQtyRaw;
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: nextQty,
        };
        return { ...state, items: updatedItems, isOpen: true };
      }

      if (typeof maxStock === "number" && maxStock <= 0) {
        return { ...state, isOpen: true };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            product,
            variant,
            quantity:
              typeof maxStock === "number"
                ? Math.min(quantity, Math.max(0, maxStock))
                : quantity,
          },
        ],
        isOpen: true,
      };
    }

    case "REMOVE_ITEM": {
      const { productId, variantId } = action.payload;
      const itemKey = getItemKey(productId, variantId);
      return {
        ...state,
        items: state.items.filter(
          (item) => getItemKey(item.product.id, item.variant?.id) !== itemKey,
        ),
      };
    }

    case "UPDATE_QUANTITY": {
      const { productId, variantId, quantity } = action.payload;
      const itemKey = getItemKey(productId, variantId);

      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => getItemKey(item.product.id, item.variant?.id) !== itemKey,
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          getItemKey(item.product.id, item.variant?.id) === itemKey
            ? { ...item, quantity }
            : item,
        ),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [], isOpen: false };

    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };

    case "OPEN_CART":
      return { ...state, isOpen: true };

    case "CLOSE_CART":
      return { ...state, isOpen: false };

    case "LOAD_CART":
      return { ...state, items: action.payload };

    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: parsedCart });
      } catch (error) {
        console.error("Failed to load cart from storage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (
    product: Product,
    variant?: ProductVariant,
    quantity: number = 1,
  ) => {
    const maxStock = getMaxStock(product, variant);
    const safeQty =
      typeof maxStock === "number"
        ? Math.min(Math.max(1, quantity), Math.max(0, maxStock))
        : Math.max(1, quantity);

    if (typeof maxStock === "number" && maxStock <= 0) return;

    const images = Array.isArray(product.images) ? product.images : [];

    // Prefer showing the variant image in cart/checkout thumbnails.
    // Convention in this app: images[0] = product thumbnail, images[1..] = gallery.
    // If variants don't carry their own images, we map variant index -> gallery index.
    let primaryImage = images[0];
    if (variant) {
      const variantImage = resolveImageUrl(
        (variant as any).thumbnailImage ??
          (variant as any).image ??
          (variant as any).imageUrl,
      );
      if (variantImage) {
        primaryImage = variantImage;
      } else if (
        Array.isArray(product.variants) &&
        product.variants.length > 0
      ) {
        const variantIndex = product.variants.findIndex(
          (v) => v.id === variant.id,
        );
        const candidate =
          variantIndex >= 0 ? images[variantIndex + 1] : undefined;
        if (candidate) primaryImage = candidate;
      }
    }

    const productForCart =
      primaryImage && primaryImage !== images[0]
        ? {
            ...product,
            images: [
              primaryImage,
              ...images.filter((img) => img !== primaryImage),
            ],
          }
        : product;

    dispatch({
      type: "ADD_ITEM",
      payload: { product: productForCart, variant, quantity: safeQty },
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } });
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => {
    const itemKey = getItemKey(productId, variantId);
    const item = state.items.find(
      (i) => getItemKey(i.product.id, i.variant?.id) === itemKey,
    );
    const maxStock = item ? getMaxStock(item.product, item.variant) : undefined;
    const safeQty =
      typeof maxStock === "number"
        ? Math.min(quantity, Math.max(0, maxStock))
        : quantity;
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { productId, variantId, quantity: safeQty },
    });
  };

  const clearCart = () => {
    // Clear persisted cart immediately (don’t rely on effects timing).
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {
      // Ignore storage errors (private mode / blocked storage)
    }
    dispatch({ type: "CLEAR_CART" });
  };
  const toggleCart = () => dispatch({ type: "TOGGLE_CART" });
  const openCart = () => dispatch({ type: "OPEN_CART" });
  const closeCart = () => dispatch({ type: "CLOSE_CART" });

  const itemCount = state.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const subtotal = state.items.reduce((total, item) => {
    const price = item.variant?.price ?? item.product.price;
    return total + price * item.quantity;
  }, 0);

  const deliveryFee = 0;
  const total = subtotal;

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        itemCount,
        subtotal,
        deliveryFee,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
