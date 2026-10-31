/**
 * @file src/types/adminMonitoring.ts
 *
 * Definisi tipe TypeScript untuk Monitoring & Administrasi (FASE 4.5.2):
 *   - Notifications
 *   - Activity Logs
 *   - Maintenance & Backup/Import
 *   - System Health
 *   - Global Search Results
 */

// =============================================================================
// A. NOTIFICATIONS
// =============================================================================

export type NotificationType =
  | "order"
  | "payment"
  | "stock"
  | "review"
  | "promotion"
  | "system"
  | "banner"
  | "backup"
  | "login";

export interface DbNotification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  link_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// B. ACTIVITY LOGS
// =============================================================================

export type ActivityModule =
  | "auth"
  | "product"
  | "category"
  | "order"
  | "review"
  | "inventory"
  | "promotion"
  | "banner"
  | "cms"
  | "settings"
  | "media"
  | "maintenance";

export interface DbActivityLog {
  id: string;
  user_id: string | null;
  user_name?: string; // Optional joined/inferred admin name
  action: string;
  entity_type: ActivityModule | string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// C. MAINTENANCE & BACKUP
// =============================================================================

export interface BackupRecord {
  id: string;
  filename: string;
  size: number;
  type: "database" | "full_export";
  status: "success" | "pending" | "failed";
  created_at: string;
}

export interface ImportValidationResult {
  valid: boolean;
  totalRows: number;
  validRowsCount: number;
  errors: { row: number; field: string; message: string }[];
  preview: Record<string, unknown>[];
}

// =============================================================================
// D. SYSTEM HEALTH
// =============================================================================

export interface SystemHealthStatus {
  databaseStatus: "connected" | "degraded" | "disconnected";
  storageStatus: "connected" | "degraded" | "disconnected";
  authStatus: "connected" | "degraded" | "disconnected";
  productsCount: number;
  customersCount: number;
  ordersCount: number;
  reviewsCount: number;
  mediaCount: number;
  storageSizeBytes: number;
  migrationVersion: string;
  projectVersion: string;
  environment: string;
}

// =============================================================================
// E. GLOBAL SEARCH
// =============================================================================

export interface GlobalSearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  module: "Produk" | "Kategori" | "Pesanan" | "Customer" | "Review" | "Promo" | "FAQ" | "Banner" | "Media";
  url: string;
  badge?: string;
}

export type GlobalSearchResults = Record<string, GlobalSearchResultItem[]>;
