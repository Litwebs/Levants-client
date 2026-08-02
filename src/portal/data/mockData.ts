// ─── Customer Profile ────────────────────────────────────────────────────────
export const mockCustomer = {
  id: "cust-001",
  name: "Sarah Mitchell",
  email: "sarah.mitchell@email.com",
  phone: "+44 7712 345678",
  avatarInitials: "SM",
  memberSince: "January 2024",
};

// ─── Products ────────────────────────────────────────────────────────────────
export interface PortalProduct {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  price: string;
  image: string;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  subscribable: boolean;
  variants: Array<{ id: string; name: string; price: string }>;
}

export const mockProducts: PortalProduct[] = [
  {
    id: "p-001",
    name: "Whole Milk",
    category: "Milk",
    shortDescription: "Fresh, full-fat whole milk from local farms.",
    price: "£1.20",
    image: "/categories/milk.jpg",
    stockStatus: "in-stock",
    subscribable: true,
    variants: [
      { id: "v-001-1", name: "1 Litre", price: "£1.20" },
      { id: "v-001-2", name: "2 Litres", price: "£2.30" },
      { id: "v-001-3", name: "4 Pints", price: "£1.95" },
    ],
  },
  {
    id: "p-002",
    name: "Semi-Skimmed Milk",
    category: "Milk",
    shortDescription: "Light and creamy semi-skimmed milk.",
    price: "£1.15",
    image: "/categories/milk.jpg",
    stockStatus: "in-stock",
    subscribable: true,
    variants: [
      { id: "v-002-1", name: "1 Litre", price: "£1.15" },
      { id: "v-002-2", name: "2 Litres", price: "£2.20" },
    ],
  },
  {
    id: "p-003",
    name: "Halloumi Cheese",
    category: "Cheese",
    shortDescription: "Traditional Cypriot halloumi, perfect for grilling.",
    price: "£3.50",
    image: "/categories/cheese.jpg",
    stockStatus: "in-stock",
    subscribable: false,
    variants: [
      { id: "v-003-1", name: "200g", price: "£3.50" },
      { id: "v-003-2", name: "400g", price: "£6.80" },
    ],
  },
  {
    id: "p-004",
    name: "Greek Yogurt",
    category: "Yogurt",
    shortDescription: "Thick, creamy Greek-style yogurt.",
    price: "£2.10",
    image: "/categories/yogurt.jpg",
    stockStatus: "in-stock",
    subscribable: true,
    variants: [
      { id: "v-004-1", name: "500g", price: "£2.10" },
      { id: "v-004-2", name: "1kg", price: "£3.90" },
    ],
  },
  {
    id: "p-005",
    name: "Salted Butter",
    category: "Butter",
    shortDescription: "Rich, creamy salted butter from grass-fed cows.",
    price: "£1.80",
    image: "/categories/butter.jpg",
    stockStatus: "in-stock",
    subscribable: true,
    variants: [{ id: "v-005-1", name: "250g", price: "£1.80" }],
  },
  {
    id: "p-006",
    name: "Double Cream",
    category: "Cream",
    shortDescription: "Luxuriously thick double cream.",
    price: "£1.60",
    image: "/categories/cream.jpg",
    stockStatus: "low-stock",
    subscribable: false,
    variants: [{ id: "v-006-1", name: "300ml", price: "£1.60" }],
  },
  {
    id: "p-007",
    name: "Labneh",
    category: "Labneh",
    shortDescription: "Strained yogurt cheese, smooth and tangy.",
    price: "£2.80",
    image: "/categories/labneh.jpg",
    stockStatus: "in-stock",
    subscribable: true,
    variants: [
      { id: "v-007-1", name: "250g", price: "£2.80" },
      { id: "v-007-2", name: "500g", price: "£5.20" },
    ],
  },
  {
    id: "p-008",
    name: "Family Dairy Bundle",
    category: "Bundles",
    shortDescription: "Weekly essentials: milk, butter, yogurt & cream.",
    price: "£8.99",
    image: "/categories/bundle.jpg",
    stockStatus: "in-stock",
    subscribable: true,
    variants: [{ id: "v-008-1", name: "Standard Bundle", price: "£8.99" }],
  },
];

