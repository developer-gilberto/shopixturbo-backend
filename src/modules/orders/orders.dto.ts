import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { OrderStatus, TimeRangeField } from './orders.enum';

export class OrdersListDTO {
  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number(value))
  offset: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number(value))
  page_size: number;

  @IsEnum(OrderStatus)
  order_status: OrderStatus;

  @IsEnum(TimeRangeField)
  time_range_field: TimeRangeField;

  @IsInt()
  @Min(1)
  @Max(15)
  @Transform(({ value }) => Number(value))
  interval_days: number;
}

export class OrdersDetailsDTO {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return [];
      return trimmed.includes(',')
        ? trimmed
            .split(',')
            .map((v: string) => v.trim())
            .filter((v: string) => v !== '')
        : [trimmed];
    }
    if (Array.isArray(value)) {
      return value.map((v: unknown) => (typeof v === 'string' ? v.trim() : v)).filter((v: unknown) => v !== '');
    }
    return value;
  })
  @IsArray({ message: 'order_id_list deve ser um array de strings.' })
  @ArrayNotEmpty({ message: 'Você deve enviar pelo menos um order_id.' })
  @ArrayMaxSize(50, { message: 'Você pode enviar no máximo 50 order_id.' })
  @IsString({ each: true, message: 'Todos os order_id devem ser strings.' })
  @MinLength(1, { each: true, message: 'Os order_id não podem ser strings vazias.' })
  order_id_list: string[];
}
