export type Category = {
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_sold_out?: boolean;
  badge?: string | null;
  preparation_time?: number | null;
  sort_order: number;
};

export type Business = {
  id: string;
  owner_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  whatsapp: string;
  instagram?: string | null;
  city?: string | null;
  state?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  is_active: boolean;
  is_open?: boolean;
  delivery_enabled?: boolean;
  pickup_enabled?: boolean;
  dine_in_enabled?: boolean;
  delivery_fee?: number;
  free_delivery_above?: number | null;
  minimum_order?: number;
  estimated_delivery_min?: number | null;
  estimated_delivery_max?: number | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

export type CheckoutData = {
  customer_name: string;
  customer_phone: string;
  order_type: "delivery" | "pickup" | "local";
  payment_method: "pix" | "cash" | "card";
  address?: string;
  notes?: string;
};
