import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AssignAdminUserRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleNames!: string[];
}
