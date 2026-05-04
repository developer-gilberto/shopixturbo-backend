import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ItemStatus } from './products.enum';

export class GetProductListQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size: number = 100;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  update_time_from?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  update_time_to?: number;

  @IsOptional()
  @IsEnum(ItemStatus)
  item_status: ItemStatus;
}

export class ProductTagDTO {
  @ApiProperty({ example: false })
  kit: boolean;
}

export class ProductItemDTO {
  @ApiProperty({ example: 885177996 })
  item_id: number;

  @ApiProperty({
    enum: ItemStatus,
    example: ItemStatus.NORMAL,
  })
  item_status: ItemStatus;

  @ApiProperty({
    example: 1776198667,
    description: 'Unix timestamp em segundos',
  })
  update_time: number;

  @ApiProperty({ type: () => ProductTagDTO })
  tag: ProductTagDTO;
}

export class GetProductListResponseDTO {
  @ApiProperty({
    type: () => [ProductItemDTO],
  })
  item: ProductItemDTO[];

  @ApiProperty({ example: 11 })
  total_count: number;

  @ApiProperty({ example: false })
  has_next_page: boolean;

  @ApiProperty({ example: 50 })
  next_offset: number;

  @ApiProperty({
    example: '',
  })
  next: string;
}

export class GetProductInfoDTO {
  @Transform(({ value }) => {
    if (typeof value !== 'string') return [];

    return value
      .split(',')
      .map((v: string) => v.trim())
      .filter((v: string) => v !== '')
      .map((v: string) => Number(v));
  })
  @IsArray({ message: 'item_id_list deve ser um array de números inteiros.' })
  @ArrayNotEmpty({ message: 'item_id_list não deve ser vazio.' })
  @ArrayMaxSize(50, { message: 'item_id_list deve ter no máximo 50 item_id.' })
  @IsInt({ each: true, message: 'Todos os item_id devem ser números inteiros.' })
  @Min(1, { each: true, message: 'Todos os item_id devem ser maiores que 0.' })
  item_id_list: number[];
}

export class GetProductFullDTO {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size: number = 100;
}

export class PaginationDTO {
  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Offset para a próxima página',
  })
  next_offset: number | null;

  @ApiProperty({ example: false })
  has_next_page: boolean;

  @ApiProperty({ example: 16 })
  total_products: number;
}

export class ProductResponseDTO {
  @ApiProperty({
    example: 'a4f88155-5963-43d6-9cf1-492b8a7ac9hj',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ example: 'SHOPEE' })
  marketplace: string;

  @ApiProperty({ example: 106532 })
  category_id: number;

  @ApiProperty({ example: 'Mesa 4 cadeiras' })
  name: string;

  @ApiProperty({ example: 'mesa-sku' })
  sku: string;

  @ApiProperty({
    example: 'https://cf.shopee.com.br/file/br-11134207-81z1k-mngb6gk43r40jj',
  })
  image_url: string;

  @ApiProperty({ example: 46 })
  stock: number;

  @ApiProperty({ example: 53079, description: 'Preço de venda em centavos' })
  sale_price_cents: number;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Preço de custo em centavos',
  })
  cost_price_cents: number | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Impostos governamentais',
  })
  government_taxes: number | null;

  @ApiProperty({ example: '885178156' })
  external_id: string;

  @ApiProperty({ example: '2026-04-24T22:04:40.000Z', format: 'date-time' })
  external_created_at: string;

  @ApiProperty({ example: '2026-04-25T16:04:38.000Z', format: 'date-time' })
  external_updated_at: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_at: string | null;

  @ApiProperty({ example: '2026-04-25T21:58:56.633Z', format: 'date-time' })
  created_at: string;

  @ApiProperty({ example: '2026-04-25T21:58:56.633Z', format: 'date-time' })
  updated_at: string;

  @ApiProperty({
    example: '1ee279c8-fdaf-4d4c-af5b-5a23ec23a2jj',
    format: 'uuid',
  })
  shop_id: string;
}

export class ProductsFullResponseDTO {
  @ApiProperty({ type: PaginationDTO })
  pagination: PaginationDTO;

  @ApiProperty({ type: [ProductResponseDTO] })
  products: ProductResponseDTO[];
}
