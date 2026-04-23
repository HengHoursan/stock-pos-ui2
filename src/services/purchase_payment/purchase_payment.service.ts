import { BaseService } from "../base/base.service";
import type { 
  PurchasePayment, 
  CreatePurchasePaymentRequest, 
  UpdatePurchasePaymentRequest, 
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class PurchasePaymentService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<PurchasePayment>>> {
    return this.post<ApiResponse<PaginationResponse<PurchasePayment>>>("/purchase-payments/list", pagination);
  }

  async getAll(): Promise<ApiResponse<PurchasePayment[]>> {
    return this.post<ApiResponse<PurchasePayment[]>>("/purchase-payments/all", {});
  }

  async getDetail(id: number): Promise<ApiResponse<PurchasePayment>> {
    return this.post<ApiResponse<PurchasePayment>>("/purchase-payments/detail", { id });
  }

  async create(payload: CreatePurchasePaymentRequest): Promise<ApiResponse<PurchasePayment>> {
    return this.post<ApiResponse<PurchasePayment>>("/purchase-payments/create", payload);
  }

  async update(payload: UpdatePurchasePaymentRequest): Promise<ApiResponse<PurchasePayment>> {
    return this.post<ApiResponse<PurchasePayment>>("/purchase-payments/update", payload);
  }

  async cancel(id: number): Promise<ApiResponse<PurchasePayment>> {
    return this.post<ApiResponse<PurchasePayment>>("/purchase-payments/cancel", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-payments/force-delete", { id });
  }
}
