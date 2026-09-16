import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import DBRepo from './db.repo';
import { IHOrder, IOrder, IOrderItem, Order } from 'src/Models/Order.Model';
import { Product } from 'src/Models/Product.Model';
import { OrderStatusEnum } from 'src/common/enums/order.enum';
import { OutboxEventTypeEnum } from 'src/common/enums/outbox.enum';
import { ALLOWED_ORDER_TRANSITIONS } from 'src/common/utils/order-status.transitions';
import { OutboxRepo } from './outbox.repo';

interface OrderItemInput {
  product: Types.ObjectId;
  quantity: number;
}

@Injectable()
export class OrderRepo extends DBRepo<IOrder> {
  constructor(
    @InjectModel(Order.name) private _orderModel: Model<Order>,
    @InjectModel(Product.name) private _productModel: Model<Product>,
    @InjectConnection() private _connection: Connection,
    private _outboxRepo: OutboxRepo,
  ) {
    super(_orderModel);
  }

  /**
   * Creates an order and decrements stock for every item as a single
   * all-or-nothing operation, and records an "order.created" outbox event
   * in the same transaction (see OutboxRepo.recordEvent for why that
   * matters).
   *
   * Why $gte in the filter: `findOneAndUpdate` with `stock: { $gte: qty }`
   * is atomic at the database level — Mongo guarantees only one of two
   * concurrent requests for the last item in stock will match and succeed.
   * There's no "check then act" gap for a race to slip into.
   *
   * Note: transactions require MongoDB to be running as a replica set
   * (a single local `mongod` won't support them) — MongoDB Atlas has this
   * enabled by default.
   */
  async createOrderWithStockReservation({
    userId,
    items,
    shippingAddress,
  }: {
    userId: Types.ObjectId;
    items: OrderItemInput[];
    shippingAddress: string;
  }): Promise<IHOrder> {
    const session = await this._connection.startSession();
    let order!: IHOrder;

    try {
      await session.withTransaction(async () => {
        const orderItems: IOrderItem[] = [];
        let totalPrice = 0;

        for (const item of items) {
          const product = await this._productModel.findOneAndUpdate(
            {
              _id: item.product,
              isActive: true,
              stock: { $gte: item.quantity },
            },
            { $inc: { stock: -item.quantity } },
            { session, returnDocument: 'after' },
          );

          if (!product) {
            throw new BadRequestException(
              `Product ${item.product.toString()} is unavailable, inactive, or doesn't have enough stock`,
            );
          }

          const unitPrice = product.priceAfterDiscount;
          totalPrice += unitPrice * item.quantity;

          orderItems.push({
            product: item.product,
            quantity: item.quantity,
            unitPrice,
          });
        }

        const [createdOrder] = await this._orderModel.create(
          [
            {
              user: userId,
              items: orderItems,
              totalPrice,
              shippingAddress,
              status: OrderStatusEnum.Pending,
            },
          ],
          { session },
        );

        await this._outboxRepo.recordEvent({
          eventType: OutboxEventTypeEnum.OrderCreated,
          payload: {
            orderId: createdOrder._id,
            userId,
            totalPrice,
          },
          session,
        });

        order = createdOrder;
      });
    } finally {
      await session.endSession();
    }

    return order;
  }

  private async restoreStock(items: IOrderItem[], session: ClientSession) {
    if (!items.length) return;

    await this._productModel.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } },
        },
      })),
      { session },
    );
  }

  /**
   * Moves an order to a new status — enforcing the state machine, restoring
   * stock when cancelling, and recording an "order.status_changed" outbox
   * event, all inside one transaction.
   *
   * The transition check happens here (against a freshly-locked read),
   * not just in the service before calling this — that closes a race where
   * two requests (e.g. an admin marking "Shipped" and a user cancelling)
   * could otherwise both pass validation against stale data and both
   * attempt to write.
   */
  async transitionStatus({
    orderId,
    newStatus,
    restoreStock = false,
  }: {
    orderId: Types.ObjectId;
    newStatus: OrderStatusEnum;
    restoreStock?: boolean;
  }): Promise<IHOrder> {
    const session = await this._connection.startSession();
    let order!: IHOrder;

    try {
      await session.withTransaction(async () => {
        const found = await this._orderModel.findById(orderId).session(session);
        if (!found) {
          throw new NotFoundException('Order not found');
        }

        const allowedNextStatuses = ALLOWED_ORDER_TRANSITIONS[found.status];
        if (!allowedNextStatuses.includes(newStatus)) {
          throw new BadRequestException(
            `Cannot move order from "${found.status}" to "${newStatus}"`,
          );
        }

        if (restoreStock) {
          await this.restoreStock(found.items, session);
        }

        const previousStatus = found.status;
        found.status = newStatus;
        await found.save({ session });

        await this._outboxRepo.recordEvent({
          eventType: OutboxEventTypeEnum.OrderStatusChanged,
          payload: {
            orderId: found._id,
            userId: found.user,
            previousStatus,
            newStatus,
          },
          session,
        });

        order = found;
      });
    } finally {
      await session.endSession();
    }

    return order;
  }
}
