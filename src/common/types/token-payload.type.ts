import { UserRole } from 'src/generated/prisma/enums';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_email_verified: boolean;
  iat?: number;
  exp?: number;
}
