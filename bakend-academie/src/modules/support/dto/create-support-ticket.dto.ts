import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(4000)
  description!: string;
}
