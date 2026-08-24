import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { OutboxRepo } from 'src/Repo/outbox.repo';
import { UserRepo } from 'src/Repo/user.repo';
import { EmailService } from 'src/common/services/email/email.service';
import { OutboxEventTypeEnum } from 'src/common/enums/outbox.enum';

interface OrderCreatedPayload {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  totalPrice: number;
}

interface OrderStatusChangedPayload {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  previousStatus: string;
  newStatus: string;
}

/**
 * The relay half of the outbox pattern.
 *
 * OrderRepo guarantees an event is durably recorded the instant the order
 * data changes (same transaction, so it can never be lost or "forgotten"
 * by a crash). This worker's only job is to eventually notice that event
 * and act on it — retrying on failure instead of giving up.
 *
 * This is a simple poll loop, which is perfectly fine at small/medium
 * scale. If this needed to scale further, you'd swap the "claim + do the
 * work inline" step for "claim + push onto a BullMQ/Kafka queue" — the
 * claim/process/mark-done contract stays identical either way, so nothing
 * else in the codebase has to change.
 */
@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;

  constructor(
    private _outboxRepo: OutboxRepo,
    private _userRepo: UserRepo,
    private _emailService: EmailService,
  ) {}

  @Interval(5000)
  async processNext() {
    // Guards against a slow event still running when the next tick fires.
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const event = await this._outboxRepo.claimNextEvent();
      if (!event) return;

      try {
        await this.dispatch(event.eventType, event.payload);
        await this._outboxRepo.markProcessed(event._id as Types.ObjectId);
      } catch (error) {
        this.logger.error(
          `Failed to process outbox event ${String(event._id)} (${event.eventType})`,
          error instanceof Error ? error.stack : String(error),
        );
        await this._outboxRepo.markFailed(
          event._id as Types.ObjectId,
          error instanceof Error ? error.message : String(error),
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async dispatch(eventType: string, payload: Record<string, unknown>) {
    switch (eventType) {
      case OutboxEventTypeEnum.OrderCreated:
        return this.notifyOrderCreated(payload as unknown as OrderCreatedPayload);
      case OutboxEventTypeEnum.OrderStatusChanged:
        return this.notifyStatusChanged(
          payload as unknown as OrderStatusChangedPayload,
        );
      default:
        // An unknown event type is a bug (or a newer worker version
        // running against an older schema) — fail loudly rather than
        // silently dropping it, so it shows up as "Failed" for investigation.
        throw new Error(`Unknown outbox event type: ${eventType}`);
    }
  }

  private async notifyOrderCreated(payload: OrderCreatedPayload) {
    const user = await this._userRepo.findById({ id: payload.userId });
    if (!user) return; // user deleted after ordering — nothing to notify

    await this._emailService.sendMail({
      to: user.email,
      subject: 'Order Confirmation',
      html: `<h1>Thanks for your order!</h1><p>Order ${String(
        payload.orderId,
      )} for $${payload.totalPrice.toFixed(2)} has been received.</p>`,
    });
  }

  private async notifyStatusChanged(payload: OrderStatusChangedPayload) {
    const user = await this._userRepo.findById({ id: payload.userId });
    if (!user) return;

    await this._emailService.sendMail({
      to: user.email,
      subject: 'Order Status Updated',
      html: `<h1>Order update</h1><p>Order ${String(
        payload.orderId,
      )} moved from "${payload.previousStatus}" to "${payload.newStatus}".</p>`,
    });
  }
}
