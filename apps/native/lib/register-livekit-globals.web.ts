// @livekit/react-native-webrtc has no web implementation (its native view
// components call requireNativeComponent, which react-native-web doesn't
// provide) — this platform-specific file keeps the whole module out of the
// web bundle instead of merely skipping the call to it.
export function registerLiveKitGlobals() {
  // no-op on web
}
