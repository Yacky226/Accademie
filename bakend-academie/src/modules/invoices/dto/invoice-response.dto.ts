export class InvoiceResponseDto {
  id!: string;
  number!: string;
  amount!: string;
  subtotalHt!: string;
  vatCategory!: string;
  taxRate!: string;
  taxAmount!: string;
  totalTtc!: string;
  currency!: string;
  status!: string;
  fiscalStatus!: string;
  note?: string;
  metadata?: Record<string, unknown>;
  customerCompanyName?: string;
  customerVatNumber?: string;
  taxExemptionReason?: string;
  pdfSha256?: string;
  pdfGeneratedAt?: Date;
  issuedAt?: Date;
  dueAt?: Date;
  paidAt?: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  payment?: {
    id: string;
    reference: string;
    status: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
