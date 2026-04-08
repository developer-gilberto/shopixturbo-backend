import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MarketplaceType, ShopStatus } from 'src/generated/prisma/enums';

export class GetShopDTO {
  @ApiProperty({ description: 'O ID da loja' })
  @IsNotEmpty({ message: 'O ID da loja é obrigatório' })
  @IsString({ message: 'O ID da loja deve ser uma string' })
  @MaxLength(255, { message: 'O ID da loja deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  shop_id: string;
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

export class ShopFullResponseDTO {
  @ApiProperty({ description: 'ID da loja', example: 1234 })
  id: string;

  @ApiProperty({ example: 'nome da loja' })
  name: string;

  @ApiProperty({ example: 'https://cf.shopee.com.br/file/br-11134207-81z1k-mmdp0d9cwu0w1f' })
  shop_logo: string;

  @ApiProperty({ example: 'Compre mais por muito menos' })
  description: string;

  @ApiProperty({
    example: 'Other',
    description:
      'A informação do emissor da fatura para a loja. Pode ser "Shopee" ou "Other" como o emissor da fatura. Isto é apenas para o vendedor do BR CNPJ.',
  })
  invoice_issuer: string;

  @ApiProperty({
    description: 'Marketplace: SHOPEE, AMAZON, MERCADO_LIVRE ',
    enum: MarketplaceType,
    example: MarketplaceType.SHOPEE,
  })
  marketplace: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2027-04-08T03:36:06.000Z',
    description: 'Data de quando a autorização concedida pelo dono da loja vai expirar',
  })
  authorization_expiration: Date;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2027-04-08T03:36:06.000Z',
    description: 'Data de quando a loja concedeu a autorização',
  })
  authorized_in: Date;

  @ApiProperty({ enum: ShopStatus, example: ShopStatus.NORMAL, description: 'Status da loja: NORMAL, BANNED, FROZEN' })
  status: string;

  @ApiProperty({ example: 'BR' })
  region: string;
}
