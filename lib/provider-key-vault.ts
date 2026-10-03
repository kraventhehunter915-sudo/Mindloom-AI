import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memoryKeys = new Map<string, string>();
const keyName = (provider: string) => `mindloom.ai.${provider}.key`;

/**
 * Web keys intentionally stay in memory for the current tab session. Browsers
 * do not provide an app-controlled secure enclave; persisting API keys in
 * localStorage would expose them to every script running on the origin.
 */
export async function saveProviderKey(provider: string, value: string) {
  const key = keyName(provider);
  if (Platform.OS === "web") {
    memoryKeys.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getProviderKey(provider: string) {
  const key = keyName(provider);
  if (Platform.OS === "web") return memoryKeys.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function clearProviderKey(provider: string) {
  const key = keyName(provider);
  if (Platform.OS === "web") {
    memoryKeys.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
