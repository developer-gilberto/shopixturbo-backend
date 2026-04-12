import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { GetProductListQueryDTO } from 'src/modules/products/products.dto';

@Injectable()
export class DateRangeValidationPipe implements PipeTransform<GetProductListQueryDTO> {
  transform(value: GetProductListQueryDTO) {
    const { update_time_from, update_time_to } = value;

    if (update_time_from && update_time_to && update_time_from > update_time_to) {
      throw new BadRequestException('update_time_from deve ser menor ou igual a update_time_to');
    }

    return value;
  }
}
