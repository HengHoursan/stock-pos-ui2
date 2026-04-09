export const InvoiceStatus = {
  DRAFT: 1,
  CONFIRMED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];