// ─── Cart Items ───────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variant: string;
  price: string;
  quantity: number;
  image: string;
}

export const mockCartItems: CartItem[] = [
  {
    id: "ci-001",
    productId: "p-001",
    productName: "Whole Milk",
    variant: "2 Litres",
    price: "£2.30",
    quantity: 2,
    image: "/categories/milk.jpg",
  },
  {
    id: "ci-002",
    productId: "p-007",
    productName: "Labneh",
    variant: "500g",
    price: "£5.20",
    quantity: 1,
    image: "/categories/labneh.jpg",
  },
];

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "failed-delivery"
  | "rescheduled";

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export interface OrderItem {
  productName: string;
  variant: string;
  quantity: number;
  price: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: string;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryInstructions?: string;
  estimatedDelivery: string;
}

export const mockOrders: Order[] = [
  {
    id: "ord-001",
    orderNumber: "LVD-20240612-001",
    date: "12 Jun 2024",
    status: "delivered",
    paymentStatus: "paid",
    total: "£12.70",
    items: [
      { productName: "Whole Milk", variant: "2 Litres", quantity: 2, price: "£2.30" },
      { productName: "Greek Yogurt", variant: "1kg", quantity: 1, price: "£3.90" },
      { productName: "Salted Butter", variant: "250g", quantity: 2, price: "£1.80" },
    ],
    deliveryAddress: "14 Meadow Lane, Manchester, M14 5TF",
    deliveryInstructions: "Leave at the door if no answer.",
    estimatedDelivery: "12 Jun 2024",
  },
  {
    id: "ord-002",
    orderNumber: "LVD-20240618-002",
    date: "18 Jun 2024",
    status: "out-for-delivery",
    paymentStatus: "paid",
    total: "£9.60",
    items: [
      { productName: "Semi-Skimmed Milk", variant: "2 Litres", quantity: 2, price: "£2.20" },
      { productName: "Labneh", variant: "250g", quantity: 1, price: "£2.80" },
      { productName: "Double Cream", variant: "300ml", quantity: 1, price: "£1.60" },
    ],
    deliveryAddress: "14 Meadow Lane, Manchester, M14 5TF",
    estimatedDelivery: "18 Jun 2024",
  },
  {
    id: "ord-003",
    orderNumber: "LVD-20240625-003",
    date: "25 Jun 2024",
    status: "placed",
    paymentStatus: "pending",
    total: "£8.99",
    items: [{ productName: "Family Dairy Bundle", variant: "Standard Bundle", quantity: 1, price: "£8.99" }],
    deliveryAddress: "14 Meadow Lane, Manchester, M14 5TF",
    estimatedDelivery: "27 Jun 2024",
  },
  {
    id: "ord-004",
    orderNumber: "LVD-20240530-004",
    date: "30 May 2024",
    status: "cancelled",
    paymentStatus: "refunded",
    total: "£5.10",
    items: [
      { productName: "Whole Milk", variant: "1 Litre", quantity: 3, price: "£1.20" },
      { productName: "Salted Butter", variant: "250g", quantity: 1, price: "£1.80" },
    ],
    deliveryAddress: "14 Meadow Lane, Manchester, M14 5TF",
    estimatedDelivery: "1 Jun 2024",
  },
];

// ─── Subscriptions ────────────────────────────────────────────────────────────
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type DeliveryFrequency = "weekly" | "fortnightly" | "monthly" | "custom";

export interface SubscriptionItem {
  productName: string;
  variant: string;
  quantity: number;
  pricePerDelivery: string;
}

export interface Subscription {
  id: string;
  name: string;
  status: SubscriptionStatus;
  frequency: DeliveryFrequency;
  preferredDay: string;
  nextDelivery: string;
  deliveryAddress: string;
  paymentStatus: PaymentStatus;
  total: string;
  items: SubscriptionItem[];
  startDate: string;
}

