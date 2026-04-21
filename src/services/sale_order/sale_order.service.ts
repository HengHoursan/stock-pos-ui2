import { BaseService } from "../base/base.service";
import type { 
  SaleOrder, 
  CreateSaleOrderRequest, 
  UpdateSaleOrderRequest,
  UpdateSaleOrderStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class SaleOrderService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<SaleOrder>>> {
    return this.post<ApiResponse<PaginationResponse<SaleOrder>>>("/sale-orders/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<SaleOrder>> {
    return this.post<ApiResponse<SaleOrder>>("/sale-orders/detail", { id });
  }

  async create(payload: CreateSaleOrderRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-orders/create", payload);
  }

  async update(payload: UpdateSaleOrderRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-orders/update", payload);
  }

  async updateStatus(payload: UpdateSaleOrderStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-orders/update-status", payload);
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-orders/delete", { id });
  }
}
