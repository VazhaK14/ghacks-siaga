import type { DispatchRepository } from "../domain/dispatch-repository";
import type { DispatchTracking } from "../domain/entities";
import { toDispatchTracking } from "./dispatch-rules";

const TRANSITIONS = {
  ACKNOWLEDGED: {
    nextReportStatus: "HELP_EN_ROUTE",
    nextStatus: "EN_ROUTE",
    note: "Unit respons berangkat menuju lokasi laporan",
  },
  EN_ROUTE: {
    nextReportStatus: "HELP_ARRIVED",
    nextStatus: "ARRIVED",
    note: "Unit respons tiba di lokasi laporan",
  },
  REQUESTED: {
    nextReportStatus: "DISPATCHED",
    nextStatus: "ACKNOWLEDGED",
    note: "Permintaan dispatch diterima oleh unit respons",
  },
} as const;

export class AdvanceDispatchSimulation {
  private readonly repository: DispatchRepository;

  constructor(repository: DispatchRepository) {
    this.repository = repository;
  }

  async execute(
    dispatchId: string,
    at = new Date()
  ): Promise<DispatchTracking> {
    const dispatch = await this.repository.findDispatchById(dispatchId);
    if (!dispatch) {
      throw new Error("Dispatch not found");
    }

    if (
      dispatch.status === "ARRIVED" ||
      dispatch.status === "COMPLETED" ||
      dispatch.status === "CANCELLED"
    ) {
      return toDispatchTracking(dispatch, at);
    }

    const transition = TRANSITIONS[dispatch.status];
    const updatedDispatch = await this.repository.transitionDispatch({
      at,
      dispatchId,
      expectedStatus: dispatch.status,
      nextReportStatus: transition.nextReportStatus,
      nextStatus: transition.nextStatus,
      note: transition.note,
    });

    return toDispatchTracking(updatedDispatch, at);
  }
}
