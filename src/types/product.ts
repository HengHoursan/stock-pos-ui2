import { Category } from './category';
import { Brand } from './brand';
import { Unit } from './unit';

export interface ProductDetail {
  id: number;
  productId: number;
  currentStock: number;
  stockNumber: string;
  purchasePrice: number;
  salePrice: number;
  expiryDate: string | null;
  expiryType: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  brandId: number | null;
  unitId: number;
  alertQuantity: number;
  skuCode: string;
  barcodeType: string;
  photoPath: string | null;
  status: boolean;
  forSelling: boolean;
  isManufacture: boolean;
  manageStock: boolean;
  category?: Category;
  brand?: Brand;
  unit?: Unit;
  detail?: ProductDetail;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  code?: string;
  name: string;
  categoryId: number;
  brandId?: number;
  unitId: number;
  alertQuantity?: number;
  skuCode?: string;
  barcodeType?: string;
  photoPath?: string;
  status?: boolean;
  forSelling?: boolean;
  isManufacture?: boolean;
  manageStock?: boolean;
  // Product Detail fields (sent in the same request)
  currentStock?: number;
  stockNumber?: string;
  purchasePrice?: number;
  salePrice?: number;
  expiryDate?: string;
  expiryType?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

export interface UpdateProductStatusRequest {
  id: number;
  status: boolean;
}
