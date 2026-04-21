import { BaseService } from "../base/base.service";
import type { 
  PurchaseQuotation, 
  CreatePurchaseQuotationRequest, 
  UpdatePurchaseQuotationRequest, 
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class PurchaseQuotationService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<PurchaseQuotation>>> {
    return this.post<ApiResponse<PaginationResponse<PurchaseQuotation>>>("/purchase-quotations/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<PurchaseQuotation>> {
    return this.post<ApiResponse<PurchaseQuotation>>("/purchase-quotations/detail", { id });
  }

  async create(payload: CreatePurchaseQuotationRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-quotations/create", payload);
  }

  async update(payload: UpdatePurchaseQuotationRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-quotations/update", payload);
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-quotations/delete", { id });
  }
}
