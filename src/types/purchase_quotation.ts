import type { Product } from './product';

export interface PurchaseQuotationDetail {
  id: number;
  purchaseQuotationId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  product?: Product;
}

export interface PurchaseQuotation {
  id: number;
  code: string;
  quotationDate: string;
  totalLine: number;
  totalPrice: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  details?: PurchaseQuotationDetail[];
}

export interface PurchaseQuotationDetailPayload {
  productId: number;
  quantity: number;
  totalPrice?: number;
}

export interface CreatePurchaseQuotationRequest {
  code?: string;
  quotationDate: string;
  description?: string;
  details: PurchaseQuotationDetailPayload[];
}

export interface UpdatePurchaseQuotationRequest extends CreatePurchaseQuotationRequest {
  id: number;
}
