import 'reflect-metadata';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import {
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
  EvaluationType,
  NotificationChannel,
  PaymentStatus,
  ProblemDifficulty,
  ProblemStatus,
  ProgramStatus,
  ProgramStepStatus,
  UserRole,
  UserStatus,
} from '../core/enums';
import { AcademyAnnouncementEntity } from '../modules/academy/entities/academy-announcement.entity';
import { AcademySettingEntity } from '../modules/academy/entities/academy-setting.entity';
import { AuditLogEntity } from '../modules/audit/entities/audit-log.entity';
import { CalendarEventAttendeeEntity } from '../modules/calendar/entities/calendar-event-attendee.entity';
import { CalendarEventEntity } from '../modules/calendar/entities/calendar-event.entity';
import { ContactRequestEntity } from '../modules/contact/entities/contact-request.entity';
import { CourseModuleEntity } from '../modules/courses/entities/course-module.entity';
import { CourseEntity } from '../modules/courses/entities/course.entity';
import { EnrollmentEntity } from '../modules/courses/entities/enrollment.entity';
import { LessonEntity } from '../modules/courses/entities/lesson.entity';
import { EvaluationAttemptEntity } from '../modules/evaluations/entities/evaluation-attempt.entity';
import { EvaluationQuestionEntity } from '../modules/evaluations/entities/evaluation-question.entity';
import { EvaluationEntity } from '../modules/evaluations/entities/evaluation.entity';
import { GradeEntity } from '../modules/grades/entities/grade.entity';
import { InvoiceEntity } from '../modules/invoices/entities/invoice.entity';
import { NotificationEntity } from '../modules/notifications/entities/notification.entity';
import { PaymentEntity } from '../modules/payments/entities/payment.entity';
import { ProblemTagEntity } from '../modules/problems/entities/problem-tag.entity';
import { ProblemTestCaseEntity } from '../modules/problems/entities/problem-testcase.entity';
import { ProblemEntity } from '../modules/problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../modules/problems/entities/supported-language.entity';
import { ProgramStepEntity } from '../modules/programs/entities/program-step.entity';
import { StudentProgramEntity } from '../modules/programs/entities/student-program.entity';
import { SupportTicketEntity } from '../modules/support/entities/support-ticket.entity';
import { RefreshTokenEntity } from '../modules/users/entities/refresh-token.entity';
import { RoleEntity } from '../modules/users/entities/role.entity';
import { UserEntity } from '../modules/users/entities/user.entity';

loadEnv({ path: resolve(process.cwd(), '.env') });

const DEMO_PASSWORD = 'Academie123!';
const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = 'sha256';

type DemoUserKey =
  | 'admin'
  | 'teacher'
  | 'studentBackend'
  | 'studentCheckout'
  | 'studentFrontend'
  | 'pendingStudent'
  | 'suspendedStudent';

type DemoUsers = Record<DemoUserKey, UserEntity>;
type DemoCourses = Record<
  'nodeApi' | 'reactUi' | 'systemsDesign' | 'reliabilityLab',
  CourseEntity
>;
type DemoEvaluations = Record<
  'nodeQuiz' | 'reactPractice' | 'systemsDraft',
  EvaluationEntity
>;
type DemoPayments = Record<
  | 'courseOrder'
  | 'proSubscription'
  | 'teamSubscriptionPending'
  | 'refundedReactOrder'
  | 'failedOrder',
  PaymentEntity
>;

function requireEnvironmentValue(name: string) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function hashPassword(value: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = pbkdf2Sync(
    value,
    salt,
    PASSWORD_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST,
  ).toString('hex');

  return [
    salt,
    PASSWORD_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST,
    derived,
  ].join(':');
}

function decimal(value: number) {
  return value.toFixed(2);
}

async function runSerial<T>(operations: Array<() => Promise<T>>) {
  const results: T[] = [];

  for (const operation of operations) {
    results.push(await operation());
  }

  return results;
}

function daysFromNow(value: number) {
  const date = new Date();
  date.setTime(date.getTime() + value * 24 * 60 * 60 * 1000);
  return date;
}

function hoursFromNow(value: number) {
  const date = new Date();
  date.setTime(date.getTime() + value * 60 * 60 * 1000);
  return date;
}

async function findOneIncludingSoftDeleted<T extends { id: string }>(
  repository: Repository<T>,
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
) {
  const entity = await repository.findOne({
    where,
    withDeleted: Boolean(repository.metadata.deleteDateColumn),
  });

  if (entity && repository.metadata.deleteDateColumn) {
    const deleteDateProperty = repository.metadata.deleteDateColumn.propertyName;
    const deletedAt = (entity as Record<string, unknown>)[deleteDateProperty];
    if (deletedAt) {
      await repository.restore(entity.id);
      return repository.findOne({ where });
    }
  }

  return entity;
}

async function ensureEntity<T extends { id: string }>(
  repository: Repository<T>,
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  assign: (entity: T) => void,
) {
  const existing = await findOneIncludingSoftDeleted(repository, where);
  const entity = existing ?? repository.create();

  assign(entity);
  return repository.save(entity);
}

async function createDataSource() {
  const shouldSynchronizeSchema =
    process.env.NODE_ENV?.toLowerCase() !== 'production' &&
    process.env.SEED_SYNC_SCHEMA === 'true';

  const dataSource = new DataSource({
    type: 'postgres',
    host: requireEnvironmentValue('DB_HOST'),
    port: Number.parseInt(requireEnvironmentValue('DB_PORT'), 10),
    username: requireEnvironmentValue('DB_USERNAME'),
    password: requireEnvironmentValue('DB_PASSWORD'),
    database: requireEnvironmentValue('DB_NAME'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: shouldSynchronizeSchema,
    logging: false,
    entities: [
      AcademyAnnouncementEntity,
      AcademySettingEntity,
      AuditLogEntity,
      CalendarEventAttendeeEntity,
      CalendarEventEntity,
      ContactRequestEntity,
      CourseEntity,
      CourseModuleEntity,
      EnrollmentEntity,
      EvaluationAttemptEntity,
      EvaluationEntity,
      EvaluationQuestionEntity,
      GradeEntity,
      InvoiceEntity,
      LessonEntity,
      NotificationEntity,
      PaymentEntity,
      ProblemEntity,
      ProblemTagEntity,
      ProblemTestCaseEntity,
      ProgramStepEntity,
      RefreshTokenEntity,
      RoleEntity,
      StudentProgramEntity,
      SupportedLanguageEntity,
      SupportTicketEntity,
      UserEntity,
    ],
  });

  return dataSource.initialize();
}

async function seedRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(RoleEntity);
  const roleSpecs = [
    {
      name: UserRole.ADMIN,
      description: 'Full platform access for governance, support and analytics.',
    },
    {
      name: UserRole.TEACHER,
      description: 'Can manage courses, live sessions, evaluations and mentoring.',
    },
    {
      name: UserRole.STUDENT,
      description: 'Can access learning spaces, evaluations and support routes.',
    },
  ] as const;

  const roles = await runSerial(
    roleSpecs.map((roleSpec) => () =>
      ensureEntity(roleRepository, { name: roleSpec.name }, (role) => {
        role.name = roleSpec.name;
        role.description = roleSpec.description;
      }),
    ),
  );

  return new Map(roles.map((role) => [role.name, role]));
}

