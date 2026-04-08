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

export enum ShopStatus {
  NORMAL = 'NORMAL',
  BANNED = 'BANNED',
  FROZEN = 'FROZEN',
}

export class GetShopInfoResponseDTO {
  @ApiProperty({ example: 'nome da loja' })
  shop_name: string;

  @ApiProperty({ example: 'BR' })
  region: string;

  @ApiProperty({ enum: ShopStatus, example: ShopStatus.NORMAL })
  status: string;

  @ApiProperty({
    example: 1775619366,
    description: 'Unix timestamp de quando a loja concedeu a autorização',
  })
  auth_time: number;

  @ApiProperty({
    example: 1807155366,
    description: 'Unix timestamp de quando a autorização concedida pelo dono da loja vai expirar',
  })
  expire_time: number;
}

export class GetShopProfileResponseDTO {
  @ApiProperty({ example: 'https://cf.shopee.com.br/file/br-11134207-81z1k-mmdp0d9cwu0w1f' })
  shop_logo: string;

  @ApiProperty({ example: 'Compre mais por muito menos' })
  description: string;

  @ApiProperty({ example: 'nome da loja' })
  shop_name: string;

  @ApiProperty({
    example: 'Other',
    description:
      'A informação do emissor da fatura para a loja. Pode ser "Shopee" ou "Other" como o emissor da fatura. Isto é apenas para o vendedor do BR CNPJ.',
  })
  invoice_issuer: string;
}
