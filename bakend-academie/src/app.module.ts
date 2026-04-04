import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { PermissionsGuard } from './core/guards/permissions.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { AuditInterceptor } from './core/interceptors/audit.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { AppLoggerModule } from './core/logger/logger.module';
import { AcademyModule } from './modules/academy/academy.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { GradesModule } from './modules/grades/grades.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { JudgeModule } from './modules/judge/judge.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppLoggerModule,
    DatabaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    AcademyModule,
    CoursesModule,
    ProgramsModule,
    ProblemsModule,
    JudgeModule,
    SubmissionsModule,
    EvaluationsModule,
    GradesModule,
    CalendarModule,
    PaymentsModule,
    InvoicesModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
