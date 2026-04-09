import type { Customer } from './customer';
import type { Product } from './product';
import type { QuotationStatus } from './enums';

export interface SaleQuotationDetail {
  id: number;
  saleQuotationId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  product?: Product;
}

export interface SaleQuotation {
  id: number;
  code: string;
  customerId: number;
  totalLine: number;
  totalPrice: number;
  quotationDate: string;
  status: QuotationStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  details?: SaleQuotationDetail[];
}

export interface SaleQuotationDetailPayload {
  productId: number;
  quantity: number;
  totalPrice?: number;
}

export interface CreateSaleQuotationRequest {
  code?: string;
  customerId: number;
  quotationDate: string;
  description?: string;
  details: SaleQuotationDetailPayload[];
}

export interface UpdateSaleQuotationRequest extends CreateSaleQuotationRequest {
  id: number;
}
