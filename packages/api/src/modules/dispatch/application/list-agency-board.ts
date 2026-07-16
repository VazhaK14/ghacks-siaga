import type { DispatchRepository } from "../domain/dispatch-repository";
import type { AgencyBoardItem } from "../domain/entities";
import { toDispatchTracking } from "./dispatch-rules";

export class ListAgencyBoard {
  private readonly repository: DispatchRepository;

  constructor(repository: DispatchRepository) {
    this.repository = repository;
  }

  async execute(): Promise<AgencyBoardItem[]> {
    const records = await this.repository.listAgencyBoard();

    return records.map(({ activeDispatch, agency }) => ({
      ...agency,
      activeDispatch: activeDispatch
        ? toDispatchTracking(activeDispatch)
        : null,
    }));
  }
}
