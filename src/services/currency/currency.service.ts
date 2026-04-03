import { BaseService } from "@/services/base/base.service";
import type { 
  Currency, 
  CreateCurrencyRequest, 
  UpdateCurrencyRequest, 
  UpdateCurrencyStatusRequest,
  ApiResponse, 
  PaginationResponse 
} from "@/types";

export class CurrencyService extends BaseService {
  async getAll(): Promise<ApiResponse<Currency[]>> {
    return this.post<ApiResponse<Currency[]>>("/currencies/all", {});
  }

  async getList(payload: any): Promise<ApiResponse<PaginationResponse<Currency>>> {
    return this.post<ApiResponse<PaginationResponse<Currency>>>("/currencies/list", payload);
  }

  async getDetail(id: number): Promise<ApiResponse<Currency>> {
    return this.post<ApiResponse<Currency>>("/currencies/detail", { id });
  }

  async create(payload: CreateCurrencyRequest): Promise<ApiResponse<Currency>> {
    return this.post<ApiResponse<Currency>>("/currencies/create", payload);
  }

  async update(payload: UpdateCurrencyRequest): Promise<ApiResponse<Currency>> {
    return this.post<ApiResponse<Currency>>("/currencies/update", payload);
  }

  async updateStatus(payload: UpdateCurrencyStatusRequest): Promise<ApiResponse<Currency>> {
    return this.post<ApiResponse<Currency>>("/currencies/update-status", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/currencies/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/currencies/force-delete", { id });
  }
}

export const currencyService = new CurrencyService();
