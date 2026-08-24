import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatusEnum } from 'src/common/enums/order.enum';
import { User } from './user.model';
import { Product } from './Product.Model';

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  // Snapshot of Product.priceAfterDiscount at the moment of purchase.
  // We NEVER recompute this from the live product later — prices can
  // change after an order is placed, and the customer paid this price.
  unitPrice: number;
}

export interface IStatusHistoryEntry {
  status: OrderStatusEnum;
  changedAt: Date;
}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: OrderStatusEnum;
  shippingAddress: string;
  statusHistory: IStatusHistoryEntry[];
}

export type IHOrder = HydratedDocument<IOrder>;

@Schema({ _id: false })
export class OrderItemSchema implements IOrderItem {
  @Prop({ type: Types.ObjectId, required: true, ref: Product.name })
  product!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true })
  unitPrice!: number;
}

@Schema({ _id: false })
export class StatusHistoryEntrySchema implements IStatusHistoryEntry {
  @Prop({ type: String, enum: OrderStatusEnum, required: true })
  status!: OrderStatusEnum;

  @Prop({ type: Date, default: () => new Date() })
  changedAt!: Date;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Order implements IOrder {
  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  user!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: IOrderItem[];

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice!: number;

  @Prop({
    type: String,
    enum: OrderStatusEnum,
    default: OrderStatusEnum.Pending,
  })
  status!: OrderStatusEnum;

  @Prop({ type: String, required: true })
  shippingAddress!: string;

  // Every status change is appended here automatically (see pre-save hook
  // below). Gives you a free audit trail: "when did this order get paid,
  // shipped, cancelled" without needing a separate events table.
  @Prop({ type: [StatusHistoryEntrySchema], default: [] })
  statusHistory!: IStatusHistoryEntry[];
}

const orderSchema = SchemaFactory.createForClass(Order);

orderSchema.pre('save', function (this: IHOrder) {
  if (this.isNew || this.isModified('status')) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
});

export const orderModel = MongooseModule.forFeature([
  { name: Order.name, schema: orderSchema },
]);
