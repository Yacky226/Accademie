export class CalendarEventResponseDto {
  id!: string;
  title!: string;
  description?: string;
  startsAt!: Date;
  endsAt!: Date;
  timezone!: string;
  status!: string;
  location?: string;
  meetingUrl?: string;
  isAllDay!: boolean;
  createdBy!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  attendees!: Array<{
    id: string;
    responseStatus: string;
    note?: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  createdAt!: Date;
  updatedAt!: Date;
}
