import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "note.text": "description",
  share: "share",
  settings: "settings",
  search: "search",
  add: "add",
  sparkles: "auto-awesome",
  pin: "push-pin",
  "pin-outline": "push-pin",
  more: "more-horiz",
  "arrow-left": "arrow-back",
  check: "check",
  delete: "delete-outline",
  close: "close",
  folder: "folder-open",
  tag: "sell",
  lock: "lock-outline",
  cloud: "cloud-done",
  refresh: "refresh",
  "chevron-down": "expand-more",
} as const;

type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({ name, size = 24, color, style }: { name: IconSymbolName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight }) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] as ComponentProps<typeof MaterialIcons>["name"]} style={style} />;
}
