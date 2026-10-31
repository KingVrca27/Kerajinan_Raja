/**
 * @file src/types/ops.ts
 *
 * Definisi tipe TypeScript (camelCase & Db snake_case) untuk Manajemen Operasional Toko (FASE 4.5.1):
 *   - Order & OrderItems
 *   - Customer
 *   - Review
 *   - Inventory Log
 *   - Promotion
 *   - Operational Dashboard Stats
 */

// =============================================================================
// A. ORDERS
// =============================================================================

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded";

export interface DbOrder {
  id: string;
  order_number: string;
  customer_id: string;
  promotion_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  bank_account_id: string | null;
  payment_proof_path: string | null;
  payment_verified_at: string | null;
  payment_verified_by: string | null;
  payment_rejection_reason: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
  shipping_district: string | null;
  shipping_village: string | null;
  shipping_destination_id: string | null;
  shipping_courier: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends DbOrder {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  bank_accounts?: { bank_name: string; account_number: string; account_name: string } | null;
  items?: DbOrderItem[];
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  title: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

// =============================================================================
// B. CUSTOMERS
// =============================================================================

export interface DbCustomer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  destination_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithStats extends DbCustomer {
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
}

// =============================================================================
// C. REVIEWS
// =============================================================================

export interface DbReview {
  id: string;
  product_id: string;
  customer_id: string | null;
  order_item_id?: string | null;
  rating: number; // 1 - 5
  title: string | null;
  content: string | null;
  image_url?: string | null;
  is_approved: boolean;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithDetails extends DbReview {
  product_name?: string;
  customer_name?: string;
}

// =============================================================================
// D. INVENTORY LOGS
// =============================================================================

export type InventoryLogType = "in" | "out" | "adjustment" | "return" | "damaged";

export interface DbInventoryLog {
  id: string;
  product_id: string;
  user_id: string | null;
  type: InventoryLogType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryLogWithDetails extends DbInventoryLog {
  product_name?: string;
  product_sku?: string;
}

// =============================================================================
// E. PROMOTIONS
// =============================================================================

export type PromotionType = "percentage" | "fixed";

export interface DbPromotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: PromotionType;
  value: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// F. OPERATIONAL DASHBOARD STATS
// =============================================================================

export interface SalesChartData {
  label: string; // Mingguan / Bulanan / Tahunan label
  sales: number;
  ordersCount: number;
}

export interface OperationalDashboardStats {
  weeklySales: number;
  monthlySales: number;
  yearlySales: number;
  activeProducts: number;
  soldProducts: number;
  newOrdersCount: number;
  processingOrdersCount: number;
  totalCustomers: number;
  totalReviews: number;
  averageRating: number;
  weeklyChart: SalesChartData[];
  monthlyChart: SalesChartData[];
  yearlyChart: SalesChartData[];
}
