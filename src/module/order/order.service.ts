import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrderRepo } from 'src/Repo/order.repo';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { IHOrder } from 'src/Models/Order.Model';
import { IHUser } from 'src/Models/user.model';
import { RoleEnum } from 'src/common/enums/user.enums';
import { OrderStatusEnum } from 'src/common/enums/order.enum';

@Injectable()
export class OrderService {
  constructor(private _orderRepo: OrderRepo) {}

  async create(dto: CreateOrderDto, user: IHUser) {
    const items = dto.items.map((item) => ({
      product: new Types.ObjectId(item.product),
      quantity: item.quantity,
    }));

    const order = await this._orderRepo.createOrderWithStockReservation({
      userId: user._id as Types.ObjectId,
      items,
      shippingAddress: dto.shippingAddress,
    });

    return { message: 'Order placed', order };
  }

  async findAll(user: IHUser) {
    // Admins see every order; regular users only ever see their own.
    const filter = user.role === RoleEnum.Admin ? {} : { user: user._id };
    return await this._orderRepo.find({ filter });
  }

  async findOne(id: string, user: IHUser) {
    const order = await this._orderRepo.findById({ id });
    if (!order) throw new NotFoundException('Order not found');

    this.assertOwnership(order, user);
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this._orderRepo.transitionStatus({
      orderId: new Types.ObjectId(id),
      newStatus: dto.status,
    });

    return { message: 'Order status updated', order };
  }

  async cancel(id: string, user: IHUser) {
    const order = await this._orderRepo.findById({ id });
    if (!order) throw new NotFoundException('Order not found');

    this.assertOwnership(order, user);

    const cancelledOrder = await this._orderRepo.transitionStatus({
      orderId: order._id as Types.ObjectId,
      newStatus: OrderStatusEnum.Cancelled,
      restoreStock: true,
    });

    return { message: 'Order cancelled', order: cancelledOrder };
  }

  private assertOwnership(order: IHOrder, user: IHUser) {
    if (
      user.role !== RoleEnum.Admin &&
      order.user.toString() !== (user._id as Types.ObjectId).toString()
    ) {
      throw new ForbiddenException('You do not own this order');
    }
  }
}
