import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, useWindowDimensions } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 900;
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarPosition: desktop ? "left" : "bottom",
      tabBarStyle: desktop ? { width: 88, paddingTop: 20, backgroundColor: colors.surface, borderRightColor: colors.border, borderRightWidth: 1 } : { paddingTop: 8, paddingBottom: bottomPadding, height: 56 + bottomPadding, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Notes", tabBarIcon: ({ color }) => <IconSymbol size={23} name="note.text" color={color} /> }} />
      <Tabs.Screen name="graph" options={{ title: "Graph", tabBarIcon: ({ color }) => <IconSymbol size={23} name="share" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <IconSymbol size={23} name="settings" color={color} /> }} />
    </Tabs>
  );
}
