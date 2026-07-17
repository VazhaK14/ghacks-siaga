import { env } from "@siaga-app/env/server";
import { z } from "zod";

import type {
  RealtimeTranscriptionAccess,
  SynthesizedSpeech,
  VoiceAiGateway,
} from "../domain/reporter-report";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
const SCRIBE_MODEL = "scribe_v2_realtime" as const;
const tokenResponseSchema = z.object({ token: z.string().min(1) });

const unavailableTranscription = (
  message: string
): RealtimeTranscriptionAccess => ({
  available: false,
  message,
  modelId: SCRIBE_MODEL,
  token: null,
});

const unavailableSpeech = (message: string): SynthesizedSpeech => ({
  audioBase64: null,
  available: false,
  message,
  mimeType: "audio/mpeg",
});

export class ElevenLabsVoiceAiGateway implements VoiceAiGateway {
  async createRealtimeTranscriptionAccess(): Promise<RealtimeTranscriptionAccess> {
    if (!env.ELEVENLABS_API_KEY) {
      return unavailableTranscription(
        "ElevenLabs belum dikonfigurasi pada server."
      );
    }
    try {
      const response = await fetch(
        `${ELEVENLABS_API_URL}/single-use-token/realtime_scribe`,
        {
          headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
          method: "POST",
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (!response.ok) {
        return unavailableTranscription(
          `Token transkripsi tidak tersedia (${response.status}).`
        );
      }
      const payload = tokenResponseSchema.safeParse(await response.json());
      if (!payload.success) {
        return unavailableTranscription(
          "Respons token transkripsi tidak valid."
        );
      }
      return {
        available: true,
        message: null,
        modelId: SCRIBE_MODEL,
        token: payload.data.token,
      };
    } catch {
      return unavailableTranscription(
        "Layanan transkripsi suara tidak dapat dijangkau."
      );
    }
  }

  async synthesize(text: string): Promise<SynthesizedSpeech> {
    if (!env.ELEVENLABS_API_KEY) {
      return unavailableSpeech("ElevenLabs belum dikonfigurasi pada server.");
    }
    const conciseText = text.trim().slice(0, 500);
    if (!conciseText) {
      return unavailableSpeech("Teks suara kosong.");
    }
    try {
      const response = await fetch(
        `${ELEVENLABS_API_URL}/text-to-speech/${env.ELEVENLABS_VOICE_ID}/stream?output_format=mp3_22050_32`,
        {
          body: JSON.stringify({
            language_code: "id",
            model_id: env.ELEVENLABS_TTS_MODEL,
            text: conciseText,
          }),
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": env.ELEVENLABS_API_KEY,
          },
          method: "POST",
          signal: AbortSignal.timeout(15_000),
        }
      );
      if (!response.ok) {
        return unavailableSpeech(
          `Suara AI tidak tersedia (${response.status}).`
        );
      }
      const audio = Buffer.from(await response.arrayBuffer()).toString(
        "base64"
      );
      return {
        audioBase64: audio,
        available: true,
        message: null,
        mimeType: "audio/mpeg",
      };
    } catch {
      return unavailableSpeech("Suara AI tidak dapat dibuat saat ini.");
    }
  }
}
