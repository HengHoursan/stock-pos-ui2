import { BaseService } from "../base/base.service";
import type { 
  PurchaseInvoice, 
  CreatePurchaseInvoiceRequest, 
  UpdatePurchaseInvoiceRequest,
  UpdatePurchaseInvoiceStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class PurchaseInvoiceService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<PurchaseInvoice>>> {
    return this.post<ApiResponse<PaginationResponse<PurchaseInvoice>>>("/purchase-invoices/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<PurchaseInvoice>> {
    return this.post<ApiResponse<PurchaseInvoice>>("/purchase-invoices/show", { id });
  }

  async create(payload: CreatePurchaseInvoiceRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-invoices/create", payload);
  }

  async update(payload: UpdatePurchaseInvoiceRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-invoices/update", payload);
  }

  async updateStatus(payload: UpdatePurchaseInvoiceStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-invoices/update-status", payload);
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/purchase-invoices/delete", { id });
  }
}
