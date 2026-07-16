import { env } from "@siaga-app/env/server";
import { z } from "zod";

import type {
  AssistantReportUpdate,
  CaseAssistant,
  ReporterReportDetail,
} from "../domain/reporter-report";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_CONTEXT_MESSAGES = 12;

const assistantUpdateSchema = z.object({
  category: z.enum(["UNCATEGORIZED", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  extractedData: z.record(z.string(), z.string()),
  incidentType: z
    .enum([
      "CRIME",
      "FIRE",
      "MEDICAL",
      "TRAFFIC_ACCIDENT",
      "NATURAL_DISASTER",
      "DOMESTIC_VIOLENCE",
      "MISSING_PERSON",
      "OTHER",
    ])
    .nullable(),
  recommendation: z.string().max(2000).nullable(),
  reply: z.string().min(1).max(1000),
  summary: z.string().min(1).max(2000),
  title: z.string().min(1).max(250),
});

const responseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      })
    )
    .min(1),
});

const jsonSchema = {
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
      anyOf: [
        {
          enum: [
            "CRIME",
            "FIRE",
            "MEDICAL",
            "TRAFFIC_ACCIDENT",
            "NATURAL_DISASTER",
            "DOMESTIC_VIOLENCE",
            "MISSING_PERSON",
            "OTHER",
          ],
          type: "string",
        },
        { type: "null" },
      ],
    },
    recommendation: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    reply: { type: "string" },
    summary: { type: "string" },
    title: { type: "string" },
  },
  required: [
    "category",
    "extractedData",
    "incidentType",
    "recommendation",
    "reply",
    "summary",
    "title",
  ],
  type: "object",
} as const;

const buildConversation = (report: ReporterReportDetail): string =>
  report.messages
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => `${message.senderType}: ${message.content}`)
    .join("\n");

export class OpenRouterCaseAssistant implements CaseAssistant {
  async analyze(
    report: ReporterReportDetail
  ): Promise<AssistantReportUpdate | null> {
    if (!env.OPENROUTER_API_KEY || report.responderPreference !== "AI") {
      return null;
    }

    const primaryUpdate = await this.requestUpdate(
      report,
      env.OPENROUTER_MODEL
    );
    if (primaryUpdate) {
      return primaryUpdate;
    }

    if (env.OPENROUTER_FALLBACK_MODEL === env.OPENROUTER_MODEL) {
      return null;
    }

    return await this.requestUpdate(report, env.OPENROUTER_FALLBACK_MODEL);
  }

  private async requestUpdate(
    report: ReporterReportDetail,
    model: string
  ): Promise<AssistantReportUpdate | null> {
    try {
      const response = await fetch(OPENROUTER_URL, {
        body: JSON.stringify({
          messages: [
            {
              content:
                "Anda adalah AI triage SIAGA. Balas singkat dalam Bahasa Indonesia. Gali satu informasi kritis berikutnya tanpa mengklaim bantuan sudah dikirim. Jangan melakukan dispatch. Prioritas boleh dinaikkan bila ada ancaman nyata, tetapi jangan menyamarkan tebakan sebagai fakta.",
              role: "system",
            },
            {
              content: `Mode: ${report.interactionMode ?? "TEXT"}\nJenis awal: ${report.incidentType ?? "belum diketahui"}\nPercakapan:\n${buildConversation(report)}`,
              role: "user",
            },
          ],
          model,
          provider: {
            require_parameters: true,
          },
          response_format: {
            json_schema: {
              name: "siaga_case_update",
              schema: jsonSchema,
              strict: true,
            },
            type: "json_schema",
          },
          temperature: 0,
        }),
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.BETTER_AUTH_URL,
          "X-Title": "SIAGA",
        },
        method: "POST",
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        console.error(
          `[OpenRouterCaseAssistant] model "${model}" responded with status ${response.status}`
        );
        return null;
      }
      const payload = responseSchema.safeParse(await response.json());
      if (!payload.success) {
        console.error(
          `[OpenRouterCaseAssistant] model "${model}" returned an unexpected response envelope`,
          payload.error
        );
        return null;
      }
      const [choice] = payload.data.choices;
      if (!choice) {
        return null;
      }
      const parsedJson: unknown = JSON.parse(choice.message.content);
      const update = assistantUpdateSchema.safeParse(parsedJson);
      if (!update.success) {
        console.error(
          `[OpenRouterCaseAssistant] model "${model}" returned an invalid case update payload`,
          update.error
        );
        return null;
      }
      return update.data;
    } catch (error) {
      console.error(
        `[OpenRouterCaseAssistant] request to model "${model}" failed`,
        error
      );
      return null;
    }
  }
}
