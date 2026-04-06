import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { InvoicesModule } from '../invoices/invoices.module';
import { UserEntity } from '../users/entities/user.entity';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './repositories/payments.repository';

@Module({
  imports: [
    InvoicesModule,
    TypeOrmModule.forFeature([PaymentEntity, UserEntity, CourseEntity]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
