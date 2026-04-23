import { BaseService } from "../base/base.service";
import type { 
  SaleQuotation, 
  CreateSaleQuotationRequest, 
  UpdateSaleQuotationRequest, 
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class SaleQuotationService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<SaleQuotation>>> {
    return this.post<ApiResponse<PaginationResponse<SaleQuotation>>>("sale-quotations/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<SaleQuotation>> {
    return this.post<ApiResponse<SaleQuotation>>("sale-quotations/detail", { id });
  }

  async create(payload: CreateSaleQuotationRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("sale-quotations/create", payload);
  }

  async update(payload: UpdateSaleQuotationRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("sale-quotations/update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("sale-quotations/soft-delete", { id });
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    return this.softDelete(id);
  }
}
