import { env } from "@siaga-app/env/server";
import { AccessToken, TrackSource } from "livekit-server-sdk";

export interface OfflineCallConnection {
  available: boolean;
  message: string | null;
  token: string | null;
  url: string | null;
}

export const createOfflineCallConnection = async (input: {
  callId: string;
  identity: string;
  roomName: string;
  role: "caller" | "operator";
}): Promise<OfflineCallConnection> => {
  if (!(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET)) {
    return {
      available: false,
      message: "Layanan audio demo belum dikonfigurasi.",
      token: null,
      url: null,
    };
  }

  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: input.identity,
    metadata: JSON.stringify({ callId: input.callId, role: input.role }),
    ttl: "15m",
  });
  token.addGrant({
    canPublish: true,
    canPublishData: true,
    canPublishSources: [TrackSource.MICROPHONE],
    canSubscribe: true,
    room: input.roomName,
    roomJoin: true,
  });

  return {
    available: true,
    message: null,
    token: await token.toJwt(),
    url: env.LIVEKIT_URL,
  };
};
