import { BaseService } from "../base/base.service";
import type { 
  Unit, 
  CreateUnitRequest, 
  UpdateUnitRequest, 
  UpdateUnitStatusRequest,
  ApiResponse, 
  PaginationRequest, 
  PaginationResponse 
} from "@/types";

export class UnitService extends BaseService {
  async getAll(): Promise<ApiResponse<Unit[]>> {
    return this.post<ApiResponse<Unit[]>>("/units/all");
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Unit>>> {
    return this.post<ApiResponse<PaginationResponse<Unit>>>("/units/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Unit>> {
    return this.post<ApiResponse<Unit>>("/units/detail", { id });
  }

  async create(payload: CreateUnitRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/units/create", payload);
  }

  async update(payload: UpdateUnitRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/units/update", payload);
  }

  async updateStatus(payload: UpdateUnitStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/units/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/units/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/units/force-delete", { id });
  }
}
