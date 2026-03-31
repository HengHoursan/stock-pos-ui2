export interface Category {
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

export interface CreateCategoryRequest {
  code?: string;
  parentId?: number;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  status?: boolean;
}

export interface UpdateCategoryRequest {
  id: number;
  code?: string;
  parentId?: number;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  status?: boolean;
}

export interface UpdateCategoryStatusRequest {
  id: number;
  status: boolean;
}
