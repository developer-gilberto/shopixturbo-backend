import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/generated/prisma/enums';

export class UserResponseDTO {
  @ApiProperty({ example: 'a4f88155-5963-43d6-9cf1-492b8a7ac9hj', format: 'uuid' })
  id: string;
  @ApiProperty({ example: 'Gilberto Lopes' })
  name: string;
  @ApiProperty({ example: 'gilberto@example.com' })
  email: string;
  @ApiProperty({ enum: UserRole, example: 'USER' }) role: UserRole;
  @ApiProperty({ example: true }) is_email_verified: boolean;
  @ApiProperty({ type: 'string', format: 'date-time', example: '2027-04-08T03:36:06.000Z' }) created_at: Date;
  @ApiProperty({ type: 'string', format: 'date-time', example: '2027-04-08T03:36:06.000Z' }) updated_at: Date;
}
