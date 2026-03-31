export interface Brand {
  id: number;
  code: string;
  parentId: number | null;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandRequest {
  code?: string;
  parentId?: number;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  status?: boolean;
}

export interface UpdateBrandRequest {
  id: number;
  code?: string;
  parentId?: number;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  status?: boolean;
}

export interface UpdateBrandStatusRequest {
  id: number;
  status: boolean;
}
