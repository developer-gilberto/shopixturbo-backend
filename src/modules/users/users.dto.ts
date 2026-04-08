import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/generated/prisma/enums';

export class UserResponseDTO {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: UserRole, example: 'USER' }) role: UserRole;
  @ApiProperty() is_email_verified: boolean;
  @ApiProperty({ type: 'string', format: 'date-time', example: '2027-04-08T03:36:06.000Z' }) created_at: Date;
  @ApiProperty({ type: 'string', format: 'date-time', example: '2027-04-08T03:36:06.000Z' }) updated_at: Date;
}
