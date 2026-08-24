import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { RoleEnum } from 'src/common/enums/user.enums';
import type { IHUser } from 'src/Models/user.model';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Auth({ roles: [RoleEnum.User, RoleEnum.Admin] })
  @Post()
  create(@Body() dto: CreateOrderDto, @User() user: IHUser) {
    return this.orderService.create(dto, user);
  }

  @Auth({ roles: [RoleEnum.User, RoleEnum.Admin] })
  @Get()
  findAll(@User() user: IHUser) {
    return this.orderService.findAll(user);
  }

  @Auth({ roles: [RoleEnum.User, RoleEnum.Admin] })
  @Get(':id')
  findOne(@Param('id') id: string, @User() user: IHUser) {
    return this.orderService.findOne(id, user);
  }

  // Only admins move an order through pending -> paid -> shipped -> delivered.
  // (Paid would normally be set automatically by a payment webhook handler
  // rather than a human calling this route directly - see roadmap step 4.)
  @Auth({ roles: [RoleEnum.Admin] })
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }

  // A user can cancel their own order (if it's still cancellable);
  // an admin can cancel anyone's.
  @Auth({ roles: [RoleEnum.User, RoleEnum.Admin] })
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @User() user: IHUser) {
    return this.orderService.cancel(id, user);
  }
}
