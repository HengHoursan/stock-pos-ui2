import type { SaleInvoice } from './sale_invoice';
import type { PaymentMethod } from './enums';

export interface SalePayment {
  id: number;
  code: string;
  saleInvoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  saleInvoice?: SaleInvoice;
}

export interface CreateSalePaymentRequest {
  code?: string;
  saleInvoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  description?: string;
}

export interface UpdateSalePaymentRequest extends CreateSalePaymentRequest {
  id: number;
}
