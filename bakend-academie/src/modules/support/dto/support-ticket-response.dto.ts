export class SupportTicketResponseDto {
  id!: string;
  subject!: string;
  category!: string;
  status!: string;
  description!: string;
  resolution?: string;
  createdAt!: Date;
  updatedAt!: Date;
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