async function seedUsers(dataSource: DataSource, roleMap: Map<string, RoleEntity>) {
  const userRepository = dataSource.getRepository(UserEntity);

  async function ensureUser(input: {
    key: DemoUserKey;
    email: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
    roles: UserRole[];
    bio: string;
    country: string;
    city: string;
    phone: string;
    emailVerified: boolean;
    onboardingProfile?: Record<string, string>;
    onboardingCompletedAt?: Date;
  }) {
    const user = await ensureEntity(userRepository, { email: input.email }, (entity) => {
      entity.firstName = input.firstName;
      entity.lastName = input.lastName;
      entity.email = input.email;
      entity.phone = input.phone;
      entity.passwordHash = hashPassword(DEMO_PASSWORD);
      entity.avatarUrl = undefined;
      entity.bio = input.bio;
      entity.status = input.status;
      entity.country = input.country;
      entity.city = input.city;
      entity.emailVerified = input.emailVerified;
      entity.onboardingProfile = input.onboardingProfile;
      entity.onboardingCompletedAt = input.onboardingCompletedAt;
      entity.lastLoginAt = new Date();
      entity.roles = input.roles.map((roleName) => {
        const role = roleMap.get(roleName);
        if (!role) {
          throw new Error(`Role ${roleName} is missing from the seed map.`);
        }

        return role;
      });
    });

    return [input.key, user] as const;
  }

  const userEntries = await runSerial([
    () => ensureUser({
      key: 'admin',
      email: 'admin@academie.local',
      firstName: 'Amina',
      lastName: 'Diallo',
      status: UserStatus.ACTIVE,
      roles: [UserRole.ADMIN],
      bio: 'Admin demo account used for overview, support and payment validation.',
      country: 'Morocco',
      city: 'Casablanca',
      phone: '+212600000001',
      emailVerified: true,
    }),
    () => ensureUser({
      key: 'teacher',
      email: 'teacher@academie.local',
      firstName: 'Karim',
      lastName: 'Benali',
      status: UserStatus.ACTIVE,
      roles: [UserRole.TEACHER],
      bio: 'Teacher demo account responsible for backend, system design and mentoring.',
      country: 'Morocco',
      city: 'Rabat',
      phone: '+212600000002',
      emailVerified: true,
      onboardingProfile: {
        currentRole: 'Lead backend engineer',
        dailyCodingTime: '4 hours',
        mentorInteractionMode: 'Weekly strategic review',
        preferredCohortPace: 'Cohort live',
        primaryGoal: 'Coach advanced engineers toward architecture ownership',
        primaryLanguage: 'TypeScript',
        targetStack: 'Node.js PostgreSQL distributed systems',
        timezone: 'Africa/Casablanca',
        weeklyCommitment: '10 hours',
        yearsOfExperience: '8 years',
      },
      onboardingCompletedAt: new Date(),
    }),
    () => ensureUser({
      key: 'studentBackend',
      email: 'student.backend@academie.local',
      firstName: 'Yasmine',
      lastName: 'Traore',
      status: UserStatus.ACTIVE,
      roles: [UserRole.STUDENT],
      bio: 'Student demo account focused on backend engineering and cloud architecture.',
      country: 'Morocco',
      city: 'Marrakesh',
      phone: '+212600000003',
      emailVerified: true,
      onboardingProfile: {
        currentRole: 'Backend engineer',
        dailyCodingTime: '3 hours',
        mentorInteractionMode: 'Code review and roadmap sessions',
        preferredCohortPace: 'Fast cohort',
        primaryGoal: 'Become a cloud backend architect',
        primaryLanguage: 'TypeScript',
        targetStack: 'Node.js PostgreSQL distributed systems',
        timezone: 'Africa/Casablanca',
        weeklyCommitment: '8 hours',
        yearsOfExperience: '3 years',
      },
      onboardingCompletedAt: new Date(),
    }),
    () => ensureUser({
      key: 'studentCheckout',
      email: 'student.checkout@academie.local',
      firstName: 'Nadia',
      lastName: 'El Mansouri',
      status: UserStatus.ACTIVE,
      roles: [UserRole.STUDENT],
      bio: 'Clean checkout demo account used to validate fresh purchases from the public catalog.',
      country: 'Morocco',
      city: 'Tangier',
      phone: '+212600000004',
      emailVerified: true,
      onboardingProfile: {
        currentRole: 'Frontend developer',
        dailyCodingTime: '2 hours',
        mentorInteractionMode: 'Async feedback',
        preferredCohortPace: 'Balanced cohort',
        primaryGoal: 'Ship stronger product interfaces and architecture reviews',
        primaryLanguage: 'TypeScript',
        targetStack: 'React Next.js product systems',
        timezone: 'Africa/Casablanca',
        weeklyCommitment: '6 hours',
        yearsOfExperience: '2 years',
      },
      onboardingCompletedAt: new Date(),
    }),
    () => ensureUser({
      key: 'studentFrontend',
      email: 'student.frontend@academie.local',
      firstName: 'Nora',
      lastName: 'Mansouri',
      status: UserStatus.ACTIVE,
      roles: [UserRole.STUDENT],
      bio: 'Student demo account focused on React, UX quality and delivery pace.',
      country: 'Morocco',
      city: 'Tangier',
      phone: '+212600000007',
      emailVerified: true,
      onboardingProfile: {
        currentRole: 'Frontend product engineer',
        dailyCodingTime: '2 hours',
        mentorInteractionMode: 'Weekly product critique',
        preferredCohortPace: 'Balanced cohort',
        primaryGoal: 'Ship polished React interfaces with strong design systems',
        primaryLanguage: 'TypeScript',
        targetStack: 'React TypeScript design systems',
        timezone: 'Africa/Casablanca',
        weeklyCommitment: '6 hours',
        yearsOfExperience: '2 years',
      },
      onboardingCompletedAt: new Date(),
    }),
    () => ensureUser({
      key: 'pendingStudent',
      email: 'student.pending@academie.local',
      firstName: 'Samir',
      lastName: 'Alaoui',
      status: UserStatus.PENDING,
      roles: [UserRole.STUDENT],
      bio: 'Pending review account kept for admin moderation checks.',
      country: 'Morocco',
      city: 'Agadir',
      phone: '+212600000005',
      emailVerified: false,
    }),
    () => ensureUser({
      key: 'suspendedStudent',
      email: 'student.suspended@academie.local',
      firstName: 'Leila',
      lastName: 'Hafidi',
      status: UserStatus.SUSPENDED,
      roles: [UserRole.STUDENT],
      bio: 'Suspended demo account used to populate admin moderation statistics.',
      country: 'Morocco',
      city: 'Fez',
      phone: '+212600000006',
      emailVerified: true,
    }),
  ]);

  return Object.fromEntries(userEntries) as DemoUsers;
}

async function seedAcademySettings(dataSource: DataSource) {
  const repository = dataSource.getRepository(AcademySettingEntity);

  await runSerial([
    () => ensureEntity(repository, { key: 'platform.supportEmail' }, (setting) => {
      setting.key = 'platform.supportEmail';
      setting.value = 'support@academie.local';
      setting.description = 'Support email exposed across contact and admin interfaces.';
      setting.isPublic = true;
    }),
    () => ensureEntity(repository, { key: 'platform.defaultTimezone' }, (setting) => {
      setting.key = 'platform.defaultTimezone';
      setting.value = 'Africa/Casablanca';
      setting.description = 'Default timezone used in scheduling and onboarding.';
      setting.isPublic = true;
    }),
    () => ensureEntity(repository, { key: 'platform.liveClassProvider' }, (setting) => {
      setting.key = 'platform.liveClassProvider';
      setting.value = 'Google Meet';
      setting.description = 'Live session provider used for demo calendar events.';
      setting.isPublic = false;
    }),
  ]);
}

async function seedAcademyAnnouncements(dataSource: DataSource, users: DemoUsers) {
  const repository = dataSource.getRepository(AcademyAnnouncementEntity);

  await runSerial([
    () => ensureEntity(repository, { title: 'April cohort kick-off' }, (announcement) => {
      announcement.title = 'April cohort kick-off';
      announcement.content =
        'The April cohort is open with new backend, frontend and systems design tracks.';
      announcement.isPublished = true;
      announcement.publishedAt = daysFromNow(-3);
      announcement.createdBy = users.admin;
    }),
    () => ensureEntity(repository, { title: 'Mentor office hours refresh' }, (announcement) => {
      announcement.title = 'Mentor office hours refresh';
      announcement.content =
        'Draft update for extended mentor office hours and deeper review loops.';
      announcement.isPublished = false;
      announcement.publishedAt = undefined;
      announcement.createdBy = users.admin;
    }),
  ]);
}

