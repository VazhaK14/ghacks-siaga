import { describe, expect, test } from "bun:test";

import { getDispatchBlockReason } from "./dispatch-eligibility";

describe("dispatch eligibility", () => {
  test("allows every nonterminal report without an active dispatch", () => {
    for (const status of [
      "SUBMITTED",
      "AI_GATHERING",
      "READY_FOR_REVIEW",
      "DISPATCH_PENDING",
      "DISPATCHED",
      "HELP_EN_ROUTE",
      "HELP_ARRIVED",
    ]) {
      expect(
        getDispatchBlockReason({
          hasActiveDispatch: false,
          latitude: -6.2,
          longitude: 106.8,
          status,
        })
      ).toBeNull();
    }
  });

  test("blocks terminal reports", () => {
    for (const status of ["RESOLVED", "CLOSED", "CANCELLED"]) {
      expect(
        getDispatchBlockReason({
          hasActiveDispatch: false,
          latitude: -6.2,
          longitude: 106.8,
          status,
        })
      ).toContain("terminal");
    }
  });

  test("blocks reports that already have an active dispatch", () => {
    expect(
      getDispatchBlockReason({
        hasActiveDispatch: true,
        latitude: -6.2,
        longitude: 106.8,
        status: "HELP_EN_ROUTE",
      })
    ).toContain("dispatch aktif");
  });

  test("blocks reports without coordinates", () => {
    expect(
      getDispatchBlockReason({
        hasActiveDispatch: false,
        latitude: null,
        longitude: null,
        status: "READY_FOR_REVIEW",
      })
    ).toContain("Lokasi");
  });
});
