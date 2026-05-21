export const OrderStatus = {
  PENDING: 1,
  PARTIAL: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];
