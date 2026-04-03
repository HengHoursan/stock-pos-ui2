import { CustomerType } from './customer_type';

export interface Supplier {
  id: number;
  code: string;
  name: string;
  nameLatin: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  description: string | null;
  type: CustomerType;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  code?: string;
  name: string;
  nameLatin?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  description?: string;
  type: CustomerType;
  status?: boolean;
}

export interface UpdateSupplierRequest {
  id: number;
  code?: string;
  name?: string;
  nameLatin?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  description?: string;
  type?: CustomerType;
  status?: boolean;
}

export interface UpdateSupplierStatusRequest {
  id: number;
  status: boolean;
}
