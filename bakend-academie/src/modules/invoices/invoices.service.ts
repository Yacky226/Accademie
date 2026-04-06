import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, createHash } from 'crypto';
import { PaymentStatus, UserRole } from '../../core/enums';
import {
  AccountingExportResponseDto,
  AccountingExportRowDto,
} from './dto/accounting-export-response.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceArchiveResponseDto } from './dto/invoice-archive-response.dto';
import { InvoiceFiscalEventResponseDto } from './dto/invoice-fiscal-event-response.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoiceTaxPreviewResponseDto } from './dto/invoice-tax-preview-response.dto';
import { PreviewInvoiceTaxDto } from './dto/preview-invoice-tax.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceFiscalEventEntity } from './entities/invoice-fiscal-event.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesRepository } from './repositories/invoices.repository';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  async listInvoices(): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoicesRepository.findAllInvoices();
    return invoices.map((invoice) => this.toResponse(invoice));
  }

  async listMyInvoices(userId: string): Promise<InvoiceResponseDto[]> {
    const user = await this.invoicesRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invoices = await this.invoicesRepository.findInvoicesByUserId(userId);
    return invoices.map((invoice) => this.toResponse(invoice));
  }

  async getInvoiceById(
    id: string,
    userId: string,
    roles: string[],
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const isOwner = invoice.user?.id === userId;
    const canRead = this.hasElevatedRole(roles) || isOwner;
    if (!canRead) {
      throw new ForbiddenException(
        'You are not allowed to access this invoice',
      );
    }

    return this.toResponse(invoice);
  }

  async createInvoice(
    userId: string,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const user = await this.invoicesRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invoice = new InvoiceEntity();
    invoice.number = await this.generateLegalNumber();
    invoice.amount = dto.amount.toFixed(2);
    const resolvedTaxRate = this.resolveTaxRate(dto.vatCategory, dto.taxRate);
    const tax = this.computeTax(dto.amount, resolvedTaxRate);
    invoice.subtotalHt = tax.subtotalHt.toFixed(2);
    invoice.vatCategory =
      dto.vatCategory ?? this.resolveVatCategoryByRate(resolvedTaxRate);
    invoice.taxRate = tax.taxRate.toFixed(2);
    invoice.taxAmount = tax.taxAmount.toFixed(2);
    invoice.totalTtc = tax.totalTtc.toFixed(2);
    invoice.currency = (dto.currency ?? 'XOF').toUpperCase();
    invoice.status = 'DRAFT';
    invoice.fiscalStatus = 'DRAFT';
    invoice.note = dto.note;
    invoice.metadata = dto.metadata;
    invoice.dueAt = dto.dueAt ? new Date(dto.dueAt) : undefined;
    invoice.customerCompanyName = dto.customerCompanyName;
    invoice.customerVatNumber = dto.customerVatNumber;
    invoice.taxExemptionReason = dto.taxExemptionReason;
    invoice.user = user;

    if (dto.paymentId) {
      const payment = await this.invoicesRepository.findPaymentById(
        dto.paymentId,
      );
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }
      invoice.payment = payment;

      if (payment.status === PaymentStatus.PAID) {
        invoice.status = 'PAID';
        invoice.fiscalStatus = 'PAID';
        invoice.issuedAt = new Date();
        invoice.paidAt = payment.paidAt ?? new Date();
      }
    }

    const saved = await this.invoicesRepository.saveInvoice(invoice);
    await this.recordFiscalEvent(saved, 'CREATED', userId, {
      amount: saved.amount,
      vatCategory: saved.vatCategory,
      taxRate: saved.taxRate,
    });
    const hydrated = await this.invoicesRepository.findInvoiceById(saved.id);
    return this.toResponse(hydrated ?? saved);
  }

  async ensureInvoiceForPayment(
    paymentId: string,
    userId?: string,
  ): Promise<InvoiceResponseDto | null> {
    const existingInvoice =
      await this.invoicesRepository.findInvoiceByPaymentId(paymentId);
    if (existingInvoice) {
      return this.toResponse(existingInvoice);
    }

    const payment = await this.invoicesRepository.findPaymentById(paymentId);
    if (!payment || !payment.user) {
      return null;
    }

    const resolvedUserId = userId ?? payment.user.id;
    return this.createInvoice(resolvedUserId, {
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentId: payment.id,
      note: payment.description,
      metadata: payment.metadata,
      customerCompanyName: this.readStringMetadata(
        payment.metadata,
        'customerCompanyName',
      ),
      customerVatNumber: this.readStringMetadata(
        payment.metadata,
        'customerVatNumber',
      ),
      taxExemptionReason: this.readStringMetadata(
        payment.metadata,
        'taxExemptionReason',
      ),
    });
  }

  async updateInvoice(
    id: string,
    dto: UpdateInvoiceDto,
    userId: string,
    roles: string[],
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const isOwner = invoice.user?.id === userId;
    const canUpdate = this.hasElevatedRole(roles) || isOwner;
    if (!canUpdate) {
      throw new ForbiddenException(
        'You are not allowed to update this invoice',
      );
    }

    if (this.isInvoiceLocked(invoice.status)) {
      if (
        dto.amount !== undefined ||
        dto.taxRate !== undefined ||
        dto.currency !== undefined ||
        dto.customerCompanyName !== undefined ||
        dto.customerVatNumber !== undefined ||
        dto.taxExemptionReason !== undefined
      ) {
        throw new ConflictException(
          'Issued or paid invoices are immutable for financial and customer fiscal fields',
        );
      }
    }

    if (dto.amount !== undefined) {
      invoice.amount = dto.amount.toFixed(2);
    }
    const taxRate = this.resolveTaxRate(
      dto.vatCategory,
      dto.taxRate ?? Number(invoice.taxRate),
    );
    const grossAmount = dto.amount ?? Number(invoice.amount);
    const tax = this.computeTax(grossAmount, taxRate);
    invoice.subtotalHt = tax.subtotalHt.toFixed(2);
    invoice.vatCategory =
      dto.vatCategory ?? this.resolveVatCategoryByRate(taxRate);
    invoice.taxRate = tax.taxRate.toFixed(2);
    invoice.taxAmount = tax.taxAmount.toFixed(2);
    invoice.totalTtc = tax.totalTtc.toFixed(2);
    if (dto.currency !== undefined) {
      invoice.currency = dto.currency.toUpperCase();
    }
    if (dto.note !== undefined) {
      invoice.note = dto.note;
    }
    if (dto.metadata !== undefined) {
      invoice.metadata = dto.metadata;
    }
    if (dto.dueAt !== undefined) {
      invoice.dueAt = dto.dueAt ? new Date(dto.dueAt) : undefined;
    }
    if (dto.status !== undefined) {
      invoice.status = dto.status.toUpperCase();
      if (invoice.status === 'PAID' && !invoice.paidAt) {
        invoice.paidAt = new Date();
      }
    }
    if (dto.fiscalStatus !== undefined) {
      invoice.fiscalStatus = dto.fiscalStatus.toUpperCase();
    }
    if (dto.customerCompanyName !== undefined) {
      invoice.customerCompanyName = dto.customerCompanyName;
    }
    if (dto.customerVatNumber !== undefined) {
      invoice.customerVatNumber = dto.customerVatNumber;
    }
    if (dto.taxExemptionReason !== undefined) {
      invoice.taxExemptionReason = dto.taxExemptionReason;
    }

    const saved = await this.invoicesRepository.saveInvoice(invoice);
    await this.recordFiscalEvent(saved, 'UPDATED', userId, {
      status: saved.status,
      fiscalStatus: saved.fiscalStatus,
      totalTtc: saved.totalTtc,
    });
    const hydrated = await this.invoicesRepository.findInvoiceById(saved.id);
    return this.toResponse(hydrated ?? saved);
  }

  async issueInvoice(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new ConflictException('Paid invoice cannot be re-issued');
    }

    invoice.status = invoice.status === 'PAID' ? 'PAID' : 'ISSUED';
    invoice.fiscalStatus = invoice.status;
    invoice.issuedAt = new Date();

    const saved = await this.invoicesRepository.saveInvoice(invoice);
    await this.recordFiscalEvent(saved, 'ISSUED', undefined, {
      issuedAt: saved.issuedAt?.toISOString(),
      fiscalStatus: saved.fiscalStatus,
    });
    return this.toResponse(saved);
  }

  async markInvoicePaid(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'DRAFT') {
      throw new ConflictException(
        'Draft invoice must be issued before payment',
      );
    }

    invoice.status = 'PAID';
    invoice.fiscalStatus = 'PAID';
    invoice.issuedAt = invoice.issuedAt ?? new Date();
    invoice.paidAt = new Date();

    const saved = await this.invoicesRepository.saveInvoice(invoice);
    await this.recordFiscalEvent(saved, 'PAID', undefined, {
      paidAt: saved.paidAt?.toISOString(),
      amount: saved.amount,
    });
    return this.toResponse(saved);
  }

  async syncInvoiceFromPayment(paymentId: string): Promise<void> {
    const invoice =
      await this.invoicesRepository.findInvoiceByPaymentId(paymentId);
    if (!invoice) {
      return;
    }

    const payment = await this.invoicesRepository.findPaymentById(paymentId);
    if (!payment) {
      return;
    }

    let eventType = 'PAYMENT_SYNCED';

    switch (payment.status) {
      case PaymentStatus.PAID:
        invoice.status = 'PAID';
        invoice.fiscalStatus = 'PAID';
        invoice.issuedAt = invoice.issuedAt ?? payment.paidAt ?? new Date();
        invoice.paidAt = payment.paidAt ?? new Date();
        eventType = 'PAYMENT_PAID_SYNCED';
        break;
      case PaymentStatus.REFUNDED:
        invoice.status = 'REFUNDED';
        invoice.fiscalStatus = 'REFUNDED';
        eventType = 'PAYMENT_REFUNDED_SYNCED';
        break;
      case PaymentStatus.FAILED:
        if (!this.isInvoiceLocked(invoice.status)) {
          invoice.status = 'FAILED';
          invoice.fiscalStatus = 'FAILED';
        }
        eventType = 'PAYMENT_FAILED_SYNCED';
        break;
      case PaymentStatus.CANCELLED:
        if (!this.isInvoiceLocked(invoice.status)) {
          invoice.status = 'CANCELLED';
          invoice.fiscalStatus = 'CANCELLED';
        }
        eventType = 'PAYMENT_CANCELLED_SYNCED';
        break;
      case PaymentStatus.PENDING:
      default:
        if (!this.isInvoiceLocked(invoice.status)) {
          invoice.status = 'DRAFT';
          invoice.fiscalStatus = 'DRAFT';
        }
        break;
    }

    const saved = await this.invoicesRepository.saveInvoice(invoice);
    await this.recordFiscalEvent(saved, eventType, payment.user?.id, {
      paymentId: payment.id,
      paymentStatus: payment.status,
      paidAt: payment.paidAt?.toISOString(),
      refundedAt: payment.refundedAt?.toISOString(),
    });
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.recordFiscalEvent(invoice, 'DELETED', undefined, {
      deletedAt: new Date().toISOString(),
    });
    await this.invoicesRepository.softDeleteInvoice(invoice);
  }

  async generateInvoicePdf(
    id: string,
    userId: string,
    roles: string[],
  ): Promise<{ fileName: string; file: Buffer; sha256: string }> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const isOwner = invoice.user?.id === userId;
    const canRead = this.hasElevatedRole(roles) || isOwner;
    if (!canRead) {
      throw new ForbiddenException(
        'You are not allowed to export this invoice',
      );
    }

    if (invoice.status === 'DRAFT') {
      throw new ConflictException('Invoice must be issued before PDF export');
    }

    const file = await this.invoicePdfService.generateInvoicePdf(invoice);
    const sha256 = createHash('sha256').update(file).digest('hex');
    invoice.pdfSha256 = sha256;
    invoice.pdfGeneratedAt = new Date();
    await this.invoicesRepository.saveInvoice(invoice);
    await this.recordFiscalEvent(invoice, 'PDF_EXPORTED', userId, {
      sha256,
      generatedAt: invoice.pdfGeneratedAt.toISOString(),
    });

    return {
      fileName: `${invoice.number}.pdf`,
      file,
      sha256,
    };
  }

  previewTax(dto: PreviewInvoiceTaxDto): InvoiceTaxPreviewResponseDto {
    const taxRate = this.resolveTaxRate(dto.vatCategory, dto.customTaxRate);
    const tax = this.computeTax(dto.amount, taxRate);

    return {
      amount: dto.amount,
      vatCategory: dto.vatCategory ?? this.resolveVatCategoryByRate(taxRate),
      taxRate,
      subtotalHt: Number(tax.subtotalHt.toFixed(2)),
      taxAmount: Number(tax.taxAmount.toFixed(2)),
      totalTtc: Number(tax.totalTtc.toFixed(2)),
    };
  }

  async getFiscalEvents(
    id: string,
    userId: string,
    roles: string[],
  ): Promise<InvoiceFiscalEventResponseDto[]> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const isOwner = invoice.user?.id === userId;
    const canRead = this.hasElevatedRole(roles) || isOwner;
    if (!canRead) {
      throw new ForbiddenException(
        'You are not allowed to access invoice fiscal events',
      );
    }

    const events =
      await this.invoicesRepository.listFiscalEventsByInvoiceId(id);
    return events.map((event) => this.toFiscalEventResponse(event));
  }

  async getArchivePackage(
    id: string,
    userId: string,
    roles: string[],
  ): Promise<InvoiceArchiveResponseDto> {
    const invoice = await this.invoicesRepository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const isOwner = invoice.user?.id === userId;
    const canRead = this.hasElevatedRole(roles) || isOwner;
    if (!canRead) {
      throw new ForbiddenException(
        'You are not allowed to access invoice archive package',
      );
    }

    const events =
      await this.invoicesRepository.listFiscalEventsByInvoiceId(id);
    const retentionDate = new Date(invoice.createdAt);
    retentionDate.setFullYear(retentionDate.getFullYear() + 6);

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      status: invoice.status,
      fiscalStatus: invoice.fiscalStatus,
      issuedAt: invoice.issuedAt,
      paidAt: invoice.paidAt,
      pdfSha256: invoice.pdfSha256,
      pdfGeneratedAt: invoice.pdfGeneratedAt,
      retainedUntil: retentionDate.toISOString(),
      events: events.map((event) => this.toFiscalEventResponse(event)),
    };
  }

  async exportAccounting(
    format: 'json' | 'csv',
    from?: string,
    to?: string,
  ): Promise<AccountingExportResponseDto> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const invoices = await this.invoicesRepository.listInvoicesForAccounting(
      fromDate,
      toDate,
    );
    const rows = invoices.map((invoice) => this.toAccountingRow(invoice));

    if (format === 'json') {
      return {
        format,
        generatedAt: new Date().toISOString(),
        periodFrom: fromDate?.toISOString(),
        periodTo: toDate?.toISOString(),
        count: rows.length,
        rows,
      };
    }

    const header =
      'invoiceNumber,status,fiscalStatus,currency,subtotalHt,taxRate,taxAmount,totalTtc,issuedAt,paidAt,customerCompanyName,customerVatNumber,pdfSha256';
    const csvLines = rows.map((row) => {
      return [
        row.invoiceNumber,
        row.status,
        row.fiscalStatus,
        row.currency,
        row.subtotalHt,
        row.taxRate,
        row.taxAmount,
        row.totalTtc,
        row.issuedAt ? row.issuedAt.toISOString() : '',
        row.paidAt ? row.paidAt.toISOString() : '',
        row.customerCompanyName ?? '',
        row.customerVatNumber ?? '',
        row.pdfSha256 ?? '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',');
    });

    return {
      format,
      generatedAt: new Date().toISOString(),
      periodFrom: fromDate?.toISOString(),
      periodTo: toDate?.toISOString(),
      count: rows.length,
      csvContent: [header, ...csvLines].join('\n'),
    };
  }

  private async generateLegalNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}${month}-`;
    const currentCount =
      await this.invoicesRepository.countInvoicesByPrefix(prefix);
    const sequence = String(currentCount + 1).padStart(6, '0');
    return `${prefix}${sequence}`;
  }

  private hasElevatedRole(roles: string[]): boolean {
    return roles.includes(UserRole.ADMIN) || roles.includes(UserRole.TEACHER);
  }

  private toResponse(invoice: InvoiceEntity): InvoiceResponseDto {
    return {
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount,
      subtotalHt: invoice.subtotalHt,
      vatCategory: invoice.vatCategory,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      totalTtc: invoice.totalTtc,
      currency: invoice.currency,
      status: invoice.status,
      fiscalStatus: invoice.fiscalStatus,
      note: invoice.note,
      metadata: invoice.metadata,
      customerCompanyName: invoice.customerCompanyName,
      customerVatNumber: invoice.customerVatNumber,
      taxExemptionReason: invoice.taxExemptionReason,
      pdfSha256: invoice.pdfSha256,
      pdfGeneratedAt: invoice.pdfGeneratedAt,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      user: invoice.user
        ? {
            id: invoice.user.id,
            firstName: invoice.user.firstName,
            lastName: invoice.user.lastName,
            email: invoice.user.email,
          }
        : undefined,
      payment: invoice.payment
        ? {
            id: invoice.payment.id,
            reference: invoice.payment.reference,
            status: invoice.payment.status,
          }
        : undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  private computeTax(
    totalTtc: number,
    taxRate: number,
  ): {
    subtotalHt: number;
    taxRate: number;
    taxAmount: number;
    totalTtc: number;
  } {
    const normalizedRate = taxRate >= 0 ? taxRate : 0;
    const normalizedTotal = totalTtc >= 0 ? totalTtc : 0;
    const subtotalHt = normalizedTotal / (1 + normalizedRate / 100);
    const taxAmount = normalizedTotal - subtotalHt;

    return {
      subtotalHt,
      taxRate: normalizedRate,
      taxAmount,
      totalTtc: normalizedTotal,
    };
  }

  private async recordFiscalEvent(
    invoice: InvoiceEntity,
    eventType: string,
    actorUserId?: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const previousEvents =
      await this.invoicesRepository.listFiscalEventsByInvoiceId(invoice.id);
    const previousSignature = previousEvents.length
      ? previousEvents[previousEvents.length - 1].signature
      : undefined;

    const signaturePayload = JSON.stringify({
      invoiceId: invoice.id,
      eventType,
      actorUserId,
      payload: payload ?? null,
      previousSignature: previousSignature ?? null,
    });

    const signatureSecret =
      process.env.INVOICE_AUDIT_SECRET ?? 'academie-invoice-audit-secret';
    const signature = createHmac('sha256', signatureSecret)
      .update(signaturePayload)
      .digest('hex');

    const event = new InvoiceFiscalEventEntity();
    event.invoice = invoice;
    event.eventType = eventType;
    event.actorUserId = actorUserId;
    event.payload = payload;
    event.previousSignature = previousSignature;
    event.signature = signature;
    await this.invoicesRepository.saveFiscalEvent(event);
  }

  private toFiscalEventResponse(
    event: InvoiceFiscalEventEntity,
  ): InvoiceFiscalEventResponseDto {
    return {
      id: event.id,
      eventType: event.eventType,
      actorUserId: event.actorUserId,
      payload: event.payload,
      signature: event.signature,
      previousSignature: event.previousSignature,
      createdAt: event.createdAt,
    };
  }

  private isInvoiceLocked(status: string): boolean {
    const normalized = status.toUpperCase();
    return normalized === 'ISSUED' || normalized === 'PAID';
  }

  private toAccountingRow(invoice: InvoiceEntity): AccountingExportRowDto {
    return {
      invoiceNumber: invoice.number,
      status: invoice.status,
      fiscalStatus: invoice.fiscalStatus,
      currency: invoice.currency,
      subtotalHt: invoice.subtotalHt,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      totalTtc: invoice.totalTtc,
      issuedAt: invoice.issuedAt,
      paidAt: invoice.paidAt,
      customerCompanyName: invoice.customerCompanyName,
      customerVatNumber: invoice.customerVatNumber,
      pdfSha256: invoice.pdfSha256,
    };
  }

  private resolveTaxRate(vatCategory?: string, customTaxRate?: number): number {
    if (customTaxRate !== undefined) {
      return customTaxRate;
    }

    switch ((vatCategory ?? 'STANDARD_20').toUpperCase()) {
      case 'EXEMPT':
        return 0;
      case 'REDUCED_55':
        return 5.5;
      case 'REDUCED_10':
        return 10;
      case 'STANDARD_20':
      default:
        return 20;
    }
  }

  private resolveVatCategoryByRate(rate: number): string {
    if (rate === 0) {
      return 'EXEMPT';
    }
    if (rate === 5.5) {
      return 'REDUCED_55';
    }
    if (rate === 10) {
      return 'REDUCED_10';
    }
    return 'STANDARD_20';
  }

  private readStringMetadata(
    metadata: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = metadata?.[key];
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : undefined;
  }
}
