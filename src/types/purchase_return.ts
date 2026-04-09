import type { Supplier } from './supplier';
import type { Product } from './product';
import type { InvoiceStatus } from './enums';

export interface PurchaseReturnDetail {
  id: number;
  purchaseReturnId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export interface PurchaseReturn {
  id: number;
  code: string;
  supplierId: number;
  totalLine: number;
  totalPrice: number;
  status: InvoiceStatus;
  returnDate: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  details?: PurchaseReturnDetail[];
}

export interface PurchaseReturnDetailPayload {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreatePurchaseReturnRequest {
  code?: string;
  supplierId: number;
  returnDate: string;
  description?: string;
  details: PurchaseReturnDetailPayload[];
}

export interface UpdatePurchaseReturnRequest extends CreatePurchaseReturnRequest {
  id: number;
}

export interface UpdatePurchaseReturnStatusRequest {
  id: number;
  status: InvoiceStatus;
}
