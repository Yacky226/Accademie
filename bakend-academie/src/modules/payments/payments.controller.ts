import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  RawBody,
} from '@nestjs/common';
import { PAYMENT_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ProviderWebhookDto } from './dto/provider-webhook.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_READ)
  @Get()
  async listPayments(): Promise<PaymentResponseDto[]> {
    return this.paymentsService.listPayments();
  }

  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_READ)
  @Get('me')
  async listMyPayments(@CurrentUser('sub') userId: string): Promise<PaymentResponseDto[]> {
    return this.paymentsService.listMyPayments(userId);
  }

  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_READ)
  @Get(':id')
  async getPaymentById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPaymentById(id, userId, roles ?? []);
  }

  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_CREATE)
  @Post()
  async createPayment(
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createPayment(userId, dto, roles ?? []);
  }

  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_CREATE)
  @Post('subscriptions')
  async createSubscriptionPayment(
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: CreateSubscriptionPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createSubscriptionPayment(userId, dto, roles ?? []);
  }

  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_UPDATE)
  @Patch(':id')
  async updatePayment(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.updatePayment(id, dto, userId, roles ?? []);
  }

  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_REFUND)
  @Patch(':id/refund')
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: RefundPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.refundPayment(id, dto, userId, roles ?? []);
  }

  @Public()
  @Post('webhooks/provider')
  async processProviderWebhook(
    @Body() dto: ProviderWebhookDto,
    @Headers('x-webhook-signature') signatureHeader?: string,
    @Headers('x-webhook-timestamp') timestampHeader?: string,
    @Headers('stripe-signature') stripeSignatureHeader?: string,
    @RawBody() rawBody?: Buffer,
  ): Promise<{ processed: boolean }> {
    return this.paymentsService.processProviderWebhook(
      dto,
      signatureHeader,
      timestampHeader,
      stripeSignatureHeader,
      rawBody,
    );
  }

  @Roles(UserRole.ADMIN)
  @Permissions(PAYMENT_PERMISSIONS.PAYMENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deletePayment(@Param('id') id: string): Promise<void> {
    await this.paymentsService.deletePayment(id);
  }
}
