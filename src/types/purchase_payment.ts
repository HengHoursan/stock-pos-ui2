import type { PurchaseInvoice } from './purchase_invoice';
import type { PaymentMethod } from './enums';

export interface PurchasePayment {
  id: number;
  code: string;
  purchaseInvoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  purchaseInvoice?: PurchaseInvoice;
}

export interface CreatePurchasePaymentRequest {
  code?: string;
  purchaseInvoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  description?: string;
}

export interface UpdatePurchasePaymentRequest extends CreatePurchasePaymentRequest {
  id: number;
}
