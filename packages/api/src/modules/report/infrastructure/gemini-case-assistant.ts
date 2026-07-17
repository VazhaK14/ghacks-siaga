import { env } from "@siaga-app/env/server";
import { z } from "zod";

import type {
  AssistantReportUpdate,
  CaseAssistant,
  ReporterReportDetail,
} from "../domain/reporter-report";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const MAX_CONTEXT_MESSAGES = 12;
const REQUEST_TIMEOUT_MS = 10_000;

const incidentTypes = [
  "CRIME",
  "FIRE",
  "MEDICAL",
  "TRAFFIC_ACCIDENT",
  "NATURAL_DISASTER",
  "DOMESTIC_VIOLENCE",
  "MISSING_PERSON",
  "OTHER",
] as const;

const geminiAssistantUpdateSchema = z.object({
  category: z.enum(["UNCATEGORIZED", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  extractedData: z.record(z.string(), z.string()),
  incidentType: z.enum([...incidentTypes, "UNKNOWN"]),
  intakeRecommendation: z.enum(["CONTINUE", "FINALIZE", "URGENT_FINALIZE"]),
  missingCriticalFields: z.array(
    z.enum(["INCIDENT", "LOCATION", "IMMEDIATE_DANGER", "PEOPLE_AFFECTED"])
  ),
  recommendation: z.string().max(2000),
  reply: z.string().min(1).max(1000),
  summary: z.string().min(1).max(2000),
  title: z.string().min(1).max(250),
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
    category: {
      enum: ["UNCATEGORIZED", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
      type: "string",
    },
    extractedData: {
      additionalProperties: { type: "string" },
      type: "object",
    },
    incidentType: {
      enum: [...incidentTypes, "UNKNOWN"],
      type: "string",
    },
    intakeRecommendation: {
      enum: ["CONTINUE", "FINALIZE", "URGENT_FINALIZE"],
      type: "string",
    },
    missingCriticalFields: {
      items: {
        enum: ["INCIDENT", "LOCATION", "IMMEDIATE_DANGER", "PEOPLE_AFFECTED"],
        type: "string",
      },
      type: "array",
    },
    recommendation: { type: "string" },
    reply: { type: "string" },
    summary: { type: "string" },
    title: { type: "string" },
  },
  required: [
    "category",
    "extractedData",
    "incidentType",
    "intakeRecommendation",
    "missingCriticalFields",
    "recommendation",
    "reply",
    "summary",
    "title",
  ],
  type: "object",
} as const;

const SYSTEM_PROMPT =
  "Anda adalah AI triage SIAGA. Balas maksimal dua kalimat singkat dalam Bahasa Indonesia dan tanyakan hanya satu hal. Kumpulkan: jenis kejadian, lokasi, ancaman yang masih berlangsung, serta jumlah/kondisi orang terdampak. Gunakan extractedData dengan key konsisten incidentDescription, location, immediateDanger, peopleAffected, victimCondition, weapon, fireOrSmoke, atau peopleTrapped. Gunakan incidentType UNKNOWN jika belum diketahui dan recommendation string kosong jika belum ada rekomendasi. Jika intakeStatus FINALIZED, berikan dukungan keselamatan singkat tanpa mengulang intake. Jangan mengklaim bantuan sudah dikirim dan jangan melakukan dispatch. Tandai URGENT_FINALIZE untuk tembakan, ledakan, senjata aktif, tidak bernapas, perdarahan hebat, kebakaran besar, atau orang terjebak. Jangan menyamarkan tebakan sebagai fakta.";

const buildConversation = (report: ReporterReportDetail): string =>
  report.messages
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => `${message.senderType}: ${message.content}`)
    .join("\n");

const buildReportContext = (report: ReporterReportDetail): string =>
  `Mode: ${report.interactionMode ?? "TEXT"}\nIntake status: ${report.intakeStatus}\nPertanyaan intake: ${report.intakeQuestionCount}/6\nLokasi perangkat: ${report.latitude ?? "?"}, ${report.longitude ?? "?"}\nJenis awal: ${report.incidentType ?? "belum diketahui"}\nPercakapan:\n${buildConversation(report)}`;

const toAssistantUpdate = (input: unknown): AssistantReportUpdate | null => {
  const parsed = geminiAssistantUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  return {
    ...parsed.data,
    incidentType:
      parsed.data.incidentType === "UNKNOWN" ? null : parsed.data.incidentType,
    recommendation: parsed.data.recommendation.trim() || null,
  };
};

export class GeminiCaseAssistant implements CaseAssistant {
  async analyze(
    report: ReporterReportDetail
  ): Promise<AssistantReportUpdate | null> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || report.responderPreference !== "AI") {
      return null;
    }

    const primaryUpdate = await this.requestUpdate(
      apiKey,
      report,
      env.GEMINI_MODEL
    );
    if (primaryUpdate) {
      return primaryUpdate;
    }
    if (env.GEMINI_FALLBACK_MODEL === env.GEMINI_MODEL) {
      return null;
    }
    return await this.requestUpdate(apiKey, report, env.GEMINI_FALLBACK_MODEL);
  }

  private async requestUpdate(
    apiKey: string,
    report: ReporterReportDetail,
    model: string
  ): Promise<AssistantReportUpdate | null> {
    try {
      const response = await fetch(
        `${GEMINI_API_URL}/models/${encodeURIComponent(model)}:generateContent`,
        {
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: buildReportContext(report) }],
                role: "user",
              },
            ],
            generationConfig: {
              maxOutputTokens: 1500,
              responseJsonSchema,
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: "minimal" },
            },
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
      if (!payload.success) {
        return null;
      }
      const text = payload.data.candidates[0]?.content.parts
        .map((part) => part.text ?? "")
        .join("")
        .trim();
      if (!text) {
        return null;
      }
      return toAssistantUpdate(JSON.parse(text) as unknown);
    } catch {
      return null;
    }
  }
}
