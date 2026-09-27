import { useThemeContext } from "@/lib/theme-provider";
import type { ThemePreference } from "@/constants/theme";

export function useColorScheme() {
  return useThemeContext().colorScheme;
}

export function useThemePreference() {
  const { themePreference, setColorScheme } = useThemeContext();
  return {
    themePreference,
    setThemePreference: (preference: ThemePreference) => setColorScheme(preference),
  };
}