async function seedCourses(dataSource: DataSource, users: DemoUsers) {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const moduleRepository = dataSource.getRepository(CourseModuleEntity);
  const lessonRepository = dataSource.getRepository(LessonEntity);

  async function ensureCourse(input: {
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    thumbnailUrl?: string;
    price: number;
    currency?: string;
    level: CourseLevel;
    status: CourseStatus;
    isPublished: boolean;
    durationInHours: number;
    certificateEnabled?: boolean;
  }) {
    return ensureEntity(courseRepository, { slug: input.slug }, (course) => {
      course.title = input.title;
      course.slug = input.slug;
      course.shortDescription = input.shortDescription;
      course.description = input.description;
      course.thumbnailUrl = input.thumbnailUrl;
      course.price = decimal(input.price);
      course.currency = input.currency ?? 'MAD';
      course.level = input.level;
      course.status = input.status;
      course.isPublished = input.isPublished;
      course.durationInHours = input.durationInHours;
      course.certificateEnabled = input.certificateEnabled ?? true;
      course.creator = users.teacher;
    });
  }

  async function ensureModule(
    course: CourseEntity,
    input: {
      title: string;
      description: string;
      position: number;
      isPublished: boolean;
    },
  ) {
    return ensureEntity(
      moduleRepository,
      {
        course: { id: course.id } as CourseEntity,
        position: input.position,
      } as FindOptionsWhere<CourseModuleEntity>,
      (courseModule) => {
        courseModule.title = input.title;
        courseModule.description = input.description;
        courseModule.position = input.position;
        courseModule.isPublished = input.isPublished;
        courseModule.course = course;
      },
    );
  }

  async function ensureLesson(
    courseModule: CourseModuleEntity,
    input: {
      slug: string;
      title: string;
      content: string;
      videoUrl?: string;
      resourceUrl?: string;
      durationInMinutes: number;
      position: number;
      isFreePreview?: boolean;
      isPublished: boolean;
    },
  ) {
    return ensureEntity(lessonRepository, { slug: input.slug }, (lesson) => {
      lesson.title = input.title;
      lesson.slug = input.slug;
      lesson.content = input.content;
      lesson.videoUrl = input.videoUrl;
      lesson.resourceUrl = input.resourceUrl;
      lesson.durationInMinutes = input.durationInMinutes;
      lesson.position = input.position;
      lesson.isFreePreview = input.isFreePreview ?? false;
      lesson.isPublished = input.isPublished;
      lesson.courseModule = courseModule;
    });
  }

  const courses = {
    nodeApi: await ensureCourse({
      slug: 'node-api-foundations',
      title: 'Node API Foundations',
      shortDescription: 'Build clean REST APIs with NestJS, Postgres and pragmatic architecture.',
      description:
        'A guided backend formation covering module design, authentication, database modeling and production-ready API patterns.',
      thumbnailUrl: '/uploads/course-thumbnails/node-api-foundations.svg',
      price: 249,
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      isPublished: true,
      durationInHours: 18,
    }),
    reactUi: await ensureCourse({
      slug: 'react-interface-engineering',
      title: 'React Interface Engineering',
      shortDescription: 'Ship responsive, polished interfaces with React, TypeScript and UX rigor.',
      description:
        'A product-focused track covering layout systems, form architecture, state flows and design-system discipline.',
      thumbnailUrl: '/uploads/course-thumbnails/react-interface-engineering.svg',
      price: 279,
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      isPublished: true,
      durationInHours: 16,
    }),
    systemsDesign: await ensureCourse({
      slug: 'distributed-systems-architecture',
      title: 'Distributed Systems Architecture',
      shortDescription: 'Design resilient services, event-driven boundaries and scaling strategies.',
      description:
        'An advanced program focused on service decomposition, messaging, observability and architecture trade-offs.',
      thumbnailUrl: '/uploads/course-thumbnails/distributed-systems-architecture.svg',
      price: 399,
      level: CourseLevel.ADVANCED,
      status: CourseStatus.PUBLISHED,
      isPublished: true,
      durationInHours: 24,
    }),
    reliabilityLab: await ensureCourse({
      slug: 'platform-reliability-lab',
      title: 'Platform Reliability Lab',
      shortDescription: 'Draft teacher course for reliability drills, incident reviews and SRE practice.',
      description:
        'A draft sandbox course used to validate teacher creation flows before publication.',
      thumbnailUrl: '/uploads/course-thumbnails/platform-reliability-lab.svg',
      price: 199,
      level: CourseLevel.ADVANCED,
      status: CourseStatus.DRAFT,
      isPublished: false,
      durationInHours: 10,
      certificateEnabled: false,
    }),
  } satisfies DemoCourses;

  const nodeCoreModule = await ensureModule(courses.nodeApi, {
    title: 'Core HTTP architecture',
    description: 'Controllers, DTOs, validation and routing boundaries.',
    position: 1,
    isPublished: true,
  });
  await ensureLesson(nodeCoreModule, {
    slug: 'node-api-http-overview',
    title: 'HTTP surface and request flow',
    content:
      'Trace a request from controller to service, validation and persistence boundaries.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    durationInMinutes: 19,
    position: 1,
    isFreePreview: true,
    isPublished: true,
  });
  await ensureLesson(nodeCoreModule, {
    slug: 'node-api-auth-guards',
    title: 'Auth guards and permission layers',
    content:
      'Implement JWT guards, permissions and role-aware route protection with clean service boundaries.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationInMinutes: 24,
    position: 2,
    isPublished: true,
  });

  const nodeDataModule = await ensureModule(courses.nodeApi, {
    title: 'Persistence and production data',
    description: 'TypeORM entities, repositories and clean migration-friendly models.',
    position: 2,
    isPublished: true,
  });
  await ensureLesson(nodeDataModule, {
    slug: 'node-api-postgres-modeling',
    title: 'Postgres schema modeling',
    content:
      'Structure entities, relations and indexes so the data model supports both admin and student use cases.',
    resourceUrl: 'https://www.rfc-editor.org/rfc/rfc9110.pdf',
    durationInMinutes: 21,
    position: 1,
    isPublished: true,
  });

  const reactDesignModule = await ensureModule(courses.reactUi, {
    title: 'Responsive interface systems',
    description: 'Build resilient layouts, cards, forms and mobile adaptations.',
    position: 1,
    isPublished: true,
  });
  await ensureLesson(reactDesignModule, {
    slug: 'react-layout-systems',
    title: 'Layout systems that survive real content',
    content:
      'Design adaptive sections, dense tables and detail pages without collapsing the visual hierarchy.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationInMinutes: 18,
    position: 1,
    isFreePreview: true,
    isPublished: true,
  });
  await ensureLesson(reactDesignModule, {
    slug: 'react-form-architecture',
    title: 'Form architecture and API feedback',
    content:
      'Design forms that synchronize server responses, validation and optimistic UX states.',
    durationInMinutes: 22,
    position: 2,
    isPublished: true,
  });

  const reactScaleModule = await ensureModule(courses.reactUi, {
    title: 'Design systems and product polish',
    description: 'Tokens, reusable blocks and consistency under product pressure.',
    position: 2,
    isPublished: true,
  });
  await ensureLesson(reactScaleModule, {
    slug: 'react-design-system-polish',
    title: 'Design-system polish under constraints',
    content:
      'Use component composition and CSS structure to keep product surfaces coherent as features expand.',
    durationInMinutes: 20,
    position: 1,
    isPublished: true,
  });

  const systemsFundamentalsModule = await ensureModule(courses.systemsDesign, {
    title: 'Boundaries, services and events',
    description: 'Model service ownership, event flows and consistency boundaries.',
    position: 1,
    isPublished: true,
  });
  await ensureLesson(systemsFundamentalsModule, {
    slug: 'systems-service-boundaries',
    title: 'Service boundaries and ownership',
    content:
      'Break a platform into service boundaries using ownership, domain flows and operational reality.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationInMinutes: 28,
    position: 1,
    isPublished: true,
  });
  await ensureLesson(systemsFundamentalsModule, {
    slug: 'systems-async-messaging',
    title: 'Async messaging and event contracts',
    content:
      'Choose messaging patterns, event contracts and failure handling strategies for resilient systems.',
    durationInMinutes: 26,
    position: 2,
    isPublished: true,
  });

  const systemsOpsModule = await ensureModule(courses.systemsDesign, {
    title: 'Observability and resilience',
    description: 'Operational readiness, telemetry and incident-informed architecture.',
    position: 2,
    isPublished: true,
  });
  await ensureLesson(systemsOpsModule, {
    slug: 'systems-observability-playbook',
    title: 'Observability playbook',
    content:
      'Turn logs, traces and metrics into architectural feedback loops for high-scale services.',
    durationInMinutes: 25,
    position: 1,
    isPublished: true,
  });

  await ensureModule(courses.reliabilityLab, {
    title: 'Incident drills draft',
    description: 'Draft module used to test teacher authoring workflows.',
    position: 1,
    isPublished: false,
  });

  return courses;
}

