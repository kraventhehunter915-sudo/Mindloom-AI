import { useThemeContext } from "@/lib/theme-provider";
import type { ThemePreference } from "@/constants/theme";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
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
