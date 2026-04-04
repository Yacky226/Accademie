import { InvoiceFiscalEventResponseDto } from './invoice-fiscal-event-response.dto';

export class InvoiceArchiveResponseDto {
  invoiceId!: string;
  invoiceNumber!: string;
  status!: string;
  fiscalStatus!: string;
  issuedAt?: Date;
  paidAt?: Date;
  pdfSha256?: string;
  pdfGeneratedAt?: Date;
  retainedUntil!: string;
  events!: InvoiceFiscalEventResponseDto[];
}
