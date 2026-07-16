import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { useSiagaColor } from "@/lib/use-siaga-color";

const MAX_PHONE_WIDTH = 430;
const BAR_HEIGHT = 64;
const BAR_RADIUS = 28;
const SOS_BUTTON_SIZE = 64;
const SOS_OVERLAP = SOS_BUTTON_SIZE / 2.4;

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<
  string,
  { active: TabIconName; inactive: TabIconName }
> = {
  history: { active: "time", inactive: "time-outline" },
  index: { active: "home", inactive: "home-outline" },
  profile: { active: "person-circle", inactive: "person-circle-outline" },
};

interface TabButtonProps {
  activeColor: string;
  focused: boolean;
  inactiveColor: string;
  label: string;
  navigation: BottomTabBarProps["navigation"];
  route: BottomTabBarProps["state"]["routes"][number];
}

function TabButton({
  activeColor,
  focused,
  inactiveColor,
  label,
  navigation,
  route,
}: TabButtonProps) {
  const icons = TAB_ICONS[route.name];
  const iconName = focused
    ? (icons?.active ?? "ellipse")
    : (icons?.inactive ?? "ellipse-outline");

  const handlePress = useCallback(() => {
    const event = navigation.emit({
      canPreventDefault: true,
      target: route.key,
      type: "tabPress",
    });
    if (!(focused || event.defaultPrevented)) {
      navigation.navigate(route.name);
    }
  }, [focused, navigation, route.key, route.name]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      className="flex-1 items-center justify-center gap-1"
      onPress={handlePress}
    >
      <Ionicons
        color={focused ? activeColor : inactiveColor}
        name={iconName}
        size={22}
      />
      <Text
        className="font-extrabold text-[10px]"
        numberOfLines={1}
        style={{ color: focused ? activeColor : inactiveColor }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CurvedTabBar({
  descriptors,
  insets,
  navigation,
  state,
}: BottomTabBarProps) {
  const router = useRouter();
  const barFill = useSiagaColor("panel");
  const inactiveColor = useSiagaColor("muted");
  const activeColor = useSiagaColor("primary");
  const midpoint = Math.ceil(state.routes.length / 2);
  const leftRoutes = state.routes.slice(0, midpoint);
  const rightRoutes = state.routes.slice(midpoint);

  const handleSosPress = useCallback(() => {
    router.push("/sos");
  }, [router]);

  const renderTabButton = useCallback(
    (route: (typeof state.routes)[number]) => {
      const routeIndex = state.routes.findIndex(
        (item) => item.key === route.key
      );
      const isFocused = state.index === routeIndex;
      const { options } = descriptors[route.key];
      const label =
        typeof options.tabBarLabel === "string"
          ? options.tabBarLabel
          : (options.title ?? route.name);

      return (
        <TabButton
          activeColor={activeColor}
          focused={isFocused}
          inactiveColor={inactiveColor}
          key={route.key}
          label={label}
          navigation={navigation}
          route={route}
        />
      );
    },
    [
      activeColor,
      descriptors,
      inactiveColor,
      navigation,
      state.index,
      state.routes,
    ]
  );

  return (
    <View className="w-full self-center" style={{ maxWidth: MAX_PHONE_WIDTH }}>
      <View
        className="flex-row shadow-lg"
        style={{
          backgroundColor: barFill,
          borderTopLeftRadius: BAR_RADIUS,
          borderTopRightRadius: BAR_RADIUS,
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingHorizontal: 12,
        }}
      >
        <View className="flex-1 flex-row">
          {leftRoutes.map(renderTabButton)}
        </View>
        <View style={{ width: SOS_BUTTON_SIZE + 16 }} />
        <View className="flex-1 flex-row">
          {rightRoutes.map(renderTabButton)}
        </View>
      </View>

      <Pressable
        accessibilityLabel="Aktifkan SOS"
        accessibilityRole="button"
        className="absolute items-center justify-center rounded-full bg-siaga-primary shadow-lg"
        onPress={handleSosPress}
        style={{
          height: SOS_BUTTON_SIZE,
          left: "50%",
          marginLeft: -SOS_BUTTON_SIZE / 2,
          top: -SOS_OVERLAP,
          width: SOS_BUTTON_SIZE,
        }}
      >
        <Text className="font-extrabold text-[15px] text-white">SOS</Text>
      </Pressable>
    </View>
  );
}
