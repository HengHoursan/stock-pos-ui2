export const PaymentMethod = {
  CASH: 1,
  TRANSFER: 2,
  OTHER: 3,
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];