async function seedEnrollments(
  dataSource: DataSource,
  users: DemoUsers,
  courses: DemoCourses,
) {
  const repository = dataSource.getRepository(EnrollmentEntity);

  async function ensureEnrollment(input: {
    user: UserEntity;
    course: CourseEntity;
    status: EnrollmentStatus;
    progressPercent: number;
    startedAt: Date;
    completedAt?: Date;
  }) {
    return ensureEntity(
      repository,
      {
        user: { id: input.user.id } as UserEntity,
        course: { id: input.course.id } as CourseEntity,
      } as FindOptionsWhere<EnrollmentEntity>,
      (enrollment) => {
        enrollment.user = input.user;
        enrollment.course = input.course;
        enrollment.status = input.status;
        enrollment.progressPercent = decimal(input.progressPercent);
        enrollment.startedAt = input.startedAt;
        enrollment.completedAt = input.completedAt;
      },
    );
  }

  await runSerial([
    () =>
      ensureEnrollment({
        user: users.studentBackend,
        course: courses.nodeApi,
        status: EnrollmentStatus.ACTIVE,
        progressPercent: 62,
        startedAt: daysFromNow(-14),
      }),
    () =>
      ensureEnrollment({
        user: users.studentBackend,
        course: courses.systemsDesign,
        status: EnrollmentStatus.ACTIVE,
        progressPercent: 27,
        startedAt: daysFromNow(-5),
      }),
    () =>
      ensureEnrollment({
        user: users.studentFrontend,
        course: courses.reactUi,
        status: EnrollmentStatus.ACTIVE,
        progressPercent: 71,
        startedAt: daysFromNow(-11),
      }),
    () =>
      ensureEnrollment({
        user: users.studentFrontend,
        course: courses.nodeApi,
        status: EnrollmentStatus.COMPLETED,
        progressPercent: 100,
        startedAt: daysFromNow(-35),
        completedAt: daysFromNow(-7),
      }),
  ]);
}

async function seedEvaluations(
  dataSource: DataSource,
  users: DemoUsers,
  courses: DemoCourses,
) {
  const evaluationRepository = dataSource.getRepository(EvaluationEntity);
  const questionRepository = dataSource.getRepository(EvaluationQuestionEntity);

  async function ensureEvaluation(input: {
    slug: string;
    title: string;
    description: string;
    type: EvaluationType;
    instructions: string;
    durationInMinutes: number;
    maxAttempts: number;
    passScore: number;
    startsAt: Date;
    endsAt: Date;
    isPublished: boolean;
    course: CourseEntity;
  }) {
    return ensureEntity(evaluationRepository, { slug: input.slug }, (evaluation) => {
      evaluation.title = input.title;
      evaluation.slug = input.slug;
      evaluation.description = input.description;
      evaluation.type = input.type;
      evaluation.instructions = input.instructions;
      evaluation.durationInMinutes = input.durationInMinutes;
      evaluation.maxAttempts = input.maxAttempts;
      evaluation.passScore = decimal(input.passScore);
      evaluation.startsAt = input.startsAt;
      evaluation.endsAt = input.endsAt;
      evaluation.isPublished = input.isPublished;
      evaluation.creator = users.teacher;
      evaluation.course = input.course;
    });
  }

  async function ensureQuestion(input: {
    evaluation: EvaluationEntity;
    position: number;
    statement: string;
    options: string[];
    correctAnswer: string;
    points: number;
  }) {
    return ensureEntity(
      questionRepository,
      {
        evaluation: { id: input.evaluation.id } as EvaluationEntity,
        position: input.position,
      } as FindOptionsWhere<EvaluationQuestionEntity>,
      (question) => {
        question.evaluation = input.evaluation;
        question.statement = input.statement;
        question.questionType = 'MULTIPLE_CHOICE';
        question.options = input.options;
        question.correctAnswer = input.correctAnswer;
        question.points = decimal(input.points);
        question.position = input.position;
      },
    );
  }

  const evaluations = {
    nodeQuiz: await ensureEvaluation({
      slug: 'node-api-foundations-checkpoint',
      title: 'Node API Foundations Checkpoint',
      description: 'Quiz used to validate controller, guard and persistence concepts.',
      type: EvaluationType.QUIZ,
      instructions: 'Answer every multiple-choice question before submitting.',
      durationInMinutes: 25,
      maxAttempts: 2,
      passScore: 65,
      startsAt: daysFromNow(-2),
      endsAt: daysFromNow(14),
      isPublished: true,
      course: courses.nodeApi,
    }),
    reactPractice: await ensureEvaluation({
      slug: 'react-interface-review',
      title: 'React Interface Review',
      description: 'Short practice to validate responsive patterns and form architecture.',
      type: EvaluationType.PRACTICE,
      instructions: 'Review every answer carefully, then submit once.',
      durationInMinutes: 20,
      maxAttempts: 1,
      passScore: 60,
      startsAt: daysFromNow(-1),
      endsAt: daysFromNow(10),
      isPublished: true,
      course: courses.reactUi,
    }),
    systemsDraft: await ensureEvaluation({
      slug: 'systems-architecture-draft-eval',
      title: 'Systems Architecture Draft Eval',
      description: 'Draft evaluation kept to populate admin moderation and teacher authoring views.',
      type: EvaluationType.EXAM,
      instructions: 'Draft instructions only.',
      durationInMinutes: 35,
      maxAttempts: 1,
      passScore: 70,
      startsAt: daysFromNow(7),
      endsAt: daysFromNow(30),
      isPublished: false,
      course: courses.systemsDesign,
    }),
  } satisfies DemoEvaluations;

  await runSerial([
    () =>
      ensureQuestion({
        evaluation: evaluations.nodeQuiz,
        position: 1,
        statement: 'Which layer should own permission checks for route access in a NestJS app?',
        options: ['DTO', 'Guard', 'Repository', 'Entity'],
        correctAnswer: 'Guard',
        points: 5,
      }),
    () =>
      ensureQuestion({
        evaluation: evaluations.nodeQuiz,
        position: 2,
        statement: 'What is the most appropriate place to centralize persistence queries?',
        options: ['React component', 'Repository', 'Controller decorator', 'Middleware'],
        correctAnswer: 'Repository',
        points: 5,
      }),
    () =>
      ensureQuestion({
        evaluation: evaluations.reactPractice,
        position: 1,
        statement: 'What improves mobile resilience the most on dense dashboard tables?',
        options: ['More fixed widths', 'Horizontal scroll containers', 'Inline styles only', 'Removing headers'],
        correctAnswer: 'Horizontal scroll containers',
        points: 4,
      }),
    () =>
      ensureQuestion({
        evaluation: evaluations.reactPractice,
        position: 2,
        statement: 'Which pattern best keeps form feedback aligned with backend responses?',
        options: ['Disconnected local state', 'Submit and ignore errors', 'Controlled state with API feedback', 'Random retry loops'],
        correctAnswer: 'Controlled state with API feedback',
        points: 4,
      }),
  ]);

  return evaluations;
}

