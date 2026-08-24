import { OrderStatusEnum } from 'src/common/enums/order.enum';

/**
 * Defines which status an order is allowed to move to next.
 * An order can never skip states (e.g. Pending -> Shipped) or move
 * backwards (e.g. Delivered -> Paid). Any transition not listed here
 * is rejected by OrderService.updateStatus.
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<
  OrderStatusEnum,
  OrderStatusEnum[]
> = {
  [OrderStatusEnum.Pending]: [OrderStatusEnum.Paid, OrderStatusEnum.Cancelled],
  [OrderStatusEnum.Paid]: [OrderStatusEnum.Shipped, OrderStatusEnum.Cancelled],
  [OrderStatusEnum.Shipped]: [OrderStatusEnum.Delivered],
  [OrderStatusEnum.Delivered]: [],
  [OrderStatusEnum.Cancelled]: [],
};
