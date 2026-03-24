import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/generated/prisma/enums';

export class UserResponseDTO {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() role: UserRole;
  @ApiProperty() is_email_verified: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}
