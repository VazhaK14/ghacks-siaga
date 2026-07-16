import { useCSSVariable } from "uniwind";

// Single source of truth for the raw-JS-value needs that can't consume a
// Tailwind className (Ionicons `color`, ActivityIndicator `color`,
// StyleSheet.create). Resolves the same `--color-siaga-*` custom properties
// declared in apps/native/global.css, so these values react to
// Uniwind.setTheme(...) instead of drifting like the old hardcoded
// constants/colors.ts (which only ever held light-theme hex values).
const SIAGA_COLOR_VAR = {
  body: "--color-siaga-body",
  border: "--color-siaga-border",
  "border-soft": "--color-siaga-border-soft",
  "call-bg": "--color-siaga-call-bg",
  ink: "--color-siaga-ink",
  input: "--color-siaga-input",
  muted: "--color-siaga-muted",
  "muted-strong": "--color-siaga-muted-strong",
  panel: "--color-siaga-panel",
  primary: "--color-siaga-primary",
  "primary-dark": "--color-siaga-primary-dark",
  priority: "--color-siaga-priority",
  soft: "--color-siaga-soft",
  success: "--color-siaga-success",
  "success-soft": "--color-siaga-success-soft",
  surface: "--color-siaga-surface",
} as const;

export type SiagaColorName = keyof typeof SIAGA_COLOR_VAR;

export function useSiagaColor(name: SiagaColorName): string {
  return useCSSVariable(SIAGA_COLOR_VAR[name]) as string;
}

export function useSiagaColors<T extends readonly SiagaColorName[]>(
  names: T
): string[] {
  return useCSSVariable(names.map((name) => SIAGA_COLOR_VAR[name])) as string[];
}

/**
 * Opacity-tinted variants of siaga-primary/siaga-success, used for shadows
 * and soft glows. Safe to keep as static rgba (not theme-derived) because
 * --color-siaga-primary/--color-siaga-success are themselves invariant
 * across light/dark (see global.css) — unlike surface/ink, these can't
 * drift between themes.
 */
export const SIAGA_PRIMARY_SOFT = "rgba(135, 0, 0, 0.08)";
export const SIAGA_PRIMARY_SOFT_STRONG = "rgba(135, 0, 0, 0.14)";
export const SIAGA_PRIMARY_SHADOW = "rgba(135, 0, 0, 0.18)";
export const SIAGA_SUCCESS_BORDER = "#cde2d7";
