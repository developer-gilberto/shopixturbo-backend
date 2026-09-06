import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { OrderStatus, TimeRangeField } from './orders.enum';

export class OrdersListDTO {
  @ApiProperty({ example: 0, description: 'Offset para paginação' })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number(value))
  offset: number;

  @ApiProperty({ example: 20, description: 'Quantidade de itens por página (1-100)' })
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number(value))
  page_size: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.READY_TO_SHIP, description: 'Filtrar por status do pedido' })
  @IsEnum(OrderStatus)
  order_status: OrderStatus;

  @ApiProperty({
    enum: TimeRangeField,
    example: TimeRangeField.CREATE_TIME,
    description: 'Campo de tempo para filtrar',
  })
  @IsEnum(TimeRangeField)
  time_range_field: TimeRangeField;

  @ApiProperty({ example: 7, description: 'Intervalo em dias para filtrar por tempo (1-15)' })
  @IsInt()
  @Min(1)
  @Max(15)
  @Transform(({ value }) => Number(value))
  interval_days: number;
}

export class OrdersDetailsDTO {
  @ApiProperty({
    example: ['260426RTQ27DRJ', '260426RTQ27DRH'],
    description: 'Lista de IDs dos pedidos (máximo 50)',
  })
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

export class OrderListItemDTO {
  @ApiProperty({ example: '260426RTQ27DRJ' })
  order_sn: string;

  @ApiProperty({ example: '' })
  booking_sn: string;
}

export class OrderListResponseDTO {
  @ApiProperty({ example: false })
  more: boolean;

  @ApiProperty({ example: '20' })
  next_cursor: string;

  @ApiProperty({ type: [OrderListItemDTO] })
  order_list: OrderListItemDTO[];
}
