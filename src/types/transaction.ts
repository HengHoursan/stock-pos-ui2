import type { Product } from './product';
import { TransactionType } from './enums/transaction_type';

export interface Transaction {
  id: number;
  transactionCode: string;
  transactionDate: string;
  transactionType: TransactionType;
  productId: number;
  beginningStock: number;
  quantity: number;
  afterStock: number;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface CreateTransactionRequest {
  transactionCode?: string;
  transactionDate: string;
  transactionType: TransactionType;
  productId: number;
  quantity: number;
  remarks?: string;
}

export interface UpdateTransactionRequest {
  id: number;
  transactionDate?: string;
  transactionType?: TransactionType;
  remarks?: string;
}
