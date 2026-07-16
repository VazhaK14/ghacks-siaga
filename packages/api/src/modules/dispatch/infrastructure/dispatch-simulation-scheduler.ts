import type { DispatchTracking } from "../domain/entities";

const ACCEPTANCE_DELAY_MS = 2000;
const DEPARTURE_DELAY_MS = 2000;
const ON_SCENE_HANDLING_DELAY_MS = 4000;
const RETRY_DELAY_MS = 1000;

type AdvanceDispatch = (dispatchId: string) => Promise<DispatchTracking>;
type PublishDispatch = (
  dispatch: DispatchTracking,
  eventType: "dispatch.updated" | "dispatch.arrived"
) => Promise<void>;

export class DispatchSimulationScheduler {
  private readonly advanceDispatch: AdvanceDispatch;
  private readonly publishDispatch: PublishDispatch;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    advanceDispatch: AdvanceDispatch,
    publishDispatch: PublishDispatch
  ) {
    this.advanceDispatch = advanceDispatch;
    this.publishDispatch = publishDispatch;
  }

  cancel(dispatchId: string): void {
    const timer = this.timers.get(dispatchId);
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    this.timers.delete(dispatchId);
  }

  resume(dispatch: DispatchTracking): void {
    const existingTimer = this.timers.get(dispatch.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(dispatch.id);
    }

    const nextAt = this.getNextTransitionAt(dispatch);
    if (!nextAt) {
      return;
    }

    const delay = Math.max(0, nextAt.getTime() - Date.now());
    const timer = setTimeout(async () => {
      this.timers.delete(dispatch.id);
      try {
        const updatedDispatch = await this.advanceDispatch(dispatch.id);
        await this.publishDispatch(
          updatedDispatch,
          updatedDispatch.status === "ARRIVED"
            ? "dispatch.arrived"
            : "dispatch.updated"
        );
        this.resume(updatedDispatch);
      } catch {
        const retryTimer = setTimeout(() => {
          this.timers.delete(dispatch.id);
          this.resume(dispatch);
        }, RETRY_DELAY_MS);
        retryTimer.unref?.();
        this.timers.set(dispatch.id, retryTimer);
      }
    }, delay);
    timer.unref?.();
    this.timers.set(dispatch.id, timer);
  }

  private getNextTransitionAt(dispatch: DispatchTracking): Date | null {
    if (dispatch.status === "REQUESTED") {
      return new Date(
        new Date(dispatch.requestedAt).getTime() + ACCEPTANCE_DELAY_MS
      );
    }
    if (dispatch.status === "ACKNOWLEDGED" && dispatch.acknowledgedAt) {
      return new Date(
        new Date(dispatch.acknowledgedAt).getTime() + DEPARTURE_DELAY_MS
      );
    }
    if (dispatch.status === "EN_ROUTE" && dispatch.estimatedArrivalAt) {
      return new Date(dispatch.estimatedArrivalAt);
    }
    if (
      dispatch.status === "ARRIVED" &&
      dispatch.agency.type === "AMBULANCE" &&
      dispatch.arrivedAt
    ) {
      return new Date(
        new Date(dispatch.arrivedAt).getTime() + ON_SCENE_HANDLING_DELAY_MS
      );
    }
    if (dispatch.status === "RETURNING_TO_BASE" && dispatch.estimatedReturnAt) {
      return new Date(dispatch.estimatedReturnAt);
    }

    return null;
  }
}
