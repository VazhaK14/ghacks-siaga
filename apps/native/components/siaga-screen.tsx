import { cn } from "heroui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SiagaScreenProps {
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
  isDark?: boolean;
  isScrollable?: boolean;
}

export function SiagaScreen({
  children,
  className,
  contentClassName,
  footer,
  isDark = false,
  isScrollable = false,
}: PropsWithChildren<SiagaScreenProps>) {
  const backgroundClass = isDark ? "bg-siaga-primary-dark" : "bg-siaga-surface";

  return (
    <SafeAreaView className={cn("flex-1", backgroundClass, className)}>
      {isScrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn("grow px-6 py-8", contentClassName)}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn("flex-1 px-6 py-8", contentClassName)}>
          {children}
        </View>
      )}
      {footer}
    </SafeAreaView>
  );
}