async function seedAttemptsAndGrades(
  dataSource: DataSource,
  users: DemoUsers,
  courses: DemoCourses,
  evaluations: DemoEvaluations,
) {
  const attemptRepository = dataSource.getRepository(EvaluationAttemptEntity);
  const gradeRepository = dataSource.getRepository(GradeEntity);

  async function ensureAttempt(input: {
    evaluation: EvaluationEntity;
    student: UserEntity;
    status: string;
    answers: Record<string, unknown>;
    score?: number;
    maxScore: number;
    feedback?: string;
    startedAt: Date;
    submittedAt?: Date;
    grader?: UserEntity;
  }) {
    return ensureEntity(
      attemptRepository,
      {
        evaluation: { id: input.evaluation.id } as EvaluationEntity,
        student: { id: input.student.id } as UserEntity,
      } as FindOptionsWhere<EvaluationAttemptEntity>,
      (attempt) => {
        attempt.evaluation = input.evaluation;
        attempt.student = input.student;
        attempt.grader = input.grader;
        attempt.status = input.status;
        attempt.answers = input.answers;
        attempt.score =
          input.score === undefined ? undefined : decimal(input.score);
        attempt.maxScore = decimal(input.maxScore);
        attempt.feedback = input.feedback;
        attempt.startedAt = input.startedAt;
        attempt.submittedAt = input.submittedAt;
      },
    );
  }

  async function ensureGrade(input: {
    title: string;
    student: UserEntity;
    course: CourseEntity;
    evaluationAttempt: EvaluationAttemptEntity;
    score: number;
    maxScore: number;
    percentage: number;
    feedback: string;
    status?: string;
  }) {
    return ensureEntity(
      gradeRepository,
      {
        title: input.title,
        student: { id: input.student.id } as UserEntity,
        course: { id: input.course.id } as CourseEntity,
      } as FindOptionsWhere<GradeEntity>,
      (grade) => {
        grade.title = input.title;
        grade.type = 'QUIZ';
        grade.score = decimal(input.score);
        grade.maxScore = decimal(input.maxScore);
        grade.percentage = decimal(input.percentage);
        grade.weight = decimal(1);
        grade.feedback = input.feedback;
        grade.status = input.status ?? 'PUBLISHED';
        grade.gradedAt = daysFromNow(-1);
        grade.student = input.student;
        grade.gradedBy = users.teacher;
        grade.course = input.course;
        grade.evaluationAttempt = input.evaluationAttempt;
      },
    );
  }

  const backendAttempt = await ensureAttempt({
    evaluation: evaluations.nodeQuiz,
    student: users.studentBackend,
    status: 'GRADED',
    answers: {
      1: 'Guard',
      2: 'Repository',
    },
    score: 10,
    maxScore: 10,
    feedback: 'Strong backend foundations with clean architectural instincts.',
    startedAt: daysFromNow(-2),
    submittedAt: daysFromNow(-2),
    grader: users.teacher,
  });

  const frontendAttempt = await ensureAttempt({
    evaluation: evaluations.reactPractice,
    student: users.studentFrontend,
    status: 'SUBMITTED',
    answers: {
      1: 'Horizontal scroll containers',
      2: 'Controlled state with API feedback',
    },
    score: 8,
    maxScore: 8,
    feedback: 'Awaiting final teacher review.',
    startedAt: daysFromNow(-1),
    submittedAt: hoursFromNow(-12),
  });

  await runSerial([
    () =>
      ensureGrade({
        title: 'Node API Foundations Checkpoint',
        student: users.studentBackend,
        course: courses.nodeApi,
        evaluationAttempt: backendAttempt,
        score: 10,
        maxScore: 10,
        percentage: 100,
        feedback: 'Excellent work on access control and persistence reasoning.',
      }),
    () =>
      ensureGrade({
        title: 'React Interface Review',
        student: users.studentFrontend,
        course: courses.reactUi,
        evaluationAttempt: frontendAttempt,
        score: 8,
        maxScore: 8,
        percentage: 100,
        feedback: 'Very good product reasoning, with one last mentor review pending.',
      }),
  ]);
}

async function seedNotifications(
  dataSource: DataSource,
  users: DemoUsers,
  courses: DemoCourses,
) {
  const repository = dataSource.getRepository(NotificationEntity);

  await runSerial([
    () =>
      ensureEntity(
      repository,
      {
        recipient: { id: users.studentBackend.id } as UserEntity,
        title: 'Mentor feedback available',
      } as FindOptionsWhere<NotificationEntity>,
      (notification) => {
        notification.title = 'Mentor feedback available';
        notification.message =
          'Your latest backend checkpoint was reviewed. Open the evaluation panel for feedback.';
        notification.type = 'INFO';
        notification.channel = NotificationChannel.IN_APP;
        notification.isRead = false;
        notification.readAt = undefined;
        notification.metadata = {
          courseSlug: courses.nodeApi.slug,
          surface: 'evaluations',
        };
        notification.recipient = users.studentBackend;
        notification.sender = users.teacher;
      },
      ),
    () =>
      ensureEntity(
      repository,
      {
        recipient: { id: users.studentFrontend.id } as UserEntity,
        title: 'Live session tomorrow',
      } as FindOptionsWhere<NotificationEntity>,
      (notification) => {
        notification.title = 'Live session tomorrow';
        notification.message =
          'Your React live review starts tomorrow. Check the student calendar for the meeting link.';
        notification.type = 'REMINDER';
        notification.channel = NotificationChannel.IN_APP;
        notification.isRead = false;
        notification.readAt = undefined;
        notification.metadata = {
          courseSlug: courses.reactUi.slug,
          surface: 'calendar',
        };
        notification.recipient = users.studentFrontend;
        notification.sender = users.teacher;
      },
      ),
    () =>
      ensureEntity(
      repository,
      {
        recipient: { id: users.teacher.id } as UserEntity,
        title: 'Submission awaiting grading',
      } as FindOptionsWhere<NotificationEntity>,
      (notification) => {
        notification.title = 'Submission awaiting grading';
        notification.message =
          'A React evaluation attempt is still waiting for teacher review.';
        notification.type = 'ACTION';
        notification.channel = NotificationChannel.IN_APP;
        notification.isRead = false;
        notification.readAt = undefined;
        notification.metadata = {
          queue: 'teacher-review',
        };
        notification.recipient = users.teacher;
        notification.sender = users.admin;
      },
      ),
  ]);
}

