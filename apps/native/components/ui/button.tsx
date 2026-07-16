import type { ComponentProps } from "react";
import { Pressable, Text } from "react-native";

import { cn, tv } from "@/lib/cn";

const buttonVariants = tv({
  base: "shrink-0 flex-row items-center justify-center gap-2 rounded-xl px-4 py-2 shadow-lg",
  defaultVariants: {
    size: "default",
    variant: "primary",
  },
  variants: {
    size: {
      default: "px-4 py-2",
      icon: "size-9",
      "icon-lg": "size-10",
      "icon-sm": "size-8",
      "icon-xs": "size-7 rounded-md",
      lg: "rounded-md px-8",
      md: "gap-1.5 rounded-md px-4 py-1",
      sm: "gap-1.5 rounded-md px-3",
      xl: "rounded-md px-4",
    },
    variant: {
      // CSS `brightness()` has no React Native equivalent (Uniwind doesn't
      // translate it — confirmed no native style handler for it), so press
      // feedback uses opacity here instead of the web version's
      // hover/active:brightness.
      destructive:
        "border-2 border-red-200 bg-gradient-to-r from-red-100 to-red-200 active:opacity-80",
      ghost:
        "border-2 border-primary-400 bg-transparent active:bg-neutral-500/70",
      link: "bg-transparent shadow-none",
      primary:
        "border-2 border-primary-300 bg-gradient-to-r from-primary-200 to-primary-400 active:opacity-80",
      secondary:
        "border-2 border-primary-400 bg-primary-400 active:bg-primary-500",
      stroke: "border-2 border-neutral-100 bg-transparent active:opacity-70",
    },
  },
});

const buttonTextVariants = tv({
  base: "text-center font-medium text-m3",
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      destructive: "text-neutral-100",
      ghost: "text-primary-400",
      link: "text-primary underline",
      primary: "text-primary-foreground",
      secondary: "text-primary-foreground",
      stroke: "text-primary-foreground",
    },
  },
});

type ButtonVariant =
  | "destructive"
  | "ghost"
  | "link"
  | "primary"
  | "secondary"
  | "stroke";
type ButtonSize =
  | "default"
  | "icon"
  | "icon-lg"
  | "icon-sm"
  | "icon-xs"
  | "lg"
  | "md"
  | "sm"
  | "xl";

type ButtonProps = ComponentProps<typeof Pressable> & {
  children: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    >
      <Text className={buttonTextVariants({ variant })}>{children}</Text>
    </Pressable>
  );
}
