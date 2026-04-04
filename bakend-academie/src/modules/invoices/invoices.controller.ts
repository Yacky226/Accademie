import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { INVOICE_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceArchiveResponseDto } from './dto/invoice-archive-response.dto';
import { InvoiceFiscalEventResponseDto } from './dto/invoice-fiscal-event-response.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoiceTaxPreviewResponseDto } from './dto/invoice-tax-preview-response.dto';
import { PreviewInvoiceTaxDto } from './dto/preview-invoice-tax.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(INVOICE_PERMISSIONS.INVOICES_READ)
  @Get()
  async listInvoices(): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.listInvoices();
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_READ)
  @Get('me')
  async listMyInvoices(@CurrentUser('sub') userId: string): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.listMyInvoices(userId);
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_READ)
  @Get(':id')
  async getInvoiceById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.getInvoiceById(id, userId, roles ?? []);
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_ARCHIVE_READ)
  @Get(':id/fiscal-events')
  async getFiscalEvents(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<InvoiceFiscalEventResponseDto[]> {
    return this.invoicesService.getFiscalEvents(id, userId, roles ?? []);
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_ARCHIVE_READ)
  @Get(':id/archive')
  async getArchivePackage(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<InvoiceArchiveResponseDto> {
    return this.invoicesService.getArchivePackage(id, userId, roles ?? []);
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_EXPORT)
  @Get(':id/pdf')
  async exportInvoicePdf(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.invoicesService.generateInvoicePdf(id, userId, roles ?? []);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'X-Invoice-Sha256': result.sha256,
    });

    return new StreamableFile(result.file);
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_READ)
  @Post('preview-tax')
  async previewTax(@Body() dto: PreviewInvoiceTaxDto): Promise<InvoiceTaxPreviewResponseDto> {
    return this.invoicesService.previewTax(dto);
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_CREATE)
  @Post()
  async createInvoice(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.createInvoice(userId, dto);
  }

  @Permissions(INVOICE_PERMISSIONS.INVOICES_UPDATE)
  @Patch(':id')
  async updateInvoice(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.updateInvoice(id, dto, userId, roles ?? []);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(INVOICE_PERMISSIONS.INVOICES_UPDATE)
  @Patch(':id/issue')
  async issueInvoice(@Param('id') id: string): Promise<InvoiceResponseDto> {
    return this.invoicesService.issueInvoice(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(INVOICE_PERMISSIONS.INVOICES_UPDATE)
  @Patch(':id/pay')
  async markInvoicePaid(@Param('id') id: string): Promise<InvoiceResponseDto> {
    return this.invoicesService.markInvoicePaid(id);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(INVOICE_PERMISSIONS.INVOICES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteInvoice(@Param('id') id: string): Promise<void> {
    await this.invoicesService.deleteInvoice(id);
  }

  @Get('admin/accounting-export')
  @Permissions(INVOICE_PERMISSIONS.INVOICES_EXPORT_ACCOUNTING)
  async exportAccounting(
    @Query('format') format = 'json',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const normalized = format.toLowerCase();
    if (normalized !== 'json' && normalized !== 'csv') {
      throw new BadRequestException('format must be json or csv');
    }

    return this.invoicesService.exportAccounting(
      normalized as 'json' | 'csv',
      from,
      to,
    );
  }
}
