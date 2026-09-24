import { useWindowDimensions, View, type ViewProps } from "react-native";
import { Platform, StyleSheet } from "react-native";

export function WorkspaceFrame({
  children,
  variant = "default",
  style,
  ...props
}: ViewProps & { variant?: "default" | "editor" }) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;
  const maxWidth = variant === "editor" ? 820 : 1080;
  const gutter = isDesktop ? 48 : 0;
  const railOffset = isDesktop ? 92 : 0;
  const frameWidth = Math.min(
    Math.max(width - gutter * 2 - railOffset, 0),
    maxWidth,
  );

  return (
    <View
      style={[
        styles.frame,
        { width: frameWidth, marginLeft: isDesktop ? railOffset : 0 },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: "center", flex: 1 },
});
