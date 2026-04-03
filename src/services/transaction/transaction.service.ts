import { BaseService } from "../base/base.service";
import type { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest, 
  PaginationRequest, 
  ApiResponse, 
  PaginationResponse 
} from "@/types";

export class TransactionService extends BaseService {
  private readonly endpoint = "/transactions";

  async create(data: CreateTransactionRequest): Promise<ApiResponse<Transaction>> {
    return this.post(`${this.endpoint}/create`, data);
  }

  async getList(pagination: PaginationRequest): Promise<ApiResponse<PaginationResponse<Transaction>>> {
    return this.post(`${this.endpoint}/list`, pagination);
  }

  async getDetail(id: number): Promise<ApiResponse<Transaction>> {
    return this.post(`${this.endpoint}/detail`, { id });
  }

  async update(data: UpdateTransactionRequest): Promise<ApiResponse<Transaction>> {
    return this.post(`${this.endpoint}/update`, data);
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.post(`${this.endpoint}/soft-delete`, { id });
  }
}
