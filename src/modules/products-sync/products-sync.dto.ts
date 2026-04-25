import { ApiProperty } from '@nestjs/swagger';

export class SyncProductsResponseDTO {
  @ApiProperty({ example: '123456789' })
  shop: string;

  @ApiProperty({ example: '2025-04-25T12:00:00.000Z' })
  latest_sync: Date;

  @ApiProperty({ example: 10 })
  products_inserted: number;

  @ApiProperty({ example: 5 })
  products_updated: number;
}
