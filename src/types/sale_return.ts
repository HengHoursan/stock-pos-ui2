import type { Customer } from './customer';
import type { Product } from './product';
import type { InvoiceStatus } from './enums';

export interface SaleReturnDetail {
  id: number;
  saleReturnId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export interface SaleReturn {
  id: number;
  code: string;
  customerId: number;
  totalLine: number;
  totalPrice: number;
  status: InvoiceStatus;
  returnDate: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  details?: SaleReturnDetail[];
}

export interface SaleReturnDetailPayload {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateSaleReturnRequest {
  code?: string;
  customerId: number;
  returnDate: string;
  description?: string;
  details: SaleReturnDetailPayload[];
}

export interface UpdateSaleReturnRequest extends CreateSaleReturnRequest {
  id: number;
}

export interface UpdateSaleReturnStatusRequest {
  id: number;
  status: InvoiceStatus;
}
