import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OutboxStatusEnum } from 'src/common/enums/outbox.enum';

export interface IOutboxEvent {
  eventType: string;
  payload: Record<string, unknown>;
  status: OutboxStatusEnum;
  attempts: number;
  lastError?: string;
  processedAt?: Date;
}

export type IHOutboxEvent = HydratedDocument<IOutboxEvent>;

@Schema({ timestamps: true })
export class OutboxEvent implements IOutboxEvent {
  @Prop({ type: String, required: true })
  eventType!: string;

  // The event payload — enough data for a worker to act on it without
  // needing to re-fetch the order (orderId, userId, and whatever context
  // the specific event type needs). Stored as plain JSON, not a reference,
  // so the event stays meaningful even if the order changes further later.
  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  @Prop({
    type: String,
    enum: OutboxStatusEnum,
    default: OutboxStatusEnum.Pending,
  })
  status!: OutboxStatusEnum;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: String })
  lastError?: string;

  @Prop({ type: Date })
  processedAt?: Date;
}

const outboxSchema = SchemaFactory.createForClass(OutboxEvent);

export const outboxModel = MongooseModule.forFeature([
  { name: OutboxEvent.name, schema: outboxSchema },
]);
