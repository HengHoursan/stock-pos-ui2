import { BaseService } from "../base/base.service";
import type { 
  SalePayment, 
  CreateSalePaymentRequest, 
  UpdateSalePaymentRequest, 
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class SalePaymentService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<SalePayment>>> {
    return this.post<ApiResponse<PaginationResponse<SalePayment>>>("/sale-payments/list", pagination);
  }

  async getAll(): Promise<ApiResponse<SalePayment[]>> {
    return this.post<ApiResponse<SalePayment[]>>("/sale-payments/all", {});
  }

  async getDetail(id: number): Promise<ApiResponse<SalePayment>> {
    return this.post<ApiResponse<SalePayment>>("/sale-payments/detail", { id });
  }

  async create(payload: CreateSalePaymentRequest): Promise<ApiResponse<SalePayment>> {
    return this.post<ApiResponse<SalePayment>>("/sale-payments/create", payload);
  }

  async update(payload: UpdateSalePaymentRequest): Promise<ApiResponse<SalePayment>> {
    return this.post<ApiResponse<SalePayment>>("/sale-payments/update", payload);
  }

  async cancel(id: number): Promise<ApiResponse<SalePayment>> {
    return this.post<ApiResponse<SalePayment>>("/sale-payments/cancel", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-payments/force-delete", { id });
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    return this.forceDelete(id);
  }
}
