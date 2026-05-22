import type { PurchaseInvoice } from './purchase_invoice';
import type { Supplier } from './supplier';

export interface PurchasePaymentDetail {
  id: number;
  purchasePaymentId: number;
  paidAmount: number;
  purchaseInvoiceId: number | null;
  purchaseInvoiceDetailId: number | null;
  purchaseInvoice?: PurchaseInvoice;
}

export interface PurchasePayment {
  id: number;
  code: string;
  supplierId: number;
  totalPrice: number;
  paidAmount: number;
  paymentDate: string;
  description: string | null;
  isCancel: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  details?: PurchasePaymentDetail[];
}

export interface CreatePurchasePaymentRequest {
  code?: string;
  supplierId: number;
  paymentDate: string;
  paidAmount?: number;
  description?: string;
  details: {
    purchaseInvoiceId?: number;
    paidAmount: number;
    purchaseInvoiceDetailId?: number;
  }[];
}

export interface UpdatePurchasePaymentRequest extends CreatePurchasePaymentRequest {
  id: number;
}
