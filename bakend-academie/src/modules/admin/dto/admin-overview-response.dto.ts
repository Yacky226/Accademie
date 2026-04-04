export class AdminOverviewResponseDto {
  usersPendingApproval!: number;
  usersSuspended!: number;
  usersInactive!: number;
  coursesDraft!: number;
  evaluationsDraft!: number;
  announcementsDraft!: number;
}
