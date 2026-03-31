export interface Unit {
  id: number;
  code: string;
  parentId: number | null;
  name: string;
  slug: string;
  symbol: string;
  conversionFactor: number;
  defaultPrice: number;
  isCalculateDetail: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitRequest {
  code?: string;
  parentId?: number;
  name: string;
  slug?: string;
  symbol?: string;
  conversionFactor?: number;
  defaultPrice?: number;
  isCalculateDetail?: boolean;
  status?: boolean;
}

export interface UpdateUnitRequest {
  id: number;
  code?: string;
  parentId?: number;
  name?: string;
  slug?: string;
  symbol?: string;
  conversionFactor?: number;
  defaultPrice?: number;
  isCalculateDetail?: boolean;
  status?: boolean;
}

export interface UpdateUnitStatusRequest {
  id: number;
  status: boolean;
}
