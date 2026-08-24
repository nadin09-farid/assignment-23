export enum OutboxStatusEnum {
  Pending = 'pending',
  Processing = 'processing',
  Processed = 'processed',
  Failed = 'failed',
}

export enum OutboxEventTypeEnum {
  OrderCreated = 'order.created',
  OrderStatusChanged = 'order.status_changed',
}
