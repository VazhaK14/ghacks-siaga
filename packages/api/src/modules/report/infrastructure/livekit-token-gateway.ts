import { env } from "@siaga-app/env/server";
import { AccessToken, TrackSource } from "livekit-server-sdk";

import type {
  LiveKitConnection,
  LiveKitTokenGateway,
} from "../domain/reporter-report";

export class LiveKitReporterTokenGateway implements LiveKitTokenGateway {
  async createReporterConnection(input: {
    interactionMode: "VOICE" | "TEXT" | "SILENT";
    reporterId: string;
    roomName: string;
  }): Promise<LiveKitConnection> {
    if (!(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET)) {
      return {
        available: false,
        message:
          "Layanan suara belum dikonfigurasi. Laporan tetap aktif dan dapat ditangani operator melalui dashboard.",
        token: null,
        url: null,
      };
    }

    const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: `reporter-${input.reporterId}`,
      metadata: JSON.stringify({
        interactionMode: input.interactionMode,
        reporterId: input.reporterId,
      }),
      ttl: "15m",
    });
    token.addGrant({
      canPublish: true,
      canPublishData: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canSubscribe: input.interactionMode === "VOICE",
      room: input.roomName,
      roomJoin: true,
    });

    return {
      available: true,
      message: null,
      token: await token.toJwt(),
      url: env.LIVEKIT_URL,
    };
  }
}
