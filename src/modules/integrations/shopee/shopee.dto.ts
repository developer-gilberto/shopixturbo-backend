import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { MarketplaceType } from 'src/generated/prisma/enums';

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

export class AuthUrlResponseDTO {
  @ApiProperty({
    example:
      'https://openplatform.sandbox.test-stable.shopee.sg/api/v2/shop/auth_partner?partner_id=1234&timestamp=1775619345&sign=30c7c850810ad73ad9f9be2ddcd95e0d7&redirect=http://frontend.com/callback',
  })
  auth_url: string;
}

export class ShopResponseDTO {
  @ApiProperty({ example: 1234 })
  id: number;

  @ApiProperty({ example: 'nome da loja' })
  name: string;

  @ApiProperty({ example: 'descrição da loja' })
  description: string;

  @ApiProperty({ example: 'https://cf.shopee.com.br/file/br-12134201-81z1k-mmdp0d7' })
  shop_logo: string;

  @ApiProperty({ enum: MarketplaceType, example: 'SHOPEE' })
  marketplace: string;

  @ApiProperty({ type: 'string', format: 'date-time', example: '2027-04-08T03:36:06.000Z' })
  authorization_expiration: Date;

  @ApiProperty({ example: 'NORMAL' })
  status: string;

  @ApiProperty({ example: 'Other' })
  invoice_issuer: string;
}

export class CallbackGetTokenResponseDTO {
  @ApiProperty({
    example: 'Loja conectada com sucesso',
  })
  message: string;

  @ApiProperty({ type: () => ShopResponseDTO })
  shop: ShopResponseDTO;
}
