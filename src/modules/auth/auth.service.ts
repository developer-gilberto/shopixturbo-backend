import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { constants } from '../../configs';
import { UsersService } from '../users/users.service';
import { SignInDTO, SignUpDTO } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(data: SignUpDTO) {
    const emailAvailable = await this.userService.checkEmailAvailability(data.email);

    if (!emailAvailable) throw new ConflictException('Tente criar sua conta com um email diferente.');

    // implementar verificacao de email

    const salt = constants.SALT_PASSWORD;
    const hash = await bcrypt.hash(data.password, salt);

    const user = await this.userService.create({
      ...data,
      password: hash,
    });

    const payload = { user_id: user.id, user_name: user.name };

    const token = this.jwtService.sign(payload);

    return { user_auth_token: token };
  }

  async signin(data: SignInDTO) {
    const storedUser = await this.userService.getByEmail(data.email);

    if (!storedUser) throw new UnauthorizedException('Credenciais inválidas.');

    const isValidPassword = await bcrypt.compare(data.password, storedUser.password);

    if (!isValidPassword) throw new UnauthorizedException('Credenciais inválidas.');

    const payload = { user_id: storedUser.id, user_name: storedUser.name };

    const token = this.jwtService.sign(payload);

    return { user_auth_token: token };
  }
}
