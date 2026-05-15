import type { SaleInvoice } from './sale_invoice';
import type { Customer } from './customer';

export interface SalePaymentDetail {
  id: number;
  saleInvoiceId: number;
  paidAmount: number;
  saleInvoice?: SaleInvoice;
}

export interface SalePayment {
  id: number;
  code: string;
  customerId: number;
  totalPrice: number;
  paidAmount: number;
  paymentDate: string;
  description: string | null;
  isCancel: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  details?: SalePaymentDetail[];
}

export interface CreateSalePaymentRequest {
  code?: string;
  customerId: number;
  paymentDate: string;
  description?: string;
  details?: {
    saleInvoiceId: number;
    paidAmount: number;
  }[];
}

export interface UpdateSalePaymentRequest extends CreateSalePaymentRequest {
  id: number;
}
