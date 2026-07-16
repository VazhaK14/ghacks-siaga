import type { PropsWithChildren } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const REFERENCE_WIDTH = 390;
const MAX_PHONE_WIDTH = 430;

interface ViewportSize {
  height: number;
  width: number;
}

interface ReferenceCanvasProps {
  backgroundColor?: string;
  referenceHeight?: number;
  scrollable?: boolean;
  testID?: string;
}

export function ReferenceCanvas({
  backgroundColor = "#f6f3f0",
  children,
  referenceHeight = 844,
  scrollable = false,
  testID,
}: PropsWithChildren<ReferenceCanvasProps>) {
  const window = useWindowDimensions();
  const [viewport, setViewport] = useState<ViewportSize>({
    height: window.height,
    width: window.width,
  });
  const renderedWidth = Math.min(viewport.width, MAX_PHONE_WIDTH);
  const scale = renderedWidth / REFERENCE_WIDTH;
  const renderedHeight = referenceHeight * scale;
  const needsScroll = scrollable || renderedHeight > viewport.height + 1;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setViewport((current) => {
      if (current.height === height && current.width === width) {
        return current;
      }
      return { height, width };
    });
  }, []);

  const canvasStyle = useMemo(
    () => [
      styles.canvas,
      {
        backgroundColor,
        height: referenceHeight,
        transform: [{ scale }],
        width: REFERENCE_WIDTH,
      },
    ],
    [backgroundColor, referenceHeight, scale]
  );

  const scaledFrameStyle = useMemo(
    () => ({ height: renderedHeight, width: renderedWidth }),
    [renderedHeight, renderedWidth]
  );

  const canvas = (
    <View style={scaledFrameStyle} testID={testID}>
      <View style={canvasStyle}>{children}</View>
    </View>
  );

  if (needsScroll) {
    return (
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
        style={[styles.screen, { backgroundColor }]}
      >
        {canvas}
      </ScrollView>
    );
  }

  return (
    <View
      onLayout={handleLayout}
      style={[styles.screen, styles.centered, { backgroundColor }]}
    >
      {canvas}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    overflow: "hidden",
    position: "absolute",
    transformOrigin: "top left",
  },
  centered: {
    alignItems: "center",
  },
  screen: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    flexGrow: 1,
  },
});
