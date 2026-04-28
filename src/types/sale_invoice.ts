import type { Customer } from './customer';
import type { Product } from './product';
import type { InvoiceStatus, PaymentMethod } from './enums';
import type { SaleOrder, SaleOrderDetail } from './sale_order';

export interface LowStockWarning {
  productId: number;
  productCode: string;
  productName: string;
  afterStock: number;
  alertQuantity: number;
}


export interface SaleInvoiceDetail {
  id: number;
  saleInvoiceId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  saleOrderId: number | null;
  saleOrderDetailId: number | null;
  product?: Product;
  saleOrder?: SaleOrder;
  saleOrderDetail?: SaleOrderDetail;
}

export interface SaleInvoice {
  id: number;
  code: string;
  customerId: number;
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
  customer?: Customer;
  details?: SaleInvoiceDetail[];
}

export interface SaleInvoiceDetailPayload {
  productId: number;
  quantity: number;
  totalPrice?: number;
  saleOrderId?: number;
  saleOrderDetailId?: number;
}

export interface CreateSaleInvoiceRequest {
  code?: string;
  customerId: number;
  invoiceDate: string;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  description?: string;
  details: SaleInvoiceDetailPayload[];
}

export interface UpdateSaleInvoiceRequest extends CreateSaleInvoiceRequest {
  id: number;
}

export interface UpdateSaleInvoiceStatusRequest {
  id: number;
  status: InvoiceStatus;
}
