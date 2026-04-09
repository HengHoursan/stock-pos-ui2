import { BaseService } from "../base/base.service";
import type { 
  SaleReturn, 
  CreateSaleReturnRequest, 
  UpdateSaleReturnRequest, 
  UpdateSaleReturnStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class SaleReturnService extends BaseService {
  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<SaleReturn>>> {
    return this.post<ApiResponse<PaginationResponse<SaleReturn>>>("/sale-returns/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<SaleReturn>> {
    return this.post<ApiResponse<SaleReturn>>("/sale-returns/detail", { id });
  }

  async create(payload: CreateSaleReturnRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-returns/create", payload);
  }

  async update(payload: UpdateSaleReturnRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-returns/update", payload);
  }

  async updateStatus(payload: UpdateSaleReturnStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-returns/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/sale-returns/soft-delete", { id });
  }
}
