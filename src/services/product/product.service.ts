import { BaseService } from "../base/base.service";
import type { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  UpdateProductStatusRequest 
} from "@/types/product";
import type { ApiResponse, PaginationRequest, PaginationResponse } from "@/types/common";

export class ProductService extends BaseService {
  async getAll(): Promise<ApiResponse<Product[]>> {
    return this.post<ApiResponse<Product[]>>("/products/all");
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Product>>> {
    return this.post<ApiResponse<PaginationResponse<Product>>>("/products/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Product>> {
    return this.post<ApiResponse<Product>>("/products/detail", { id });
  }

  async create(payload: CreateProductRequest): Promise<ApiResponse<Product>> {
    return this.post<ApiResponse<Product>>("/products/create", payload);
  }

  async update(payload: UpdateProductRequest): Promise<ApiResponse<Product>> {
    return this.post<ApiResponse<Product>>("/products/update", payload);
  }

  async updateStatus(payload: UpdateProductStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/products/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/products/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/products/force-delete", { id });
  }
}
