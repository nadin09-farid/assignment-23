import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import DBRepo from './db.repo';
import { IOutboxEvent, OutboxEvent } from 'src/Models/Outbox.Model';
import { OutboxStatusEnum } from 'src/common/enums/outbox.enum';

const MAX_ATTEMPTS = 5;

@Injectable()
export class OutboxRepo extends DBRepo<IOutboxEvent> {
  constructor(
    @InjectModel(OutboxEvent.name) private _outboxModel: Model<OutboxEvent>,
  ) {
    super(_outboxModel);
  }

  /**
   * Writes an outbox event. MUST be called with the same `session` as the
   * business-data write it accompanies (e.g. the order creation/status
   * change) — that's what makes this "outbox pattern" rather than just
   * "a log table": the event and the state change either both commit
   * together, or neither does. There's no window where the order exists
   * but the event doesn't (or vice versa).
   */
  async recordEvent({
    eventType,
    payload,
    session,
  }: {
    eventType: string;
    payload: Record<string, unknown>;
    session: ClientSession;
  }) {
    const [event] = await this._outboxModel.create(
      [{ eventType, payload, status: OutboxStatusEnum.Pending, attempts: 0 }],
      { session },
    );
    return event;
  }

  /**
   * Atomically claims the oldest pending (or previously-failed, under the
   * retry cap) event for processing. The findOneAndUpdate here is a single
   * atomic operation — if two worker instances poll at the same moment,
   * only one of them can match and flip a given event to "Processing".
   * The other gets null and moves on to the next poll. This is what lets
   * you safely run more than one worker process without double-sending
   * the same notification.
   */
  async claimNextEvent() {
    return this._outboxModel.findOneAndUpdate(
      {
        status: { $in: [OutboxStatusEnum.Pending, OutboxStatusEnum.Failed] },
        attempts: { $lt: MAX_ATTEMPTS },
      },
      {
        $set: { status: OutboxStatusEnum.Processing },
        $inc: { attempts: 1 },
      },
      { sort: { createdAt: 1 }, new: true },
    );
  }

  async markProcessed(id: Types.ObjectId) {
    await this._outboxModel.updateOne(
      { _id: id },
      { $set: { status: OutboxStatusEnum.Processed, processedAt: new Date() } },
    );
  }

  async markFailed(id: Types.ObjectId, error: string) {
    await this._outboxModel.updateOne(
      { _id: id },
      { $set: { status: OutboxStatusEnum.Failed, lastError: error } },
    );
  }
}
