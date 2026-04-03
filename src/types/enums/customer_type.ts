export const CustomerType = {
  DINE_IN: 1,
  DINE_OUT: 2,
} as const;

export type CustomerType = typeof CustomerType[keyof typeof CustomerType];
