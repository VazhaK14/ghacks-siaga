import { describe, expect, test } from "bun:test";
import dotenv from "dotenv";

dotenv.config({ path: "apps/server/.env" });

const { GeminiCallSummaryGenerator } = await import(
  "./gemini-call-summary-generator"
);

describe("GeminiCallSummaryGenerator", () => {
  test("returns a safe fallback when no final transcript is available", async () => {
    const generator = new GeminiCallSummaryGenerator();

    const summary = await generator.generate({
      context: {
        category: "UNCATEGORIZED",
        incidentType: null,
        recommendation: null,
        reportId: "guest-call:test",
        summary: null,
        title: "Panggilan darurat tanpa akun",
      },
      transcript: [],
    });

    expect(summary.confidencePercent).toBe(0);
    expect(summary.keyPoints).toEqual([
      "Tidak ada transkrip final yang tersedia dari panggilan.",
    ]);
    expect(summary.summary).toContain("tanpa transkrip final");
  });
});
