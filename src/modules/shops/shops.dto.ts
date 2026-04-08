import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetShopDTO {
  @ApiProperty({ description: 'O ID da loja' })
  @IsNotEmpty({ message: 'O ID da loja é obrigatório' })
  @IsString({ message: 'O ID da loja deve ser uma string' })
  @MaxLength(255, { message: 'O ID da loja deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  shop_id: string;
}
