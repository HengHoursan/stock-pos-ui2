export interface Discount {
  id: number;
  code: string;
  discountType: string; // 'percentage' | 'fixed'
  discountAmount: number;
  discountStartDate: string;
  discountEndDate: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountRequest {
  code?: string;
  discountType: string;
  discountAmount: number;
  discountStartDate: string;
  discountEndDate: string;
  status?: boolean;
}

export interface UpdateDiscountRequest extends Partial<CreateDiscountRequest> {
  id: number;
}

export interface UpdateDiscountStatusRequest {
  id: number;
  status: boolean;
}
