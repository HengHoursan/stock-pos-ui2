export const TransactionType = {
  IN: 1,
  OUT: 2,
  ADJUSTMENT: 3,
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
