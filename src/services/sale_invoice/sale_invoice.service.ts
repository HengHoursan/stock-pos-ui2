import { BaseService } from "../base/base.service";
import type { 
  SaleInvoice, 
  CreateSaleInvoiceRequest, 
  UpdateSaleInvoiceRequest,
  UpdateSaleInvoiceStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class SaleInvoiceService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<SaleInvoice>>> {
    return this.post<ApiResponse<PaginationResponse<SaleInvoice>>>("/sale-invoices/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<SaleInvoice>> {
    return this.post<ApiResponse<SaleInvoice>>("/sale-invoices/detail", { id });
  }

  async create(payload: CreateSaleInvoiceRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-invoices/create", payload);
  }

  async update(payload: UpdateSaleInvoiceRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-invoices/update", payload);
  }

  async updateStatus(payload: UpdateSaleInvoiceStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-invoices/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-invoices/soft-delete", { id });
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    return this.softDelete(id);
  }
}
