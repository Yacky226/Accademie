export class ExportUserDataResponseDto {
  generatedAt!: string;
  legalBasis!: string;
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
    country?: string;
    city?: string;
    roles: string[];
    onboardingProfile?: Record<string, string>;
    onboardingCompletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}
