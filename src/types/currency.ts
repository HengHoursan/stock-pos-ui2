export interface Currency {
  id: number;
  code: string;
  country: string;
  currency: string;
  symbol: string;
  thousandSeparator: string;
  decimalSeparator: string;
  exchangeRate: number;
  isDefault: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencyRequest {
  code: string;
  country: string;
  currency: string;
  symbol?: string;
  thousandSeparator?: string;
  decimalSeparator?: string;
  exchangeRate?: number;
  isDefault?: boolean;
  status?: boolean;
}

export interface UpdateCurrencyRequest extends Partial<CreateCurrencyRequest> {
  id: number;
}

export interface UpdateCurrencyStatusRequest {
  id: number;
  status: boolean;
}
