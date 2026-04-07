import { BaseService } from "../base/base.service";
import type { 
  PurchaseOrder, 
  CreatePurchaseOrderRequest, 
  UpdatePurchaseOrderRequest,
  UpdatePurchaseOrderStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class PurchaseOrderService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<PurchaseOrder>>> {
    return this.post<ApiResponse<PaginationResponse<PurchaseOrder>>>("/purchase-orders/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<PurchaseOrder>> {
    return this.post<ApiResponse<PurchaseOrder>>("/purchase-orders/show", { id });
  }

  async create(payload: CreatePurchaseOrderRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-orders/create", payload);
  }

  async update(payload: UpdatePurchaseOrderRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-orders/update", payload);
  }

  async updateStatus(payload: UpdatePurchaseOrderStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-orders/update-status", payload);
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-orders/delete", { id });
  }
}
