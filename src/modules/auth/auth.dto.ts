import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsHexadecimal, IsNotEmpty, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class SignUpDTO {
  @ApiProperty({ description: 'User name', example: 'Gilberto Lopes' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ description: 'User email', example: 'karine@example.com' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ description: 'User password', example: 'P@ssw0rd!123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  password: string;
}

export class SignInDTO {
  @ApiProperty({ description: 'User email', example: 'julia@example.com' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ description: 'User password', example: 'P@ssw0rd!123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  password: string;
}

export class EmailDTO {
  @ApiProperty({ description: 'User email', example: 'catiane@example.com' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;
}

export class TokenDTO {
  @ApiProperty({ description: 'Verification token', example: 'a3f1c2...' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  @IsHexadecimal({ message: 'Token inválido' })
  @Length(64, 64, { message: 'Token inválido' })
  token: string;
}
