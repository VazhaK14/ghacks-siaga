export type OfflineCallLiveEventType =
  | "offline-call.created"
  | "offline-call.accepted"
  | "offline-call.transcript"
  | "offline-call.ended";

export interface OfflineCallLiveEvent {
  callId: string;
  occurredAt: string;
  type: OfflineCallLiveEventType;
}

type EventListener = (event: OfflineCallLiveEvent) => void;

const listeners = new Set<EventListener>();

export const publishOfflineCallLiveEvent = (
  event: Omit<OfflineCallLiveEvent, "occurredAt">
): void => {
  const completeEvent = {
    ...event,
    occurredAt: new Date().toISOString(),
  };
  for (const listener of listeners) {
    listener(completeEvent);
  }
};

export const subscribeToOfflineCallLiveEvents = (
  listener: EventListener
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
