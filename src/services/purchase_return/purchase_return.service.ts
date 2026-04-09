import { BaseService } from "../base/base.service";
import type { 
  PurchaseReturn, 
  CreatePurchaseReturnRequest, 
  UpdatePurchaseReturnRequest, 
  UpdatePurchaseReturnStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class PurchaseReturnService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<PurchaseReturn>>> {
    return this.post<ApiResponse<PaginationResponse<PurchaseReturn>>>("/purchase-returns/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<PurchaseReturn>> {
    return this.post<ApiResponse<PurchaseReturn>>("/purchase-returns/detail", { id });
  }

  async create(payload: CreatePurchaseReturnRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-returns/create", payload);
  }

  async update(payload: UpdatePurchaseReturnRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-returns/update", payload);
  }

  async updateStatus(payload: UpdatePurchaseReturnStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-returns/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-returns/soft-delete", { id });
  }
}
