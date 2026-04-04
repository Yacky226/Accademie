export class InvoiceFiscalEventResponseDto {
  id!: string;
  eventType!: string;
  actorUserId?: string;
  payload?: Record<string, unknown>;
  signature?: string;
  previousSignature?: string;
  createdAt!: Date;
}
