import type { Supplier } from './supplier';
import type { Product } from './product';
import type { OrderStatus } from './enums';
import type { PurchaseQuotation, PurchaseQuotationDetail } from './purchase_quotation';

export interface PurchaseOrderDetail {
  id: number;
  purchaseOrderId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  purchaseQuotationId: number | null;
  purchaseQuotationDetailId: number | null;
  product?: Product;
  purchaseQuotation?: PurchaseQuotation;
  purchaseQuotationDetail?: PurchaseQuotationDetail;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  supplierId: number;
  totalLine: number;
  totalCloseLine: number;
  totalPrice: number;
  status: OrderStatus;
  orderDate: string;
  description: string | null;
  isCancel: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  details?: PurchaseOrderDetail[];
}

export interface PurchaseOrderDetailPayload {
  productId: number;
  quantity: number;
  totalPrice?: number;
  purchaseQuotationId?: number;
  purchaseQuotationDetailId?: number;
}

export interface CreatePurchaseOrderRequest {
  code?: string;
  supplierId: number;
  orderDate: string;
  description?: string;
  details: PurchaseOrderDetailPayload[];
}

export interface UpdatePurchaseOrderRequest extends CreatePurchaseOrderRequest {
  id: number;
}

export interface UpdatePurchaseOrderStatusRequest {
  id: number;
  status: OrderStatus;
}
