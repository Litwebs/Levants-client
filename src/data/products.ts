import productMilk from '@/assets/product-milk.jpg';
import productMilkshake from '@/assets/product-milkshake.jpg';
import productCream from '@/assets/product-cream.jpg';
import productHoney from '@/assets/product-honey.jpg';
import productButter from '@/assets/product-butter.jpg';
import productCheddar from '@/assets/product-cheddar.jpg';
import productRedLeicester from '@/assets/product-red-leicester.jpg';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  shortDescription: string;
  longDescription: string;
  images: string[];
  variants?: ProductVariant[];
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  badges: string[];
  ingredients?: string;
  allergens?: string;
  storage?: string;
  nutritionInfo?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export const categories: Category[] = [
  {
    id: 'milk',
    name: 'Milk',
    slug: 'milk',
    description: 'Fresh whole milk from local farms',
    image: productMilk,
    productCount: 1,
  },
  {
    id: 'milkshakes',
    name: 'Milkshakes',
    slug: 'milkshakes',
    description: 'Creamy, indulgent farm-fresh milkshakes',
    image: productMilkshake,
    productCount: 1,
  },
  {
    id: 'cream',
    name: 'Cream',
    slug: 'cream',
    description: 'Rich double cream for cooking and desserts',
    image: productCream,
    productCount: 1,
  },
  {
    id: 'honey',
    name: 'Honey',
    slug: 'honey',
    description: 'Pure local honey, naturally harvested',
    image: productHoney,
    productCount: 1,
  },
  {
    id: 'butter',
    name: 'Butter',
    slug: 'butter',
    description: 'Traditional churned butter',
    image: productButter,
    productCount: 1,
  },
  {
    id: 'cheese',
    name: 'Cheese',
    slug: 'cheese',
    description: 'Artisan cheeses aged to perfection',
    image: productCheddar,
    productCount: 2,
  },
];