async function seedCalendar(
  dataSource: DataSource,
  users: DemoUsers,
  courses: DemoCourses,
) {
  const eventRepository = dataSource.getRepository(CalendarEventEntity);
  const attendeeRepository = dataSource.getRepository(CalendarEventAttendeeEntity);

  async function ensureEvent(input: {
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    meetingUrl?: string;
    course: CourseEntity;
  }) {
    return ensureEntity(eventRepository, { title: input.title }, (event) => {
      event.title = input.title;
      event.description = input.description;
      event.startsAt = input.startsAt;
      event.endsAt = input.endsAt;
      event.timezone = 'Africa/Casablanca';
      event.status = 'SCHEDULED';
      event.location = input.location;
      event.meetingUrl = input.meetingUrl;
      event.isAllDay = false;
      event.createdBy = users.teacher;
      event.course = input.course;
    });
  }

  async function ensureAttendee(input: {
    event: CalendarEventEntity;
    user: UserEntity;
    responseStatus: string;
    note?: string;
  }) {
    return ensureEntity(
      attendeeRepository,
      {
        event: { id: input.event.id } as CalendarEventEntity,
        user: { id: input.user.id } as UserEntity,
      } as FindOptionsWhere<CalendarEventAttendeeEntity>,
      (attendee) => {
        attendee.event = input.event;
        attendee.user = input.user;
        attendee.responseStatus = input.responseStatus;
        attendee.note = input.note;
      },
    );
  }

  const backendLive = await ensureEvent({
    title: 'Backend architecture live review',
    description: 'Weekly teacher session to review API decisions and progress blockers.',
    startsAt: daysFromNow(2),
    endsAt: daysFromNow(2.1),
    meetingUrl: 'https://meet.google.com/demo-backend-live',
    course: courses.nodeApi,
  });

  const reactLive = await ensureEvent({
    title: 'React product critique',
    description: 'Review responsive UI decisions and polish opportunities.',
    startsAt: daysFromNow(1),
    endsAt: daysFromNow(1.08),
    meetingUrl: 'https://meet.google.com/demo-react-live',
    course: courses.reactUi,
  });

  await runSerial([
    () =>
      ensureAttendee({
        event: backendLive,
        user: users.studentBackend,
        responseStatus: 'ACCEPTED',
        note: 'Will share current API milestone.',
      }),
    () =>
      ensureAttendee({
        event: reactLive,
        user: users.studentFrontend,
        responseStatus: 'ACCEPTED',
        note: 'Will bring the latest UI screenshots.',
      }),
  ]);
}

async function seedPrograms(dataSource: DataSource, users: DemoUsers) {
  const programRepository = dataSource.getRepository(StudentProgramEntity);
  const stepRepository = dataSource.getRepository(ProgramStepEntity);

  const program = await ensureEntity(
    programRepository,
    {
      title: '90-day backend architect plan',
      student: { id: users.studentBackend.id } as UserEntity,
    } as FindOptionsWhere<StudentProgramEntity>,
    (studentProgram) => {
      studentProgram.title = '90-day backend architect plan';
      studentProgram.description =
        'A guided 90-day program focused on backend architecture depth and delivery habits.';
      studentProgram.goal = 'Reach architecture ownership on service design and reliability topics.';
      studentProgram.status = ProgramStatus.ACTIVE;
      studentProgram.startDate = daysFromNow(-20);
      studentProgram.endDate = daysFromNow(70);
      studentProgram.student = users.studentBackend;
      studentProgram.teacher = users.teacher;
    },
  );

  const stepSpecs = [
    {
      position: 1,
      title: 'Finish backend foundations',
      description: 'Complete the Node API foundations curriculum and checkpoint.',
      status: ProgramStepStatus.COMPLETED,
      dueDate: daysFromNow(-5),
      completedAt: daysFromNow(-6),
    },
    {
      position: 2,
      title: 'Model one event-driven service boundary',
      description: 'Design one service boundary with event contracts and failure notes.',
      status: ProgramStepStatus.IN_PROGRESS,
      dueDate: daysFromNow(5),
      completedAt: null,
    },
    {
      position: 3,
      title: 'Prepare observability notes',
      description: 'Document the first alerting and dashboard strategy for the capstone system.',
      status: ProgramStepStatus.TODO,
      dueDate: daysFromNow(12),
      completedAt: null,
    },
  ] as const;

  await runSerial(
    stepSpecs.map(
      (stepSpec) => () =>
        ensureEntity(
          stepRepository,
          {
            studentProgram: { id: program.id } as StudentProgramEntity,
            position: stepSpec.position,
          } as FindOptionsWhere<ProgramStepEntity>,
          (step) => {
            step.studentProgram = program;
            step.title = stepSpec.title;
            step.description = stepSpec.description;
            step.position = stepSpec.position;
            step.status = stepSpec.status;
            step.dueDate = stepSpec.dueDate;
            step.completedAt = stepSpec.completedAt ?? undefined;
          },
        ),
    ),
  );
}

async function seedProblems(dataSource: DataSource, users: DemoUsers) {
  const languageRepository = dataSource.getRepository(SupportedLanguageEntity);
  const tagRepository = dataSource.getRepository(ProblemTagEntity);
  const problemRepository = dataSource.getRepository(ProblemEntity);
  const testCaseRepository = dataSource.getRepository(ProblemTestCaseEntity);

  await runSerial([
    () =>
      ensureEntity(languageRepository, { slug: 'python-3-11' }, (language) => {
        language.name = 'Python';
        language.slug = 'python-3-11';
        language.version = '3.11';
        language.judge0LanguageId = 71;
        language.isActive = true;
      }),
    () =>
      ensureEntity(languageRepository, { slug: 'node-20' }, (language) => {
        language.name = 'JavaScript (Node.js)';
        language.slug = 'node-20';
        language.version = '20.x';
        language.judge0LanguageId = 63;
        language.isActive = true;
      }),
    () =>
      ensureEntity(languageRepository, { slug: 'typescript-5' }, (language) => {
        language.name = 'TypeScript';
        language.slug = 'typescript-5';
        language.version = '5.x';
        language.judge0LanguageId = 74;
        language.isActive = true;
      }),
  ]);

  const tags = await runSerial([
    () =>
      ensureEntity(tagRepository, { slug: 'arrays' }, (tag) => {
        tag.name = 'Arrays';
        tag.slug = 'arrays';
      }),
    () =>
      ensureEntity(tagRepository, { slug: 'hash-map' }, (tag) => {
        tag.name = 'Hash Map';
        tag.slug = 'hash-map';
      }),
  ]);

  const problem = await ensureEntity(problemRepository, { slug: 'two-sum-telemetry' }, (item) => {
    item.title = 'Two Sum Telemetry';
    item.slug = 'two-sum-telemetry';
    item.statement =
      'Return the indices of two numbers that add up to the target while preserving linear complexity.';
    item.inputFormat = 'An integer array and one integer target.';
    item.outputFormat = 'Two indices separated by a space.';
    item.constraints = '2 <= n <= 10000; each input has exactly one solution';
    item.sampleInput = '4\n2 7 11 15\n9';
    item.sampleOutput = '0 1';
    item.explanation =
      'Use a hash map to store the complement you need while iterating once through the array.';
    item.difficulty = ProblemDifficulty.EASY;
    item.status = ProblemStatus.PUBLISHED;
    item.timeLimitMs = 1000;
    item.memoryLimitMb = 256;
    item.isPublished = true;
    item.creator = users.teacher;
    item.tags = tags;
  });

  await runSerial([
    () =>
      ensureEntity(
      testCaseRepository,
      {
        problem: { id: problem.id } as ProblemEntity,
        position: 1,
      } as FindOptionsWhere<ProblemTestCaseEntity>,
      (testCase) => {
        testCase.problem = problem;
        testCase.input = '4\n2 7 11 15\n9';
        testCase.expectedOutput = '0 1';
        testCase.isHidden = false;
        testCase.points = decimal(50);
        testCase.position = 1;
      },
      ),
    () =>
      ensureEntity(
      testCaseRepository,
      {
        problem: { id: problem.id } as ProblemEntity,
        position: 2,
      } as FindOptionsWhere<ProblemTestCaseEntity>,
      (testCase) => {
        testCase.problem = problem;
        testCase.input = '6\n3 2 4 8 12 5\n6';
        testCase.expectedOutput = '1 2';
        testCase.isHidden = true;
        testCase.points = decimal(50);
        testCase.position = 2;
      },
      ),
  ]);
}

