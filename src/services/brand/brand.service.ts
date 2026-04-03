import { BaseService } from "../base/base.service";
import type { 
  Brand, 
  CreateBrandRequest, 
  UpdateBrandRequest, 
  UpdateBrandStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class BrandService extends BaseService {
  async getAll(): Promise<ApiResponse<Brand[]>> {
    return this.post<ApiResponse<Brand[]>>("/brands/all");
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Brand>>> {
    return this.post<ApiResponse<PaginationResponse<Brand>>>("/brands/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Brand>> {
    return this.post<ApiResponse<Brand>>("/brands/detail", { id });
  }

  async create(payload: CreateBrandRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/brands/create", payload);
  }

  async update(payload: UpdateBrandRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/brands/update", payload);
  }

  async updateStatus(payload: UpdateBrandStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/brands/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/brands/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/brands/force-delete", { id });
  }
}
