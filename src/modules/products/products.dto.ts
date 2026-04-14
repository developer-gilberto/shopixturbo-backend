import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
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