async function seedPaymentsAndInvoices(
  dataSource: DataSource,
  users: DemoUsers,
  courses: DemoCourses,
) {
  const paymentRepository = dataSource.getRepository(PaymentEntity);
  const invoiceRepository = dataSource.getRepository(InvoiceEntity);

  async function ensurePayment(input: {
    reference: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    provider: string;
    providerTransactionId: string;
    description: string;
    metadata: Record<string, unknown>;
    isSubscription: boolean;
    subscriptionPlanCode?: string;
    subscriptionStatus?: string;
    billingInterval?: string;
    nextBillingAt?: Date;
    canceledAt?: Date;
    refundedAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
    paidAt?: Date;
    user: UserEntity;
    course?: CourseEntity;
  }) {
    return ensureEntity(paymentRepository, { reference: input.reference }, (payment) => {
      payment.reference = input.reference;
      payment.amount = decimal(input.amount);
      payment.currency = input.currency;
      payment.status = input.status;
      payment.provider = input.provider;
      payment.providerTransactionId = input.providerTransactionId;
      payment.description = input.description;
      payment.metadata = input.metadata;
      payment.isSubscription = input.isSubscription;
      payment.subscriptionPlanCode = input.subscriptionPlanCode;
      payment.subscriptionStatus = input.subscriptionStatus;
      payment.billingInterval = input.billingInterval;
      payment.nextBillingAt = input.nextBillingAt;
      payment.canceledAt = input.canceledAt;
      payment.refundedAmount =
        input.refundedAmount !== undefined ? decimal(input.refundedAmount) : undefined;
      payment.refundReason = input.refundReason;
      payment.refundedAt = input.refundedAt;
      payment.paidAt = input.paidAt;
      payment.user = input.user;
      payment.course = input.course;
    });
  }

  async function ensureInvoice(input: {
    number: string;
    amount: number;
    subtotalHt: number;
    taxRate: number;
    taxAmount: number;
    totalTtc: number;
    currency: string;
    status: string;
    fiscalStatus: string;
    note: string;
    metadata: Record<string, unknown>;
    issuedAt: Date;
    dueAt: Date;
    paidAt?: Date;
    user: UserEntity;
    payment: PaymentEntity;
  }) {
    return ensureEntity(invoiceRepository, { number: input.number }, (invoice) => {
      invoice.number = input.number;
      invoice.amount = decimal(input.amount);
      invoice.subtotalHt = decimal(input.subtotalHt);
      invoice.taxRate = decimal(input.taxRate);
      invoice.vatCategory = 'STANDARD_20';
      invoice.taxAmount = decimal(input.taxAmount);
      invoice.totalTtc = decimal(input.totalTtc);
      invoice.currency = input.currency;
      invoice.status = input.status;
      invoice.fiscalStatus = input.fiscalStatus;
      invoice.note = input.note;
      invoice.metadata = input.metadata;
      invoice.issuedAt = input.issuedAt;
      invoice.dueAt = input.dueAt;
      invoice.paidAt = input.paidAt;
      invoice.pdfSha256 = 'seed-demo-pdf-hash';
      invoice.pdfGeneratedAt = input.issuedAt;
      invoice.user = input.user;
      invoice.payment = input.payment;
    });
  }

  const payments = {
    courseOrder: await ensurePayment({
      reference: 'PAY-DEMO-COURSE-001',
      amount: 249,
      currency: 'MAD',
      status: PaymentStatus.PAID,
      provider: 'manual',
      providerTransactionId: 'txn-demo-course-001',
      description: 'Node API Foundations order',
      metadata: {
        checkoutMode: 'course',
        seeded: true,
      },
      isSubscription: false,
      paidAt: daysFromNow(-10),
      user: users.studentBackend,
      course: courses.nodeApi,
    }),
    proSubscription: await ensurePayment({
      reference: 'PAY-DEMO-SUB-001',
      amount: 99,
      currency: 'EUR',
      status: PaymentStatus.PAID,
      provider: 'manual',
      providerTransactionId: 'txn-demo-subscription-001',
      description: 'Academie Pro subscription',
      metadata: {
        checkoutMode: 'pack',
        seeded: true,
      },
      isSubscription: true,
      subscriptionPlanCode: 'PRO',
      subscriptionStatus: 'ACTIVE',
      billingInterval: 'MONTHLY',
      nextBillingAt: daysFromNow(25),
      paidAt: daysFromNow(-4),
      user: users.studentFrontend,
    }),
    teamSubscriptionPending: await ensurePayment({
      reference: 'PAY-DEMO-SUB-TEAM-001',
      amount: 199,
      currency: 'EUR',
      status: PaymentStatus.PENDING,
      provider: 'manual',
      providerTransactionId: 'txn-demo-subscription-team-001',
      description: 'Academie Team subscription',
      metadata: {
        checkoutMode: 'pack',
        seeded: true,
      },
      isSubscription: true,
      subscriptionPlanCode: 'TEAM',
      subscriptionStatus: 'PENDING',
      billingInterval: 'MONTHLY',
      nextBillingAt: daysFromNow(30),
      user: users.studentBackend,
    }),
    refundedReactOrder: await ensurePayment({
      reference: 'PAY-DEMO-REFUND-001',
      amount: 279,
      currency: 'MAD',
      status: PaymentStatus.REFUNDED,
      provider: 'manual',
      providerTransactionId: 'txn-demo-refund-001',
      description: 'Refunded React Interface Engineering order',
      metadata: {
        checkoutMode: 'course',
        seeded: true,
      },
      isSubscription: false,
      refundedAmount: 279,
      refundReason: 'Learner switched to a different path',
      refundedAt: daysFromNow(-15),
      paidAt: daysFromNow(-16),
      user: users.studentFrontend,
      course: courses.reactUi,
    }),
    failedOrder: await ensurePayment({
      reference: 'PAY-DEMO-FAILED-001',
      amount: 399,
      currency: 'MAD',
      status: PaymentStatus.FAILED,
      provider: 'manual',
      providerTransactionId: 'txn-demo-failed-001',
      description: 'Failed systems design payment',
      metadata: {
        checkoutMode: 'course',
        seeded: true,
      },
      isSubscription: false,
      user: users.studentBackend,
      course: courses.systemsDesign,
    }),
  } satisfies DemoPayments;

  await runSerial([
    () =>
      ensureInvoice({
      number: 'INV-DEMO-COURSE-001',
      amount: 249,
      subtotalHt: 207.5,
      taxRate: 20,
      taxAmount: 41.5,
      totalTtc: 249,
      currency: 'MAD',
      status: 'PAID',
      fiscalStatus: 'ISSUED',
      note: 'Demo course invoice',
      metadata: {
        seeded: true,
      },
      issuedAt: daysFromNow(-10),
      dueAt: daysFromNow(-10),
      paidAt: daysFromNow(-10),
      user: users.studentBackend,
      payment: payments.courseOrder,
      }),
    () =>
      ensureInvoice({
      number: 'INV-DEMO-SUB-001',
      amount: 99,
      subtotalHt: 82.5,
      taxRate: 20,
      taxAmount: 16.5,
      totalTtc: 99,
      currency: 'EUR',
      status: 'PAID',
      fiscalStatus: 'ISSUED',
      note: 'Demo subscription invoice',
      metadata: {
        seeded: true,
      },
      issuedAt: daysFromNow(-4),
      dueAt: daysFromNow(-4),
      paidAt: daysFromNow(-4),
      user: users.studentFrontend,
      payment: payments.proSubscription,
      }),
    () =>
      ensureInvoice({
      number: 'INV-DEMO-SUB-TEAM-001',
      amount: 199,
      subtotalHt: 165.83,
      taxRate: 20,
      taxAmount: 33.17,
      totalTtc: 199,
      currency: 'EUR',
      status: 'DRAFT',
      fiscalStatus: 'DRAFT',
      note: 'Pending team subscription invoice',
      metadata: {
        seeded: true,
        checkoutMode: 'pack',
      },
      issuedAt: daysFromNow(-1),
      dueAt: daysFromNow(7),
      user: users.studentBackend,
      payment: payments.teamSubscriptionPending,
      }),
    () =>
      ensureInvoice({
      number: 'INV-DEMO-REACT-REFUND-001',
      amount: 279,
      subtotalHt: 232.5,
      taxRate: 20,
      taxAmount: 46.5,
      totalTtc: 279,
      currency: 'MAD',
      status: 'REFUNDED',
      fiscalStatus: 'REFUNDED',
      note: 'Refunded React course invoice',
      metadata: {
        seeded: true,
        checkoutMode: 'course',
      },
      issuedAt: daysFromNow(-18),
      dueAt: daysFromNow(-18),
      paidAt: daysFromNow(-16),
      user: users.studentFrontend,
      payment: payments.refundedReactOrder,
      }),
    () =>
      ensureInvoice({
      number: 'INV-DEMO-FAILED-001',
      amount: 399,
      subtotalHt: 332.5,
      taxRate: 20,
      taxAmount: 66.5,
      totalTtc: 399,
      currency: 'MAD',
      status: 'FAILED',
      fiscalStatus: 'FAILED',
      note: 'Failed systems design invoice',
      metadata: {
        seeded: true,
        checkoutMode: 'course',
      },
      issuedAt: daysFromNow(-2),
      dueAt: daysFromNow(5),
      user: users.studentBackend,
      payment: payments.failedOrder,
      }),
  ]);

  return payments;
}

