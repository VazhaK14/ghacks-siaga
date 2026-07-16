import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";

const ACTIVE_COLOR = "#870000";
const INACTIVE_COLOR = "#333333";
const REFERENCE_WIDTH = 390;
const REFERENCE_TAB_HEIGHT = 97;
const MAX_PHONE_WIDTH = 430;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width, MAX_PHONE_WIDTH) / REFERENCE_WIDTH;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarIconStyle: { marginTop: 1 },
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontFamily: "PlusJakartaSans_800ExtraBold",
          fontSize: 12,
          lineHeight: 15,
        },
        tabBarStyle: {
          alignSelf: "center",
          backgroundColor: "#ffffff",
          borderTopColor: "#e9e3df",
          height: REFERENCE_TAB_HEIGHT * scale,
          maxWidth: MAX_PHONE_WIDTH,
          paddingBottom: 30 * scale,
          paddingTop: 7 * scale,
          width: "100%",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="alert-circle-outline" size={26} />
          ),
          title: "SOS",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="time-outline" size={26} />
          ),
          title: "Riwayat",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="person-circle-outline" size={26} />
          ),
          title: "Profil",
        }}
      />
    </Tabs>
  );
}
