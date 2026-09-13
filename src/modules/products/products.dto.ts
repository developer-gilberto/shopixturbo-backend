import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ItemStatus } from './products.enum';

export class GetProductListQueryDTO {
  @ApiPropertyOptional({ example: 0, description: 'Offset para paginação' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @ApiPropertyOptional({ example: 20, description: 'Quantidade de itens por página (1-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size: number = 100;

  @ApiPropertyOptional({ example: 1776198667, description: 'Listar produtos atualizados a partir deste timestamp' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  update_time_from?: number;

  @ApiPropertyOptional({ example: 1776198667, description: 'Listar produtos atualizados até este timestamp' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  update_time_to?: number;

  @ApiPropertyOptional({ enum: ItemStatus, example: ItemStatus.NORMAL, description: 'Filtrar por status do item' })
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
  @ApiProperty({
    example: [885177996, 885178150],
    description: 'Lista de IDs dos produtos (máximo 50)',
  })
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

export class GetSpecificProductQueryDTO {
  @ApiProperty({
    example: '885178156',
    description: 'ID do produto (ID interno UUID ou external_id da Shopee)',
  })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório' })
  @IsString({ message: 'O ID do produto deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  product_id: string;
}

export class GetProductFullDTO {
  @ApiProperty({ example: 0, description: 'Offset para paginação' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @ApiProperty({ example: 20, description: 'Quantidade de itens por página (1-100)' })
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

export class UpdateProductCostAndTaxesDTO {
  @ApiProperty({
    example: '885178164',
    format: 'uuid',
    description: 'ID do produto',
  })
  id: string;

  @ApiProperty({
    example: 25000,
    description: 'Preço de custo em centavos',
  })
  @IsNumber()
  cost_price_cents: number;

  @ApiProperty({
    example: 500,
    description: 'Impostos governamentais em centavos',
  })
  @IsNumber()
  government_taxes: number;
}

export class ProductsUpdateCostAndTaxesDTO {
  @ApiProperty({
    type: [UpdateProductCostAndTaxesDTO],
    description: 'Lista de produtos para atualizar (máximo 100)',
  })
  @IsArray()
  @ArrayMaxSize(100, { message: 'Máximo de 100 produtos por operação' })
  @ArrayNotEmpty({ message: 'A lista de produtos não pode estar vazia' })
  @Type(() => UpdateProductCostAndTaxesDTO)
  products: UpdateProductCostAndTaxesDTO[];
}

export class UpdateProductCostAndTaxesResponseDTO {
  @ApiProperty({ example: 'a4f88155-5963-43d6-9cf1-492b8a7ac9hj', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 25000, description: 'Preço de custo em centavos' })
  cost_price_cents: number;

  @ApiProperty({ example: 500, description: 'Impostos governamentais em centavos' })
  government_taxes: number;
}

export class ProductsUpdateCostAndTaxesResponseDTO {
  @ApiProperty({ example: '3 produtos foram atualizados.', description: 'Quantidade de produtos atualizados' })
  message: number;
}
