import { BaseService } from "../base/base.service";
import type { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest, 
  UpdateCategoryStatusRequest 
} from "@/types/category";
import type { ApiResponse, PaginationRequest, PaginationResponse } from "@/types/common";

export class CategoryService extends BaseService {
  async getAll(): Promise<ApiResponse<Category[]>> {
    return this.post<ApiResponse<Category[]>>("/categories/all");
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Category>>> {
    return this.post<ApiResponse<PaginationResponse<Category>>>("/categories/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Category>> {
    return this.post<ApiResponse<Category>>("/categories/detail", { id });
  }

  async create(payload: CreateCategoryRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/categories/create", payload);
  }

  async update(payload: UpdateCategoryRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/categories/update", payload);
  }

  async updateStatus(payload: UpdateCategoryStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/categories/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/categories/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/categories/force-delete", { id });
  }
}
