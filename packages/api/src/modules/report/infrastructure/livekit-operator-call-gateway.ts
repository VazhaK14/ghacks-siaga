import { env } from "@siaga-app/env/server";
import { AccessToken, TrackSource } from "livekit-server-sdk";

import type {
  OperatorCallConnection,
  OperatorCallTokenGateway,
} from "../domain/operator-call";

export class LiveKitOperatorCallGateway implements OperatorCallTokenGateway {
  async createConnection(input: {
    callSessionId: string;
    participantId: string;
    participantRole: "operator" | "reporter";
    roomName: string;
  }): Promise<OperatorCallConnection> {
    if (!(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET)) {
      return {
        available: false,
        message: "LiveKit belum dikonfigurasi pada server.",
        token: null,
        url: null,
      };
    }
    const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: `${input.participantRole}-${input.participantId}-${input.callSessionId}`,
      metadata: JSON.stringify({
        callSessionId: input.callSessionId,
        participantRole: input.participantRole,
      }),
      ttl: "1h",
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
  }
}
