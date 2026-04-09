import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender, UserStatus } from '../../../core/enums';
import { CalendarEventEntity } from 'src/modules/calendar/entities/calendar-event.entity';
import { CourseEntity } from 'src/modules/courses/entities/course.entity';
import { EnrollmentEntity } from 'src/modules/courses/entities/enrollment.entity';
import { GradeEntity } from 'src/modules/grades/entities/grade.entity';
import { ProblemEntity } from 'src/modules/problems/entities/problem.entity';
import { SupportTicketEntity } from 'src/modules/support/entities/support-ticket.entity';
import { StudentProgramEntity } from '../../programs/entities/student-program.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ type: 'varchar', length: 80 })
  lastName!: string;

  @Column({ type: 'varchar', length: 190, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 30, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: Gender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'jsonb', nullable: true })
  onboardingProfile?: Record<string, string>;

  @Column({ type: 'timestamptz', nullable: true })
  onboardingCompletedAt?: Date;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @ManyToMany(() => RoleEntity, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles!: RoleEntity[];

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshTokenEntity[];

  @OneToMany(() => CourseEntity, (course) => course.creator)
  createdCourses!: CourseEntity[];

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.user)
  enrollments!: EnrollmentEntity[];

  @OneToMany(() => StudentProgramEntity, (program) => program.student)
  studentPrograms!: StudentProgramEntity[];

  @OneToMany(() => StudentProgramEntity, (program) => program.teacher)
  createdStudentPrograms!: StudentProgramEntity[];

  @OneToMany(() => ProblemEntity, (problem) => problem.creator)
  createdProblems!: ProblemEntity[];

  @OneToMany(() => CalendarEventEntity, (event) => event.createdBy)
  createdCalendarEvents!: CalendarEventEntity[];

  @OneToMany(() => GradeEntity, (grade) => grade.student)
  receivedGrades!: GradeEntity[];

  @OneToMany(() => GradeEntity, (grade) => grade.gradedBy)
  givenGrades!: GradeEntity[];

  @OneToMany(() => SupportTicketEntity, (ticket) => ticket.user)
  supportTickets!: SupportTicketEntity[];

  // Other relations (Enrollment, Submission, Payment, StudentProgram, CalendarEvent,
  // EvaluationAttempt) will be mapped in their dedicated modules to keep SRP boundaries clear.

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
