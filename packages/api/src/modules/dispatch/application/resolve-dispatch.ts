import type { DispatchRepository } from "../domain/dispatch-repository";
import {
  DispatchApplicationError,
  type DispatchTracking,
} from "../domain/entities";
import { toDispatchTracking } from "./dispatch-rules";

export class ResolveDispatch {
  private readonly repository: DispatchRepository;

  constructor(repository: DispatchRepository) {
    this.repository = repository;
  }

  async execute({
    dispatchId,
    operatorId,
  }: {
    dispatchId: string;
    operatorId: string;
  }): Promise<DispatchTracking> {
    const dispatch = await this.repository.findDispatchById(dispatchId);
    if (!dispatch) {
      throw new DispatchApplicationError(
        "NOT_FOUND",
        "Dispatch tidak ditemukan"
      );
    }
    if (dispatch.status !== "ARRIVED") {
      throw new DispatchApplicationError(
        "BAD_REQUEST",
        "Laporan hanya dapat diselesaikan setelah unit tiba"
      );
    }

    const completedAt = new Date();
    const resolvedDispatch = await this.repository.resolveDispatch({
      at: completedAt,
      dispatchId,
      operatorId,
    });

    return toDispatchTracking(resolvedDispatch, completedAt);
  }
}
