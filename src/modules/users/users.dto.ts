import { SignUpDTO } from '../auth/auth.dto';

export interface User extends SignUpDTO {
  id: string;
}
