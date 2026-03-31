import { BaseService } from "@/services/base/base.service";
import type { ApiResponse, PaginationRequest, PaginationResponse } from "@/types/common";
import type { Discount, CreateDiscountRequest, UpdateDiscountRequest, UpdateDiscountStatusRequest } from "@/types/discount";

export class DiscountService extends BaseService {
  async getAll(): Promise<ApiResponse<Discount[]>> {
    return this.post<ApiResponse<Discount[]>>("/discounts/all", {});
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Discount>>> {
    return this.post<ApiResponse<PaginationResponse<Discount>>>("/discounts/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Discount>> {
    return this.post<ApiResponse<Discount>>("/discounts/detail", { id });
  }

  async create(payload: CreateDiscountRequest): Promise<ApiResponse<Discount>> {
    return this.post<ApiResponse<Discount>>("/discounts/create", payload);
  }

  async update(payload: UpdateDiscountRequest): Promise<ApiResponse<Discount>> {
    return this.post<ApiResponse<Discount>>("/discounts/update", payload);
  }

  async updateStatus(payload: UpdateDiscountStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/discounts/force-delete", { id });
  }
}

export const discountService = new DiscountService();
