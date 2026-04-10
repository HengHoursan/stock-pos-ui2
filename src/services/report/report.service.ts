import { BaseService } from "../base/base.service";
import type {
  ApiResponse,
  PaginationRequest,
  DashboardMetrics,
  SalesReport,
  PurchasesReport,
  ProfitAndLossReport,
  InventoryReport,
  TopPerformersReport,
} from "@/types";

export class ReportService extends BaseService {
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.post<ApiResponse<DashboardMetrics>>("/reports/dashboard");
  }

  async getSalesReport(query: PaginationRequest): Promise<ApiResponse<SalesReport>> {
    return this.post<ApiResponse<SalesReport>>("/reports/sales", query);
  }

  async getPurchasesReport(query: PaginationRequest): Promise<ApiResponse<PurchasesReport>> {
    return this.post<ApiResponse<PurchasesReport>>("/reports/purchases", query);
  }

  async getProfitAndLossReport(query: PaginationRequest): Promise<ApiResponse<ProfitAndLossReport>> {
    return this.post<ApiResponse<ProfitAndLossReport>>("/reports/profit-and-loss", query);
  }

  async getInventoryReport(query: PaginationRequest): Promise<ApiResponse<InventoryReport>> {
    return this.post<ApiResponse<InventoryReport>>("/reports/inventory", query);
  }

  async getTopPerformersReport(query: PaginationRequest): Promise<ApiResponse<TopPerformersReport>> {
    return this.post<ApiResponse<TopPerformersReport>>("/reports/top-performers", query);
  }
}
