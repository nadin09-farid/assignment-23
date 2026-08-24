import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { orderModel } from 'src/Models/Order.Model';
import { productModel } from 'src/Models/Product.Model';
import { outboxModel } from 'src/Models/Outbox.Model';
import { OrderRepo } from 'src/Repo/order.repo';
import { OutboxRepo } from 'src/Repo/outbox.repo';
import { OutboxProcessorService } from './outbox-processor.service';
import { SharedModule } from 'src/common/module/shared.module';
import { EmailService } from 'src/common/services/email/email.service';
import { SecurityService } from 'src/common/services/security/security.service';

@Module({
  imports: [SharedModule, orderModel, productModel, outboxModel],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepo,
    OutboxRepo,
    OutboxProcessorService,
    // EmailService needs SecurityService, which isn't a @Global module here —
    // AuthModule follows the same pattern of re-providing it locally.
    EmailService,
    SecurityService,
  ],
})
export class OrderModule {}
