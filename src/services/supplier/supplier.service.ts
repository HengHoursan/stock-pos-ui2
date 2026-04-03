import { BaseService } from "../base/base.service";
import type { 
  Supplier, 
  CreateSupplierRequest, 
  UpdateSupplierRequest, 
  UpdateSupplierStatusRequest 
} from "@/types/supplier";
import type { ApiResponse, PaginationRequest, PaginationResponse } from "@/types/common";

export class SupplierService extends BaseService {
  async getAll(): Promise<ApiResponse<Supplier[]>> {
    return this.post<ApiResponse<Supplier[]>>("/suppliers/all");
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Supplier>>> {
    return this.post<ApiResponse<PaginationResponse<Supplier>>>("/suppliers/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Supplier>> {
    return this.post<ApiResponse<Supplier>>("/suppliers/detail", { id });
  }

  async create(payload: CreateSupplierRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/suppliers/create", payload);
  }

  async update(payload: UpdateSupplierRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/suppliers/update", payload);
  }

  async updateStatus(payload: UpdateSupplierStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/suppliers/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/suppliers/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/suppliers/force-delete", { id });
  }
}