async function seedSupport(dataSource: DataSource, users: DemoUsers) {
  const repository = dataSource.getRepository(SupportTicketEntity);

  await runSerial([
    () =>
      ensureEntity(
      repository,
      {
        user: { id: users.studentBackend.id } as UserEntity,
        subject: 'Need clarity on the architecture milestone',
      } as FindOptionsWhere<SupportTicketEntity>,
      (ticket) => {
        ticket.subject = 'Need clarity on the architecture milestone';
        ticket.category = 'MENTORING';
        ticket.description =
          'I need more clarity on the current architecture milestone and the next systems design deliverable.';
        ticket.status = 'OPEN';
        ticket.resolution = undefined;
        ticket.user = users.studentBackend;
      },
      ),
    () =>
      ensureEntity(
      repository,
      {
        user: { id: users.studentFrontend.id } as UserEntity,
        subject: 'Video playback stalls on mobile',
      } as FindOptionsWhere<SupportTicketEntity>,
      (ticket) => {
        ticket.subject = 'Video playback stalls on mobile';
        ticket.category = 'TECHNICAL';
        ticket.description =
          'Video playback needs a quick review on one mobile browser scenario.';
        ticket.status = 'IN_PROGRESS';
        ticket.resolution = undefined;
        ticket.user = users.studentFrontend;
      },
      ),
    () =>
      ensureEntity(
      repository,
      {
        user: { id: users.studentFrontend.id } as UserEntity,
        subject: 'Pack invoice request',
      } as FindOptionsWhere<SupportTicketEntity>,
      (ticket) => {
        ticket.subject = 'Pack invoice request';
        ticket.category = 'BILLING';
        ticket.description =
          'The learner requested a downloadable invoice after the pack subscription.';
        ticket.status = 'RESOLVED';
        ticket.resolution = 'Invoice was generated and attached to the billing history.';
        ticket.user = users.studentFrontend;
      },
      ),
  ]);
}

async function seedContactRequests(dataSource: DataSource) {
  const repository = dataSource.getRepository(ContactRequestEntity);

  await runSerial([
    () =>
      ensureEntity(repository, { subject: 'Enterprise mentoring plan' }, (request) => {
        request.fullName = 'Sofia Haddad';
        request.email = 'sofia.haddad@example.com';
        request.subject = 'Enterprise mentoring plan';
        request.message =
          'Looking for a team plan with teacher review loops and structured cohort support.';
        request.status = 'NEW';
      }),
    () =>
      ensureEntity(repository, { subject: 'Admissions question' }, (request) => {
        request.fullName = 'Adil Tazi';
        request.email = 'adil.tazi@example.com';
        request.subject = 'Admissions question';
        request.message =
          'Need more details on the onboarding flow and the first learning sprint.';
        request.status = 'RESPONDED';
      }),
  ]);
}

async function seedAuditLogs(
  dataSource: DataSource,
  users: DemoUsers,
  payments: DemoPayments,
) {
  const repository = dataSource.getRepository(AuditLogEntity);

  await runSerial([
    () =>
      ensureEntity(
      repository,
      { action: 'PAYMENT_CONFIRMED', resource: payments.courseOrder.reference },
      (log) => {
        log.action = 'PAYMENT_CONFIRMED';
        log.resource = payments.courseOrder.reference;
        log.userId = users.admin.id;
        log.ipAddress = '127.0.0.1';
        log.userAgent = 'seed-demo';
        log.metadata = {
          status: 'PAID',
          seeded: true,
        };
      },
      ),
    () =>
      ensureEntity(
      repository,
      { action: 'COURSE_PUBLISHED', resource: 'node-api-foundations' },
      (log) => {
        log.action = 'COURSE_PUBLISHED';
        log.resource = 'node-api-foundations';
        log.userId = users.teacher.id;
        log.ipAddress = '127.0.0.1';
        log.userAgent = 'seed-demo';
        log.metadata = {
          seeded: true,
        };
      },
      ),
    () =>
      ensureEntity(
      repository,
      {
        action: 'SUPPORT_TICKET_ESCALATED',
        resource: 'Video playback stalls on mobile',
      },
      (log) => {
        log.action = 'SUPPORT_TICKET_ESCALATED';
        log.resource = 'Video playback stalls on mobile';
        log.userId = users.admin.id;
        log.ipAddress = '127.0.0.1';
        log.userAgent = 'seed-demo';
        log.metadata = {
          seeded: true,
        };
      },
      ),
  ]);
}

async function main() {
  if (
    process.env.NODE_ENV?.toLowerCase() === 'production' &&
    process.env.ALLOW_PRODUCTION_SEED !== 'true'
  ) {
    throw new Error(
      'Refusing to run demo seeds in production without ALLOW_PRODUCTION_SEED=true.',
    );
  }

  const dataSource = await createDataSource();

  try {
    const roleMap = await seedRoles(dataSource);
    const users = await seedUsers(dataSource, roleMap);
    await seedAcademySettings(dataSource);
    await seedAcademyAnnouncements(dataSource, users);
    const courses = await seedCourses(dataSource, users);
    await seedEnrollments(dataSource, users, courses);
    const evaluations = await seedEvaluations(dataSource, users, courses);
    await seedAttemptsAndGrades(dataSource, users, courses, evaluations);
    await seedNotifications(dataSource, users, courses);
    await seedCalendar(dataSource, users, courses);
    await seedPrograms(dataSource, users);
    await seedProblems(dataSource, users);
    const payments = await seedPaymentsAndInvoices(dataSource, users, courses);
    await seedSupport(dataSource, users);
    await seedContactRequests(dataSource);
    await seedAuditLogs(dataSource, users, payments);

    console.log('Demo seed completed successfully.');
    console.log('Demo password for all seeded accounts:', DEMO_PASSWORD);
    console.log('Seeded accounts:');
    console.log('  admin@academie.local');
    console.log('  teacher@academie.local');
    console.log('  student.backend@academie.local');
    console.log('  student.checkout@academie.local');
    console.log('  student.frontend@academie.local');
    console.log('  student.pending@academie.local');
    console.log('  student.suspended@academie.local');
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error('Demo seed failed.');
  console.error(error);
  process.exitCode = 1;
});
