import { IsEnum } from 'class-validator';
import { OrderStatusEnum } from 'src/common/enums/order.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  status!: OrderStatusEnum;
}
