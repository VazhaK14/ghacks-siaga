import { Button as HeroButton } from "heroui-native";
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
  const variant = tone === "primary" ? "primary" : tone;

  return (
    <HeroButton
      accessibilityLabel={accessibilityLabel ?? children}
      className={cn(
        "h-[54px] rounded-xl",
        tone === "primary" ? "bg-siaga-primary" : null,
        tone === "outline" ? "border-siaga-primary bg-transparent" : null,
        className
      )}
      feedbackVariant="scale-highlight"
      isDisabled={isDisabled}
      onPress={onPress}
      size="lg"
      variant={variant}
    >
      <HeroButton.Label
        className={cn(
          "font-semibold text-[14px]",
          tone === "primary" ? "text-white" : "text-siaga-primary"
        )}
      >
        {children}
      </HeroButton.Label>
    </HeroButton>
  );
}
