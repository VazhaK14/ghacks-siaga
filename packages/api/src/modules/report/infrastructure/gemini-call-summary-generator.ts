import { env } from "@siaga-app/env/server";
import { z } from "zod";

import type {
  CallTranscriptSegment,
  OperatorCallContext,
  OperatorCallSummary,
  OperatorCallSummaryGenerator,
} from "../domain/operator-call";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_TRANSCRIPT_SEGMENTS = 200;

const summarySchema = z.object({
  callerCondition: z.string().min(1).max(500),
  confidencePercent: z.number().int().min(0).max(100),
  followUp: z.string().min(1).max(1000),
  keyPoints: z.array(z.string().min(1).max(500)).max(6),
  summary: z.string().min(1).max(2000),
});

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })).min(1),
        }),
      })
    )
    .min(1),
});

const responseJsonSchema = {
  additionalProperties: false,
  properties: {
    callerCondition: { type: "string" },
    confidencePercent: { maximum: 100, minimum: 0, type: "integer" },
    followUp: { type: "string" },
    keyPoints: { items: { type: "string" }, maxItems: 6, type: "array" },
    summary: { type: "string" },
  },
  required: [
    "callerCondition",
    "confidencePercent",
    "followUp",
    "keyPoints",
    "summary",
  ],
  type: "object",
} as const;

const buildTranscript = (segments: CallTranscriptSegment[]): string =>
  segments
    .slice(-MAX_TRANSCRIPT_SEGMENTS)
    .map(
      (segment) =>
        `${segment.speaker === "OPERATOR" ? "Operator" : "Pelapor"}: ${segment.text}`
    )
    .join("\n");

const fallbackSummary = (
  context: OperatorCallContext,
  transcript: CallTranscriptSegment[]
): OperatorCallSummary => {
  const reporterPoints = transcript
    .filter((segment) => segment.speaker === "REPORTER")
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .slice(-3);
  return {
    callerCondition: "Kondisi pelapor perlu ditinjau langsung oleh operator.",
    confidencePercent: transcript.length > 0 ? 40 : 0,
    followUp:
      context.recommendation ??
      "Tinjau detail laporan dan konfirmasi tindak lanjut dengan unit respons.",
    keyPoints:
      reporterPoints.length > 0
        ? reporterPoints
        : ["Tidak ada transkrip final yang tersedia dari panggilan."],
    summary:
      transcript.length > 0
        ? "Panggilan operator dan pelapor selesai. Ringkasan otomatis terbatas karena layanan AI tidak tersedia."
        : "Panggilan selesai tanpa transkrip final yang dapat diringkas.",
  };
};

export class GeminiCallSummaryGenerator
  implements OperatorCallSummaryGenerator
{
  async generate(input: {
    context: OperatorCallContext;
    transcript: CallTranscriptSegment[];
  }): Promise<OperatorCallSummary> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || input.transcript.length === 0) {
      return fallbackSummary(input.context, input.transcript);
    }
    const primary = await this.requestSummary(
      apiKey,
      env.GEMINI_MODEL,
      input.context,
      input.transcript
    );
    if (primary) {
      return primary;
    }
    if (env.GEMINI_FALLBACK_MODEL !== env.GEMINI_MODEL) {
      const fallback = await this.requestSummary(
        apiKey,
        env.GEMINI_FALLBACK_MODEL,
        input.context,
        input.transcript
      );
      if (fallback) {
        return fallback;
      }
    }
    return fallbackSummary(input.context, input.transcript);
  }

  private async requestSummary(
    apiKey: string,
    model: string,
    context: OperatorCallContext,
    transcript: CallTranscriptSegment[]
  ): Promise<OperatorCallSummary | null> {
    try {
      const response = await fetch(
        `${GEMINI_API_URL}/models/${encodeURIComponent(model)}:generateContent`,
        {
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Laporan: ${context.title ?? "Tanpa judul"}\nKategori: ${context.category}\nJenis: ${context.incidentType ?? "Belum diketahui"}\nRingkasan awal: ${context.summary ?? "-"}\nRekomendasi awal: ${context.recommendation ?? "-"}\n\nTranskrip:\n${buildTranscript(transcript)}`,
                  },
                ],
                role: "user",
              },
            ],
            generationConfig: {
              maxOutputTokens: 1200,
              responseJsonSchema,
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: "minimal" },
            },
            systemInstruction: {
              parts: [
                {
                  text: "Ringkas panggilan darurat SIAGA dalam Bahasa Indonesia. Gunakan hanya fakta dari transkrip dan konteks. Jangan mengarang kondisi, lokasi, atau status bantuan. callerCondition menjelaskan kondisi pelapor yang terdengar; followUp berisi tindakan operasional konkret; confidencePercent mencerminkan kelengkapan transkrip.",
                },
              ],
            },
          }),
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          method: "POST",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        }
      );
      if (!response.ok) {
        return null;
      }
      const payload = geminiResponseSchema.safeParse(await response.json());
      const text = payload.success
        ? payload.data.candidates[0]?.content.parts
            .map((part) => part.text ?? "")
            .join("")
            .trim()
        : null;
      if (!text) {
        return null;
      }
      const parsed = summarySchema.safeParse(JSON.parse(text) as unknown);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }
}
