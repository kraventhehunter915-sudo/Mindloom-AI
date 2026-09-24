import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNotes, type AISettings } from "@/lib/notes-context";
import { trpc } from "@/lib/trpc";

const providers: { id: AISettings["provider"]; label: string; detail: string; defaultModel: string }[] = [
  { id: "managed", label: "Mindloom AI", detail: "Managed, private, no key required", defaultModel: "auto" },
  { id: "openai", label: "OpenAI", detail: "Bring your own API key", defaultModel: "gpt-4o-mini" },
  { id: "anthropic", label: "Anthropic", detail: "Bring your own API key", defaultModel: "claude-3-5-sonnet" },
  { id: "google", label: "Google AI", detail: "Bring your own API key", defaultModel: "gemini-2.0-flash" },
  { id: "ollama", label: "Ollama", detail: "Local endpoint on your network", defaultModel: "llama3.2" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const { aiSettings, setAISettings } = useNotes();
  const [selectedProvider, setSelectedProvider] = useState(aiSettings.provider);
  const [model, setModel] = useState(aiSettings.model);
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const modelsQuery = trpc.ai.models.useQuery(undefined, { retry: false, staleTime: 1000 * 60 * 10 });
  const managedModels = useMemo(() => modelsQuery.data?.models?.slice(0, 5) ?? [], [modelsQuery.data]);

  useEffect(() => {
    setSelectedProvider(aiSettings.provider);
    setModel(aiSettings.model);
  }, [aiSettings.provider, aiSettings.model]);

  const selectProvider = (provider: AISettings["provider"]) => {
    const next = providers.find((item) => item.id === provider) ?? providers[0];
    setSelectedProvider(provider);
    setModel(provider === aiSettings.provider ? aiSettings.model : next.defaultModel);
    setKeySaved(false);
  };

  const saveSettings = () => setAISettings({ provider: selectedProvider, model: model.trim() || "auto", apiKeyLabel: apiKey ? "Stored securely" : aiSettings.apiKeyLabel });
  const saveKey = async () => {
    if (!apiKey.trim() || selectedProvider === "managed") return;
    await SecureStore.setItemAsync(`mindloom.ai.${selectedProvider}.key`, apiKey.trim());
    setApiKey("");
    setKeySaved(true);
    saveSettings();
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>PERSONALIZE YOUR SPACE</Text><Text style={[styles.heading, { color: colors.foreground }]}>Settings</Text></View><View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="settings" size={20} color={colors.primary} /></View></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI assistant</Text>
          <Text style={[styles.sectionIntro, { color: colors.muted }]}>Choose how Mindloom helps you think. The managed assistant works immediately; provider keys are stored on-device in the secure keychain.</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}><View style={[styles.aiIcon, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="sparkles" size={19} color={colors.primary} /></View><View style={styles.cardHeaderCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Writing partner</Text><Text style={[styles.cardCaption, { color: colors.muted }]}>{providers.find((provider) => provider.id === selectedProvider)?.detail}</Text></View><View style={[styles.statusDot, { backgroundColor: colors.success }]} /></View>
          {providers.map((provider) => <Pressable key={provider.id} onPress={() => selectProvider(provider.id)} style={({ pressed }) => [styles.providerRow, { borderTopColor: colors.border }, pressed && styles.pressed]}><View style={[styles.radio, { borderColor: selectedProvider === provider.id ? colors.primary : colors.border }]}>{selectedProvider === provider.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}</View><View style={styles.providerCopy}><Text style={[styles.providerLabel, { color: colors.foreground }]}>{provider.label}</Text><Text style={[styles.providerDetail, { color: colors.muted }]}>{provider.detail}</Text></View>{provider.id === "managed" && <Text style={[styles.recommended, { color: colors.primary }]}>Recommended</Text>}</Pressable>)}
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.fieldLabelRow}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>Model</Text>{selectedProvider === "managed" && (modelsQuery.isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.liveLabel, { color: colors.success }]}>Live catalog</Text>)}</View>
          <TextInput value={model} onChangeText={setModel} onBlur={saveSettings} placeholder="auto" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} autoCapitalize="none" />
          {selectedProvider === "managed" && managedModels.length > 0 && <View style={styles.modelChips}>{managedModels.map((item) => <Pressable key={item.id} onPress={() => { setModel(item.id); setAISettings({ provider: "managed", model: item.id }); }} style={({ pressed }) => [styles.modelChip, { backgroundColor: `${colors.primary}12` }, pressed && styles.pressed]}><Text style={[styles.modelChipText, { color: colors.primary }]}>{item.id}</Text></Pressable>)}</View>}
          {selectedProvider !== "managed" && <><Text style={[styles.fieldHint, { color: colors.muted }]}>API key</Text><View style={styles.keyRow}><TextInput value={apiKey} onChangeText={setApiKey} placeholder={aiSettings.apiKeyLabel ?? "Paste a key (stored securely)"} placeholderTextColor={colors.muted} style={[styles.input, styles.keyInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} secureTextEntry autoCapitalize="none" /><Pressable onPress={saveKey} style={({ pressed }) => [styles.saveKey, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.saveKeyText}>Save</Text></Pressable></View>{keySaved && <Text style={[styles.savedText, { color: colors.success }]}>Key stored securely on this device.</Text>}</>}
          <Pressable onPress={saveSettings} style={({ pressed }) => [styles.saveSettings, { backgroundColor: `${colors.primary}12` }, pressed && styles.pressed]}><Text style={[styles.saveSettingsText, { color: colors.primary }]}>Use this setup</Text></Pressable>
        </View>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="lock" size={17} color={colors.primary} /><Text style={[styles.infoText, { color: colors.muted }]}>Mindloom is local-first. Notes are stored on this device, and AI requests are only sent when you tap an assistant action.</Text></View>
        <Text style={[styles.footer, { color: colors.muted }]}>Mindloom AI · an open, extensible thinking workspace</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 35 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 16, paddingBottom: 26 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: "800", marginBottom: 5 },
  heading: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 },
  avatar: { width: 43, height: 43, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  sectionIntro: { fontSize: 13, lineHeight: 20, marginBottom: 15 },
  card: { borderWidth: 1, borderRadius: 18, overflow: "hidden", marginBottom: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 15 },
  aiIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardHeaderCopy: { flex: 1, marginLeft: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardCaption: { fontSize: 11, marginTop: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  providerRow: { borderTopWidth: 1, padding: 13, flexDirection: "row", alignItems: "center" },
  radio: { width: 19, height: 19, borderWidth: 1.5, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 9, height: 9, borderRadius: 5 },
  providerCopy: { flex: 1, marginLeft: 10 },
  providerLabel: { fontSize: 13, fontWeight: "700" },
  providerDetail: { fontSize: 11, marginTop: 3 },
  recommended: { fontSize: 10, fontWeight: "800" },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingTop: 15, paddingBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "700" },
  liveLabel: { fontSize: 10, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 11, minHeight: 43, paddingHorizontal: 12, fontSize: 13, marginHorizontal: 15 },
  fieldHint: { fontSize: 12, fontWeight: "700", marginHorizontal: 15, marginTop: 15, marginBottom: 7 },
  keyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  keyInput: { flex: 1, marginRight: 0 },
  saveKey: { borderRadius: 11, minHeight: 43, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", marginRight: 15 },
  saveKeyText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  savedText: { fontSize: 11, marginHorizontal: 15, marginTop: 7 },
  modelChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 15, paddingTop: 10 },
  modelChip: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 },
  modelChipText: { fontSize: 10, fontWeight: "700" },
  saveSettings: { margin: 15, marginTop: 17, minHeight: 41, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  saveSettingsText: { fontSize: 12, fontWeight: "800" },
  infoCard: { borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { textAlign: "center", fontSize: 11, marginTop: 24 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
