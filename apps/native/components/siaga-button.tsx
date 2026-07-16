import { Button as HeroButton } from "heroui-native";
import { Pressable, Text } from "react-native";
import { cn } from "@/lib/cn";

interface SiagaButtonProps {
  accessibilityLabel?: string;
  children: string;
  className?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  tone?: "primary" | "outline" | "ghost";
}

export function SiagaButton({
  accessibilityLabel,
  children,
  className,
  isDisabled,
  onPress,
  tone = "primary",
}: SiagaButtonProps) {
  if (tone !== "primary") {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? children}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        className={cn(
          "h-[54px] items-center justify-center rounded-xl",
          tone === "outline"
            ? "border border-siaga-primary bg-transparent"
            : "bg-transparent",
          isDisabled ? "opacity-50" : null,
          className
        )}
        disabled={isDisabled}
        onPress={onPress}
      >
        <Text className="font-semibold text-[14px] text-siaga-primary">
          {children}
        </Text>
      </Pressable>
    );
  }

  return (
    <HeroButton
      accessibilityLabel={accessibilityLabel ?? children}
      className={cn("h-[54px] rounded-xl bg-siaga-primary", className)}
      feedbackVariant="scale-highlight"
      isDisabled={isDisabled}
      onPress={onPress}
      size="lg"
      variant="primary"
    >
      <HeroButton.Label className="font-semibold text-[14px] text-white">
        {children}
      </HeroButton.Label>
    </HeroButton>
  );
}
