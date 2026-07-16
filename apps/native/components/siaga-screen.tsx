import { cn } from "heroui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

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
    <View className={cn("flex-1", backgroundClass, className)}>
      {isScrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn("grow px-6 py-8", contentClassName)}
          contentContainerStyle={styles.contentFrame}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          className={cn("flex-1 px-6 py-8", contentClassName)}
          style={styles.contentFrame}
        >
          {children}
        </View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  contentFrame: {
    alignSelf: "center",
    maxWidth: 430,
    width: "100%",
  },
});
