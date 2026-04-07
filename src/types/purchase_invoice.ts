import type { Supplier } from './supplier';
import type { Product } from './product';
import type { InvoiceStatus, PaymentMethod } from './enums';
import type { PurchaseOrder, PurchaseOrderDetail } from './purchase_order';

export interface PurchaseInvoiceDetail {
  id: number;
  purchaseInvoiceId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  purchaseOrderId: number | null;
  purchaseOrderDetailId: number | null;
  product?: Product;
  purchaseOrder?: PurchaseOrder;
  purchaseOrderDetail?: PurchaseOrderDetail;
}

export interface PurchaseInvoice {
  id: number;
  code: string;
  supplierId: number;
  totalLine: number;
  totalPrice: number;
  paidAmount: number;
  status: InvoiceStatus;
  invoiceDate: string;
  description: string | null;
  isCancel: boolean;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  details?: PurchaseInvoiceDetail[];
}

export interface PurchaseInvoiceDetailPayload {
  productId: number;
  quantity: number;
  totalPrice?: number;
  purchaseOrderId?: number;
  purchaseOrderDetailId?: number;
}

export interface CreatePurchaseInvoiceRequest {
  code?: string;
  supplierId: number;
  invoiceDate: string;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  description?: string;
  details: PurchaseInvoiceDetailPayload[];
}

export interface UpdatePurchaseInvoiceRequest extends CreatePurchaseInvoiceRequest {
  id: number;
}

export interface UpdatePurchaseInvoiceStatusRequest {
  id: number;
  status: InvoiceStatus;
}
