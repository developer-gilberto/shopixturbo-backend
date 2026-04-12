import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
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

  @IsEnum(ItemStatus, { each: true })
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return undefined;
  })
  item_status: ItemStatus[];
}

// GetProductListDTO
// "response": {
//         "item": [
//             {
//                 "item_id": 892610904,
//                 "item_status": "NORMAL",
//                 "update_time": 1774731028,
//                 "tag": {
//                     "kit": false
//                 }
//             },
//             {
//                 "item_id": 892610903,
//                 "item_status": "NORMAL",
//                 "update_time": 1774730884,
//                 "tag": {
//                     "kit": false
//                 }
//             }
//         ],
//         "total_count": 10,
//         "has_next_page": false,
//         "next": ""
//     }
