import { IsString, MaxLength } from 'class-validator';

export class CreateProblemTagDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(90)
  slug!: string;
}
