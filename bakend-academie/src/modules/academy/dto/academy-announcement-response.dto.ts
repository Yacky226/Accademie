export class AcademyAnnouncementResponseDto {
  id!: string;
  title!: string;
  content!: string;
  isPublished!: boolean;
  publishedAt?: Date;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
