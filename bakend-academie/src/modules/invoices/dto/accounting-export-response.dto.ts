export class AccountingExportRowDto {
  invoiceNumber!: string;
  status!: string;
  fiscalStatus!: string;
  currency!: string;
  subtotalHt!: string;
  taxRate!: string;
  taxAmount!: string;
  totalTtc!: string;
  issuedAt?: Date;
  paidAt?: Date;
  customerCompanyName?: string;
  customerVatNumber?: string;
  pdfSha256?: string;
}

export class AccountingExportResponseDto {
  format!: 'json' | 'csv';
  generatedAt!: string;
  periodFrom?: string;
  periodTo?: string;
  count!: number;
  rows?: AccountingExportRowDto[];
  csvContent?: string;
}