export const mockSubscriptions: Subscription[] = [
  {
    id: "sub-001",
    name: "Weekly Milk & Essentials",
    status: "active",
    frequency: "weekly",
    preferredDay: "Tuesday",
    nextDelivery: "18 Jun 2024",
    deliveryAddress: "14 Meadow Lane, Manchester, M14 5TF",
    paymentStatus: "paid",
    total: "£9.50",
    items: [
      { productName: "Whole Milk", variant: "2 Litres", quantity: 2, pricePerDelivery: "£2.30" },
      { productName: "Greek Yogurt", variant: "500g", quantity: 1, pricePerDelivery: "£2.10" },
      { productName: "Salted Butter", variant: "250g", quantity: 1, pricePerDelivery: "£1.80" },
    ],
    startDate: "2 Jan 2024",
  },
  {
    id: "sub-002",
    name: "Fortnightly Cheese Box",
    status: "paused",
    frequency: "fortnightly",
    preferredDay: "Friday",
    nextDelivery: "Paused",
    deliveryAddress: "14 Meadow Lane, Manchester, M14 5TF",
    paymentStatus: "pending",
    total: "£6.80",
    items: [{ productName: "Halloumi Cheese", variant: "400g", quantity: 1, pricePerDelivery: "£6.80" }],
    startDate: "15 Mar 2024",
  },
];

// ─── Deliveries ───────────────────────────────────────────────────────────────
export type DeliveryStatus =
  | "scheduled"
  | "preparing"
  | "out-for-delivery"
  | "delivered"
  | "failed"
  | "rescheduled";

export interface Delivery {
  id: string;
  date: string;
  window: string;
  reference: string;
  referenceType: "order" | "subscription";
  productsSummary: string;
  address: string;
  status: DeliveryStatus;
  canReschedule: boolean;
}

export const mockDeliveries: Delivery[] = [
  {
    id: "del-001",
    date: "18 Jun 2024",
    window: "8:00am – 12:00pm",
    reference: "LVD-20240618-002",
    referenceType: "order",
    productsSummary: "Semi-Skimmed Milk ×2, Labneh ×1, Double Cream ×1",
    address: "14 Meadow Lane, Manchester, M14 5TF",
    status: "out-for-delivery",
    canReschedule: false,
  },
  {
    id: "del-002",
    date: "25 Jun 2024",
    window: "8:00am – 12:00pm",
    reference: "sub-001",
    referenceType: "subscription",
    productsSummary: "Whole Milk ×2, Greek Yogurt ×1, Salted Butter ×1",
    address: "14 Meadow Lane, Manchester, M14 5TF",
    status: "scheduled",
    canReschedule: true,
  },
  {
    id: "del-003",
    date: "12 Jun 2024",
    window: "8:00am – 12:00pm",
    reference: "LVD-20240612-001",
    referenceType: "order",
    productsSummary: "Whole Milk ×2, Greek Yogurt ×1, Salted Butter ×2",
    address: "14 Meadow Lane, Manchester, M14 5TF",
    status: "delivered",
    canReschedule: false,
  },
  {
    id: "del-004",
    date: "4 Jun 2024",
    window: "8:00am – 12:00pm",
    reference: "sub-001",
    referenceType: "subscription",
    productsSummary: "Whole Milk ×2, Greek Yogurt ×1, Salted Butter ×1",
    address: "14 Meadow Lane, Manchester, M14 5TF",
    status: "failed",
    canReschedule: true,
  },
];

// ─── Addresses ────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  instructions?: string;
  isDefault: boolean;
}

export const mockAddresses: Address[] = [
  {
    id: "addr-001",
    fullName: "Sarah Mitchell",
    phone: "+44 7712 345678",
    line1: "14 Meadow Lane",
    city: "Manchester",
    postcode: "M14 5TF",
    instructions: "Leave at the door if no answer.",
    isDefault: true,
  },
  {
    id: "addr-002",
    fullName: "Sarah Mitchell",
    phone: "+44 7712 345678",
    line1: "42 Oak Street",
    line2: "Flat 3",
    city: "Salford",
    postcode: "M6 7PQ",
    isDefault: false,
  },
];

