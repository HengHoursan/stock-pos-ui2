import type { AxiosInstance, AxiosResponse } from "axios";
import apiClient from "@/api/apiClient";

export abstract class BaseService {
  protected api: AxiosInstance = apiClient;

  protected async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }
}
