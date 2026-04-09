export const QuotationStatus = {
  DRAFT: 1,
  SENT: 2,
  ACCEPTED: 3,
  REJECTED: 4,
  EXPIRED: 5,
} as const;

export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];
