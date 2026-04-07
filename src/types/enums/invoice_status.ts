export const InvoiceStatus = {
  DRAFT: 1,
  COMPLETED: 2,
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];
