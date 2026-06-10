// Complete type definitions for the OG Tees platform

export interface ProductColor {
  name: string;
  hex: string;
  swatchUrl?: string;
  images: {
    front: string;
    back: string;
    left?: string;
    right?: string;
    model?: string;
  };
}

export interface Product {
  id: string;
  distributorSku: string;
  distributor: 'sanmar' | 'ssactivewear';
  brand: string;
  name: string;
  styleNumber: string;
  description: string;
  colors: ProductColor[];
  sizes: string[];
  priceBase: number;
  category: 'tshirt' | 'hoodie' | 'sweatshirt' | 'polo' | 'tank' | 'longsleeve' | 'hat' | 'bag';
  inventory: Record<string, number>; // "color-size" -> qty
  tags: string[];
}

export interface DesignElement {
  type: 'text' | 'image' | 'clipart';
  id: string;
}

export interface CartItem {
  id: string;
  product: Product;
  color: string;
  size: string;
  quantity: number;
  designJson?: string;
  designPreviewUrl?: string;
  unitPrice: number;
  printPrice: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'completed';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  stripePaymentId?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  printPrice: number;
  total: number;
}

export interface ClipartItem {
  id: string;
  name: string;
  category: string;
  svgContent: string;
  tags: string[];
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  canvasJson: string;
}
