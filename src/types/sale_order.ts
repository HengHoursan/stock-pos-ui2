import type { Customer } from './customer';
import type { Product } from './product';
import type { OrderStatus } from './enums';
import type { PurchaseQuotation, PurchaseQuotationDetail } from './purchase_quotation';

export interface SaleOrderDetail {
  id: number;
  saleOrderId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  purchaseQuotationId: number | null;
  purchaseQuotationDetailId: number | null;
  product?: Product;
  purchaseQuotation?: PurchaseQuotation;
  purchaseQuotationDetail?: PurchaseQuotationDetail;
  saleInvoiceDetails?: any[];
}

export interface SaleOrder {
  id: number;
  code: string;
  customerId: number;
  totalLine: number;
  totalCloseLine: number;
  totalPrice: number;
  status: OrderStatus;
  orderDate: string;
  description: string | null;
  isCancel: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  details?: SaleOrderDetail[];
}

export interface SaleOrderDetailPayload {
  productId: number;
  quantity: number;
  totalPrice?: number;
  purchaseQuotationId?: number;
  purchaseQuotationDetailId?: number;
}

export interface CreateSaleOrderRequest {
  code?: string;
  customerId: number;
  orderDate: string;
  description?: string;
  details: SaleOrderDetailPayload[];
}

export interface UpdateSaleOrderRequest extends CreateSaleOrderRequest {
  id: number;
}

export interface UpdateSaleOrderStatusRequest {
  id: number;
  status: OrderStatus;
}
