import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";

interface LiveAudioRoomProps {
  reportId: string;
}

// @livekit/react-native-webrtc has no web implementation, so live audio
// (mic publish/subscribe) isn't available in the web preview build — this
// keeps the emergency-session screens usable there without pulling in the
// native LiveKit module graph (which crashes react-native-web).
export function LiveAudioRoom({
  children,
}: PropsWithChildren<LiveAudioRoomProps>) {
  return (
    <View className="flex-1">
      <View className="absolute top-14 right-5 left-5 z-50 rounded-xl bg-black/75 px-4 py-3">
        <Text className="text-center text-white text-xs leading-5">
          Audio langsung tidak tersedia di pratinjau web. Gunakan perangkat
          mobile untuk mode suara/senyap.
        </Text>
      </View>
      {children}
    </View>
  );
}
