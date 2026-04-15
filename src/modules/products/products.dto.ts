import { ApiProperty } from '@nestjs/swagger';
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
  page_size: number = 50;

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
