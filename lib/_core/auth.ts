import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

/**
 * Web authentication is intentionally cookie-only. The browser never receives
 * or stores the JWT; the server's HttpOnly session cookie is the authority.
 */
export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function removeSessionToken(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    // Logout remains best-effort if the native keychain is unavailable.
  }
}

/**
 * User details may be cached only in the native OS keychain. On web, identity
 * is always read from /api/trpc/auth.me after the HttpOnly cookie is sent.
 */
export async function getUserInfo(): Promise<User | null> {
  if (Platform.OS === "web") return null;
  try {
    const info = await SecureStore.getItemAsync(USER_INFO_KEY);
    return info ? (JSON.parse(info) as User) : null;
  } catch {
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(user));
  } catch {
    // The server session remains authoritative if keychain storage fails.
  }
}

export async function clearUserInfo(): Promise<void> {
  if (Platform.OS === "web") {
    // Remove the old pre-hardening browser cache if it exists.
    try {
      window.localStorage.removeItem(USER_INFO_KEY);
    } catch {
      // Storage may be disabled; there is nothing else to clear on web.
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch {
    // Best-effort cleanup.
  }
}
