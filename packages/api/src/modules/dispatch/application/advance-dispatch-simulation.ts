import type { DispatchRepository } from "../domain/dispatch-repository";
import type { DispatchRecord, DispatchTracking } from "../domain/entities";
import { getDemoEstimatedReturnAt, toDispatchTracking } from "./dispatch-rules";

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

const getTransition = (dispatch: DispatchRecord, at: Date) => {
  if (dispatch.status === "ARRIVED" && dispatch.agency.type === "AMBULANCE") {
    return {
      estimatedReturnAt: getDemoEstimatedReturnAt(at),
      nextReportStatus: null,
      nextStatus: "RETURNING_TO_BASE",
      note: "Ambulans kembali menuju rumah sakit",
    } as const;
  }
  if (dispatch.status === "RETURNING_TO_BASE") {
    return {
      nextReportStatus: null,
      nextStatus: "RETURNED_TO_BASE",
      note: "Ambulans telah kembali ke rumah sakit",
    } as const;
  }
  if (
    dispatch.status === "REQUESTED" ||
    dispatch.status === "ACKNOWLEDGED" ||
    dispatch.status === "EN_ROUTE"
  ) {
    return TRANSITIONS[dispatch.status];
  }

  return null;
};

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

    const transition = getTransition(dispatch, at);
    if (!transition) {
      return toDispatchTracking(dispatch, at);
    }

    const updatedDispatch = await this.repository.transitionDispatch({
      at,
      dispatchId,
      estimatedReturnAt:
        "estimatedReturnAt" in transition
          ? transition.estimatedReturnAt
          : undefined,
      expectedStatus: dispatch.status,
      nextReportStatus: transition.nextReportStatus,
      nextStatus: transition.nextStatus,
      note: transition.note,
    });

    return toDispatchTracking(updatedDispatch, at);
  }
}
