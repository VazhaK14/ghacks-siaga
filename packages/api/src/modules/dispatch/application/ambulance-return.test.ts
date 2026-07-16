import { describe, expect, test } from "bun:test";

import type {
  CreateDispatchInput,
  DispatchRepository,
  ResolveDispatchInput,
  TransitionDispatchInput,
} from "../domain/dispatch-repository";
import type {
  AgencyBoardRecord,
  DispatchRecord,
  DispatchReportContext,
} from "../domain/entities";
import { AdvanceDispatchSimulation } from "./advance-dispatch-simulation";
import { ResolveDispatch } from "./resolve-dispatch";

const STARTED_AT = new Date("2026-07-16T10:00:00.000Z");

const buildAmbulanceDispatch = (
  status: DispatchRecord["status"]
): DispatchRecord => ({
  acknowledgedAt: STARTED_AT,
  agency: {
    address: "RS SIAGA",
    availability: "BUSY",
    contactPhone: "119",
    id: "ambulance-agency",
    jurisdiction: "Jakarta",
    latitude: -6.2,
    longitude: 106.8,
    name: "Ambulans SIAGA",
    type: "AMBULANCE",
  },
  arrivedAt: STARTED_AT,
  completedAt: null,
  destination: {
    address: "Lokasi laporan",
    latitude: -6.22,
    longitude: 106.84,
    title: "Darurat medis",
  },
  dispatchedByOperatorId: "operator",
  enRouteAt: STARTED_AT,
  estimatedArrivalAt: STARTED_AT,
  estimatedReturnAt:
    status === "RETURNED_TO_BASE" ? new Date("2026-07-16T10:00:20.000Z") : null,
  id: "dispatch",
  notes: null,
  reportId: "report",
  requestedAt: STARTED_AT,
  returnedAt:
    status === "RETURNED_TO_BASE" ? new Date("2026-07-16T10:00:20.000Z") : null,
  returnStartedAt: status === "RETURNED_TO_BASE" ? STARTED_AT : null,
  status,
  unitCode: "AMB-10",
});

class InMemoryDispatchRepository implements DispatchRepository {
  dispatch: DispatchRecord;
  lastTransition: TransitionDispatchInput | null = null;
  resolveCalls = 0;

  constructor(dispatch: DispatchRecord) {
    this.dispatch = dispatch;
  }

  createDispatch(_input: CreateDispatchInput): Promise<DispatchRecord> {
    throw new Error("Not implemented");
  }

  findDispatchById(_dispatchId: string): Promise<DispatchRecord | null> {
    return Promise.resolve(this.dispatch);
  }

  findReportContext(_reportId: string): Promise<DispatchReportContext | null> {
    return Promise.resolve(null);
  }

  listAgencyBoard(): Promise<AgencyBoardRecord[]> {
    return Promise.resolve([]);
  }

  resolveDispatch(input: ResolveDispatchInput): Promise<DispatchRecord> {
    this.resolveCalls += 1;
    this.dispatch = {
      ...this.dispatch,
      completedAt: input.at,
      status: "COMPLETED",
    };
    return Promise.resolve(this.dispatch);
  }

  transitionDispatch(input: TransitionDispatchInput): Promise<DispatchRecord> {
    this.lastTransition = input;
    this.dispatch = {
      ...this.dispatch,
      estimatedReturnAt:
        input.estimatedReturnAt ?? this.dispatch.estimatedReturnAt,
      returnStartedAt:
        input.nextStatus === "RETURNING_TO_BASE"
          ? input.at
          : this.dispatch.returnStartedAt,
      status: input.nextStatus,
    };
    return Promise.resolve(this.dispatch);
  }
}

describe("ambulance return flow", () => {
  test("starts the return trip after the ambulance handles the scene", async () => {
    const repository = new InMemoryDispatchRepository(
      buildAmbulanceDispatch("ARRIVED")
    );
    const useCase = new AdvanceDispatchSimulation(repository);
    const transitionAt = new Date("2026-07-16T10:00:04.000Z");

    const tracking = await useCase.execute("dispatch", transitionAt);

    expect(repository.lastTransition?.nextStatus).toBe("RETURNING_TO_BASE");
    expect(repository.lastTransition?.nextReportStatus).toBeNull();
    expect(repository.lastTransition?.estimatedReturnAt?.toISOString()).toBe(
      "2026-07-16T10:00:24.000Z"
    );
    expect(tracking.status).toBe("RETURNING_TO_BASE");
    expect(tracking.canResolve).toBe(false);
  });

  test("rejects resolution until the ambulance returns to base", async () => {
    const repository = new InMemoryDispatchRepository(
      buildAmbulanceDispatch("ARRIVED")
    );
    const useCase = new ResolveDispatch(repository);

    await expect(
      useCase.execute({
        dispatchId: "dispatch",
        operatorId: "operator",
      })
    ).rejects.toThrow("kembali ke rumah sakit");
    expect(repository.resolveCalls).toBe(0);

    repository.dispatch = buildAmbulanceDispatch("RETURNED_TO_BASE");
    const resolved = await useCase.execute({
      dispatchId: "dispatch",
      operatorId: "operator",
    });

    expect(repository.resolveCalls).toBe(1);
    expect(resolved.status).toBe("COMPLETED");
  });
});
