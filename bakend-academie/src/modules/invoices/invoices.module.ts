import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { UserEntity } from '../users/entities/user.entity';
import { InvoiceFiscalEventEntity } from './entities/invoice-fiscal-event.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './repositories/invoices.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			InvoiceEntity,
			InvoiceFiscalEventEntity,
			UserEntity,
			PaymentEntity,
		]),
	],
	controllers: [InvoicesController],
	providers: [InvoicesService, InvoicesRepository, InvoicePdfService],
	exports: [InvoicesService, InvoicesRepository, InvoicePdfService],
})
export class InvoicesModule {}

