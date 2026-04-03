import { BaseService } from "../base/base.service";
import type { 
  Customer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  UpdateCustomerStatusRequest 
} from "@/types/customer";
import type { ApiResponse, PaginationRequest, PaginationResponse } from "@/types/common";

export class CustomerService extends BaseService {
  async getAll(): Promise<ApiResponse<Customer[]>> {
    return this.post<ApiResponse<Customer[]>>("/customers/all");
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Customer>>> {
    return this.post<ApiResponse<PaginationResponse<Customer>>>("/customers/list", pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Customer>> {
    return this.post<ApiResponse<Customer>>("/customers/detail", { id });
  }

  async create(payload: CreateCustomerRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/customers/create", payload);
  }

  async update(payload: UpdateCustomerRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/customers/update", payload);
  }

  async updateStatus(payload: UpdateCustomerStatusRequest): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/customers/status-update", payload);
  }

  async softDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/customers/soft-delete", { id });
  }

  async forceDelete(id: number): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>("/customers/force-delete", { id });
  }
}
