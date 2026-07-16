export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type NotificationSetupStatus =
  | "checking"
  | "enabled"
  | "disabled"
  | "unsupported";
