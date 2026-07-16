import type { PushSubscriptionInput } from "../domain/entities";
import type { PushSubscriptionRepository } from "../domain/push-repository";

export class SavePushSubscription {
  private readonly repository: PushSubscriptionRepository;

  constructor(repository: PushSubscriptionRepository) {
    this.repository = repository;
  }

  execute(userId: string, input: PushSubscriptionInput): Promise<void> {
    return this.repository.upsert(userId, input);
  }
}

export class RemovePushSubscription {
  private readonly repository: PushSubscriptionRepository;

  constructor(repository: PushSubscriptionRepository) {
    this.repository = repository;
  }

  execute(userId: string, endpoint: string): Promise<void> {
    return this.repository.deleteByEndpoint(endpoint, userId);
  }
}