// ─── Payment Methods ──────────────────────────────────────────────────────────
export interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  label: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
}

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm-001",
    type: "card",
    label: "Visa",
    last4: "4242",
    expiry: "08/26",
    isDefault: true,
  },
  {
    id: "pm-002",
    type: "card",
    label: "Mastercard",
    last4: "1234",
    expiry: "03/25",
    isDefault: false,
  },
];

// ─── Payment History ──────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  date: string;
  reference: string;
  referenceType: "order" | "subscription";
  amount: string;
  status: PaymentStatus;
}

export const mockPayments: Payment[] = [
  { id: "pay-001", date: "18 Jun 2024", reference: "LVD-20240618-002", referenceType: "order", amount: "£9.60", status: "paid" },
  { id: "pay-002", date: "12 Jun 2024", reference: "LVD-20240612-001", referenceType: "order", amount: "£12.70", status: "paid" },
  { id: "pay-003", date: "11 Jun 2024", reference: "sub-001", referenceType: "subscription", amount: "£9.50", status: "paid" },
  { id: "pay-004", date: "4 Jun 2024", reference: "sub-002", referenceType: "subscription", amount: "£6.80", status: "failed" },
  { id: "pay-005", date: "30 May 2024", reference: "LVD-20240530-004", referenceType: "order", amount: "£5.10", status: "refunded" },
];

// ─── Support Requests ─────────────────────────────────────────────────────────
export type SupportStatus = "open" | "in-review" | "resolved" | "closed";

export interface SupportRequest {
  id: string;
  requestId: string;
  date: string;
  subject: string;
  issueType: string;
  status: SupportStatus;
  message: string;
}

export const mockSupportRequests: SupportRequest[] = [
  {
    id: "sr-001",
    requestId: "SUP-0012",
    date: "10 Jun 2024",
    subject: "Missing item from order LVD-20240612-001",
    issueType: "Order Issue",
    status: "in-review",
    message: "My butter was missing from my last delivery.",
  },
  {
    id: "sr-002",
    requestId: "SUP-0009",
    date: "3 Jun 2024",
    subject: "Driver couldn't find my address",
    issueType: "Delivery Issue",
    status: "resolved",
    message: "The driver left without delivering, please update my delivery notes.",
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: "order" | "subscription" | "delivery" | "payment" | "offer";
}

export const mockNotifications: Notification[] = [
  { id: "n-001", title: "Order Out for Delivery", body: "Your order LVD-20240618-002 is on its way!", date: "18 Jun 2024, 9:10am", read: false, type: "delivery" },
  { id: "n-002", title: "Order Confirmed", body: "Your order LVD-20240625-003 has been confirmed.", date: "25 Jun 2024, 8:00am", read: false, type: "order" },
  { id: "n-003", title: "Upcoming Delivery Reminder", body: "Your subscription delivery is scheduled for 25 Jun.", date: "24 Jun 2024, 6:00pm", read: true, type: "subscription" },
  { id: "n-004", title: "Payment Failed", body: "We couldn't process payment for your Cheese Box subscription.", date: "4 Jun 2024, 10:15am", read: true, type: "payment" },
  { id: "n-005", title: "New Offer Available", body: "Get 10% off all bundles this week. Use code BUNDLE10.", date: "1 Jun 2024, 9:00am", read: true, type: "offer" },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export const mockFAQs = [
  {
    id: "faq-1",
    question: "What days do you deliver?",
    answer: "We currently deliver Tuesday, Thursday, and Saturday. You can choose your preferred day when setting up a subscription or placing an order.",
  },
  {
    id: "faq-2",
    question: "Can I pause my subscription?",
    answer: "Yes! You can pause your subscription at any time from the My Subscriptions page. Pausing takes effect from the next scheduled delivery.",
  },
  {
    id: "faq-3",
    question: "How do I change my delivery address?",
    answer: "Go to Addresses in your portal to add, edit, or change your default delivery address.",
  },
  {
    id: "faq-4",
    question: "What is your refund policy?",
    answer: "If there is an issue with your order, please contact us within 24 hours. We offer full refunds or replacements for faulty or missing products.",
  },
  {
    id: "faq-5",
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription from the subscription management page. Cancellations take effect from the next billing cycle.",
  },
];
