import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CallbackGetTokenDTO {
  @ApiProperty({ description: 'O código da URL de redirecionamento' })
  @IsNotEmpty({ message: 'O código da URL de redirecionamento é obrigatório' })
  @IsString({ message: 'O código da URL de redirecionamento deve ser uma string' })
  @MinLength(2, { message: 'O código da URL de redirecionamento deve ter pelo menos 2 caracteres' })
  @MaxLength(64, { message: 'O código da URL de redirecionamento deve ter no máximo 64 caracteres' })
  @Transform(({ value }) => value?.trim())
  code: string;

  @ApiProperty({ description: 'O ID da loja' })
  @IsNotEmpty({ message: 'O ID da loja é obrigatório' })
  @IsString({ message: 'O ID da loja deve ser uma string' })
  @MaxLength(255, { message: 'O ID da loja deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  shop_id: string;
}
