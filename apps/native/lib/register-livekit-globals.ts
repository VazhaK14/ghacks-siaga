// Deferred into a require() inside the try block (not a static top-level
// import) on purpose: a static import is evaluated the instant this module
// loads, before this function ever runs, so a throw during the native
// module's own top-level setup couldn't be caught here. Expo Go has no
// compiled @livekit/react-native native module, so without this guard the
// whole app crashes before any screen renders — voice/silent-mode calling
// still won't work there, but the rest of the app stays usable.
export function registerLiveKitGlobals() {
  try {
    const { registerGlobals } = require("@livekit/react-native");
    registerGlobals();
  } catch (error) {
    console.warn(
      "[LiveKit] registerGlobals() failed — voice features are unavailable in this runtime. Use a custom dev client (bun run android) instead of Expo Go.",
      error
    );
  }
}
