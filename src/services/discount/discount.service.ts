import { BaseService } from "../base/base.service";
import type { 
  Discount, 
  CreateDiscountRequest, 
  UpdateDiscountRequest, 
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class DiscountService extends BaseService {
  async getAll(): Promise<ApiResponse<Discount[]>> {
    return this.post<ApiResponse<Discount[]>>("/discounts/all");
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Discount>>> {
    return this.post<ApiResponse<PaginationResponse<Discount>>>("/discounts/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Discount>> {
    return this.post<ApiResponse<Discount>>("/discounts/detail", { id });
  }

  async create(payload: CreateDiscountRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/create", payload);
  }

  async update(payload: UpdateDiscountRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/soft-delete", { id });
  }

  async updateStatus(id: number, status: boolean): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/status-update", { id, status });
  }

  async duplicate(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/duplicate", { id });
  }

  async bulkSoftDelete(ids: number[]): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/bulk-soft-delete", { ids });
  }

  async bulkUpdateStatus(ids: number[], status: boolean): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/bulk-status-update", { ids, status });
  }
}
