import type { PaginationResponse } from "./common";

/**
 * Dashboard Metrics
 */
export interface DashboardStat {
  total: number;
  addedThisMonth: number;
}

export interface DashboardGroup {
  customers?: DashboardStat;
  salePayments?: DashboardStat;
  saleReturns?: DashboardStat;
  transactions?: DashboardStat;
  purchasePayments?: DashboardStat;
  purchaseReturns?: DashboardStat;
  products?: DashboardStat;
  suppliers?: DashboardStat;
}

export interface DashboardMetrics {
  pos: DashboardGroup;
  stock: DashboardGroup;
  inventory: DashboardGroup;
}

/**
 * Sales Report
 */
export interface CustomerSalesData {
  customerName: string;
  customerPhone: string;
  totalSpent: number;
  totalInvoices: number;
}

export interface SalesReport {
  totalRevenue: number;
  totalReturns: number;
  netSales: number;
  salesByPaymentMethod: Array<{ paymentMethod: string; total: number }>;
  salesByCustomer: PaginationResponse<CustomerSalesData>;
}

/**
 * Purchases Report
 */
export interface SupplierPurchasesData {
  supplierName: string;
  totalSpent: number;
  totalInvoices: number;
}

export interface PurchasesReport {
  totalExpenses: number;
  purchasesBySupplier: PaginationResponse<SupplierPurchasesData>;
}

/**
 * Profit & Loss Report
 */
export interface ProfitAndLossReport {
  netSales: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

/**
 * Inventory Report
 */
export interface LowStockAlertData {
  id: number;
  name: string;
  code: string;
  currentStock: number;
  alertQuantity: number;
}

export interface InventoryReport {
  currentStockLevels: number;
  stockValuation: number;
  lowStockAlerts: PaginationResponse<LowStockAlertData>;
}

/**
 * Top Performers Report
 */
export interface BestSellingProductData {
  productName: string;
  productCode: string;
  totalSold: number;
  revenueGenerated: number;
}

export interface TopCustomerData {
  customerName: string;
  customerPhone: string;
  totalSpent: number;
}

export interface TopPerformersReport {
  bestSellingProducts: PaginationResponse<BestSellingProductData>;
  topCustomers: PaginationResponse<TopCustomerData>;
}
