import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AcademyController } from '../src/modules/academy/academy.controller';
import { AcademyService } from '../src/modules/academy/academy.service';
import { CoursesController } from '../src/modules/courses/courses.controller';
import { CoursesService } from '../src/modules/courses/courses.service';
import { PaymentsController } from '../src/modules/payments/payments.controller';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { ProblemsController } from '../src/modules/problems/problems.controller';
import { ProblemsService } from '../src/modules/problems/problems.service';
import { TokenService } from '../src/modules/auth/services/token.service';
import { JwtAuthGuard } from '../src/core/guards/jwt-auth.guard';
import { RolesGuard } from '../src/core/guards/roles.guard';
import { PermissionsGuard } from '../src/core/guards/permissions.guard';

describe('Public routes (e2e)', () => {
  let app: INestApplication<App>;

  const academyServiceMock = {
    listAnnouncements: jest.fn().mockResolvedValue([
      {
        id: 'announcement-1',
        title: 'Portes ouvertes',
        content: 'Découvre l académie.',
        isPublished: true,
        publishedAt: new Date('2026-03-01T10:00:00.000Z'),
        createdAt: new Date('2026-03-01T09:00:00.000Z'),
        updatedAt: new Date('2026-03-01T09:30:00.000Z'),
      },
    ]),
    listPublicSettings: jest.fn().mockResolvedValue([
      {
        id: 'setting-1',
        key: 'marketing.hero_title',
        value: 'Académie Algorithmes',
        description: 'Titre principal',
        isPublic: true,
        createdAt: new Date('2026-03-01T09:00:00.000Z'),
        updatedAt: new Date('2026-03-01T09:30:00.000Z'),
      },
    ]),
  };

  const coursesServiceMock = {
    listPublishedCourses: jest.fn().mockResolvedValue([
      {
        id: 'course-1',
        title: 'Algo Expert',
        slug: 'algo-expert',
        shortDescription: 'Prépa premium',
        description: 'Description complète',
        thumbnailUrl: 'https://example.com/course.jpg',
        price: '149.00',
        currency: 'EUR',
        level: 'INTERMEDIATE',
        status: 'PUBLISHED',
        isPublished: true,
        durationInHours: 20,
        certificateEnabled: true,
        creator: {
          id: 'teacher-1',
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
        },
        modules: [
          {
            id: 'module-1',
            title: 'Bases',
            description: 'Fondations',
            position: 1,
            isPublished: true,
            lessons: [
              {
                id: 'lesson-1',
                title: 'Introduction',
                slug: 'introduction',
                durationInMinutes: 15,
                position: 1,
                isFreePreview: true,
                isPublished: true,
              },
            ],
          },
        ],
        enrollments: [],
        createdAt: new Date('2026-03-01T09:00:00.000Z'),
        updatedAt: new Date('2026-03-01T09:30:00.000Z'),
      },
    ]),
  };

  const problemsServiceMock = {
    listPublishedProblems: jest.fn().mockResolvedValue([
      {
        id: 'problem-1',
        title: 'Two Sum',
        slug: 'two-sum',
        statement: 'Trouver deux indices',
        inputFormat: 'n puis tableau',
        outputFormat: 'deux indices',
        constraints: 'n <= 1e5',
        sampleInput: '4\n2 7 11 15',
        sampleOutput: '0 1',
        explanation: 'Utiliser une table de hachage',
        difficulty: 'EASY',
        status: 'PUBLISHED',
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        isPublished: true,
        creator: {
          id: 'teacher-1',
          firstName: 'Grace',
          lastName: 'Hopper',
          email: 'grace@example.com',
        },
        tags: [{ id: 'tag-1', name: 'Array', slug: 'array' }],
        testCases: [{ id: 'tc-1' }],
        createdAt: new Date('2026-03-01T09:00:00.000Z'),
        updatedAt: new Date('2026-03-01T09:30:00.000Z'),
      },
    ]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AcademyController,
        CoursesController,
        ProblemsController,
        PaymentsController,
      ],
      providers: [
        { provide: AcademyService, useValue: academyServiceMock },
        { provide: CoursesService, useValue: coursesServiceMock },
        { provide: ProblemsService, useValue: problemsServiceMock },
        { provide: PaymentsService, useValue: {} },
        {
          provide: TokenService,
          useValue: {
            verifyAccessToken: jest.fn(),
          },
        },
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
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('exposes academy public content without authentication', async () => {
    await request(app.getHttpServer())
      .get('/academy/announcements')
      .expect(200);
    await request(app.getHttpServer())
      .get('/academy/settings/public')
      .expect(200);
  });

  it('exposes the public course and problem catalogs without authentication', async () => {
    await request(app.getHttpServer()).get('/courses/catalog').expect(200);
    await request(app.getHttpServer()).get('/problems/library').expect(200);
  });

  it('still protects private routes when no access token is provided', async () => {
    await request(app.getHttpServer()).get('/academy/settings').expect(401);
    await request(app.getHttpServer()).get('/courses').expect(401);
    await request(app.getHttpServer()).get('/payments').expect(401);
  });
});