export const products: Product[] = [
  {
    id: 'farm-fresh-milk',
    name: 'Farm Fresh Milk',
    category: 'milk',
    price: 2.49,
    shortDescription: 'Whole milk from grass-fed cows, delivered fresh daily.',
    longDescription: 'Our Farm Fresh Milk comes from our herd of grass-fed Jersey and Holstein cows. The milk is gently pasteurised to preserve its natural goodness while ensuring safety. Rich in calcium and vitamins, this creamy whole milk is perfect for drinking, cooking, or adding to your morning coffee.',
    images: [productMilk, productMilk, productMilk],
    variants: [
      { id: 'milk-1l', name: '1 Litre', price: 2.49, stockStatus: 'in-stock' },
      { id: 'milk-2l', name: '2 Litres', price: 4.49, stockStatus: 'in-stock' },
      { id: 'milk-4l', name: '4 Litres', price: 7.99, stockStatus: 'low-stock' },
    ],
    stockStatus: 'in-stock',
    badges: ['Farm Fresh', 'Bestseller'],
    ingredients: 'Whole pasteurised milk',
    allergens: 'Contains: Milk',
    storage: 'Keep refrigerated at 1-4°C. Use within 3 days of opening.',
  },
  {
    id: 'farm-fresh-milkshake',
    name: 'Farm Fresh Milkshake',
    category: 'milkshakes',
    price: 3.99,
    shortDescription: 'Thick, creamy milkshake made with real farm milk.',
    longDescription: 'Our indulgent Farm Fresh Milkshake is made with our own creamy whole milk and natural flavourings. Each bottle is handcrafted for maximum creaminess. Available in classic flavours, these milkshakes are a treat for any time of day.',
    images: [productMilkshake, productMilkshake, productMilkshake],
    variants: [
      { id: 'shake-chocolate', name: 'Chocolate', price: 3.99, stockStatus: 'in-stock' },
      { id: 'shake-strawberry', name: 'Strawberry', price: 3.99, stockStatus: 'in-stock' },
      { id: 'shake-vanilla', name: 'Vanilla', price: 3.99, stockStatus: 'in-stock' },
      { id: 'shake-banana', name: 'Banana', price: 3.99, stockStatus: 'low-stock' },
    ],
    stockStatus: 'in-stock',
    badges: ['Farm Fresh', 'No Added Sugar'],
  },
  {
    id: 'fresh-double-cream',
    name: 'Fresh Double Cream',
    category: 'cream',
    price: 3.29,
    shortDescription: 'Luxuriously thick double cream for cooking and desserts.',
    longDescription: 'Our Fresh Double Cream is produced from the richest milk, carefully separated to create a thick, velvety cream with a minimum 48% fat content. Perfect for whipping, pouring over desserts, or enriching your favourite recipes.',
    images: [productCream, productCream],
    variants: [
      { id: 'cream-300ml', name: '300ml', price: 3.29, stockStatus: 'in-stock' },
      { id: 'cream-600ml', name: '600ml', price: 5.99, stockStatus: 'in-stock' },
    ],
    stockStatus: 'in-stock',
    badges: ['Farm Fresh'],
    ingredients: 'Fresh pasteurised double cream',
    allergens: 'Contains: Milk',
    storage: 'Keep refrigerated at 1-4°C. Use within 5 days of opening.',
  },
  {
    id: 'honey',
    name: 'Honey',
    category: 'honey',
    price: 8.99,
    shortDescription: 'Pure raw honey from local wildflower meadows.',
    longDescription: 'Our pure raw honey is harvested from beehives situated in wildflower meadows near the farm. Unprocessed and unfiltered, this golden honey retains all its natural enzymes, pollen, and antioxidants. Each jar offers a unique flavour profile reflecting the seasonal blooms.',
    images: [productHoney, productHoney, productHoney],
    variants: [
      { id: 'honey-340g', name: '340g Jar', price: 8.99, stockStatus: 'in-stock' },
      { id: 'honey-680g', name: '680g Jar', price: 15.99, stockStatus: 'in-stock' },
    ],
    stockStatus: 'in-stock',
    badges: ['Local', 'Raw', 'Limited'],
    ingredients: '100% pure raw honey',
    storage: 'Store in a cool, dry place away from direct sunlight.',
  },
  {
    id: 'butter',
    name: 'Butter',
    category: 'butter',
    price: 4.49,
    shortDescription: 'Traditional churned butter with a rich, creamy taste.',
    longDescription: 'Our Butter is crafted using traditional churning methods that have been passed down through generations. Made from the freshest cream, this butter has a rich, golden colour and a smooth, spreadable texture. Lightly salted to enhance the natural flavour.',
    images: [productButter, productButter],
    variants: [
      { id: 'butter-250g', name: '250g Block', price: 4.49, stockStatus: 'in-stock' },
      { id: 'butter-500g', name: '500g Block', price: 7.99, stockStatus: 'in-stock' },
    ],
    stockStatus: 'in-stock',
    badges: ['Farm Fresh', 'Traditional'],
    ingredients: 'Fresh cream, salt (0.5%)',
    allergens: 'Contains: Milk',
    storage: 'Keep refrigerated at 1-4°C.',
  },
  {
    id: 'mature-cheddar',
    name: 'Mature Cheddar',
    category: 'cheese',
    price: 6.99,
    shortDescription: 'Award-winning mature cheddar aged for 12+ months.',
    longDescription: 'Our Mature Cheddar is aged for a minimum of 12 months in our traditional cellars. This extended aging develops a complex, tangy flavour with subtle crystalline texture. Made using time-honoured techniques and our own milk, this cheese pairs perfectly with crackers, in sandwiches, or melted over dishes.',
    images: [productCheddar, productCheddar, productCheddar],
    variants: [
      { id: 'cheddar-200g', name: '200g Wedge', price: 6.99, stockStatus: 'in-stock' },
      { id: 'cheddar-400g', name: '400g Wedge', price: 12.49, stockStatus: 'in-stock' },
    ],
    stockStatus: 'in-stock',
    badges: ['Award Winning', 'Aged 12+ Months'],
    ingredients: 'Pasteurised milk, salt, rennet, starter culture',
    allergens: 'Contains: Milk',
    storage: 'Keep refrigerated at 4-8°C. Wrap loosely to allow the cheese to breathe.',
  },
  {
    id: 'red-leicester',
    name: 'Red Leicester',
    category: 'cheese',
    price: 5.99,
    shortDescription: 'Mellow, nutty Red Leicester with a distinctive colour.',
    longDescription: 'Our Red Leicester cheese has a beautiful orange-red colour from natural annatto and a smooth, mellow flavour with nutty undertones. Aged for several months, this traditional English cheese is versatile and delicious. Perfect for everyday cooking, sandwiches, or a cheese board.',
    images: [productRedLeicester, productRedLeicester],
    variants: [
      { id: 'leicester-200g', name: '200g Wedge', price: 5.99, stockStatus: 'in-stock' },
      { id: 'leicester-400g', name: '400g Wedge', price: 10.99, stockStatus: 'low-stock' },
    ],
    stockStatus: 'in-stock',
    badges: ['Traditional', 'Vegetarian Friendly'],
    ingredients: 'Pasteurised milk, salt, annatto (natural colour), vegetarian rennet, starter culture',
    allergens: 'Contains: Milk',
    storage: 'Keep refrigerated at 4-8°C.',
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  return products.filter((product) => product.category === categorySlug);
};

export const getBestSellers = (): Product[] => {
  return products.filter((product) => product.badges.includes('Bestseller') || product.badges.includes('Award Winning'));
};

export const getFeaturedProducts = (count: number = 4): Product[] => {
  return products.slice(0, count);
};
