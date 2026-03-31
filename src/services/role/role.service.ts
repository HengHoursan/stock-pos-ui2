import { BaseService } from "@/services/base/base.service";
import type { ApiResponse, PaginationRequest, PaginationResponse } from "@/types/common";
import type { Role, CreateRoleRequest, UpdateRoleRequest, UpdateRoleStatusRequest } from "@/types/role";

export class RoleService extends BaseService {
  async getAll(): Promise<ApiResponse<Role[]>> {
    return this.post<ApiResponse<Role[]>>("/roles/all", {});
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Role>>> {
    return this.post<ApiResponse<PaginationResponse<Role>>>("/roles/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Role>> {
    return this.post<ApiResponse<Role>>("/roles/detail", { id });
  }

  async create(payload: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return this.post<ApiResponse<Role>>("/roles/create", payload);
  }

  async update(payload: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    return this.post<ApiResponse<Role>>("/roles/update", payload);
  }

  async updateStatus(payload: UpdateRoleStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/roles/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/roles/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/roles/force-delete", { id });
  }
}

export const roleService = new RoleService();
