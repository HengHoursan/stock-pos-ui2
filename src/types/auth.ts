export interface User {
  id: number;
  email: string;
  username: string;
  role: any;
  status: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  roleId: number;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  roleId: number;
  status?: boolean;
}

export interface UpdateUserRequest {
  id: number;
  username?: string;
  password?: string;
  email?: string;
  roleId?: number;
  status?: boolean;
}

export interface UpdateUserStatusRequest {
  id: number;
  status: boolean;
}
