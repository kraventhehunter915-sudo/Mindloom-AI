import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getWordCount, useNotes } from "@/lib/notes-context";
import { runExternalAssistant } from "@/lib/ai-providers";
import { trpc } from "@/lib/trpc";

const actionLabels = { summarize: "Summarize", continue: "Continue", outline: "Outline" } as const;
type Action = keyof typeof actionLabels;

export default function NoteEditorScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getNote, updateNote, deleteNote, getBacklinks, aiSettings } = useNotes();
  const note = getNote(id ?? "");
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [aiOutput, setAiOutput] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const assist = trpc.ai.assist.useMutation();

  useEffect(() => {
    if (note) { setTitle(note.title); setContent(note.content); }
  }, [note?.id]);

  useEffect(() => {
    if (!note) return;
    const timeout = setTimeout(() => updateNote(note.id, { title: title.trim() || "Untitled note", content }), 500);
    return () => clearTimeout(timeout);
  }, [content, title, note?.id, updateNote]);

  const backlinks = useMemo(() => note ? getBacklinks(note.title) : [], [getBacklinks, note]);
  if (!note) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  }

  const handleAI = async (action: Action) => {
    setShowActions(false);
    setAiOutput("");
    if (aiSettings.provider !== "managed") {
      try {
        const apiKey = await SecureStore.getItemAsync(`notenest.ai.${aiSettings.provider}.key`);
        if (!apiKey) throw new Error("No provider key saved");
        const text = await runExternalAssistant({ ...aiSettings, apiKey, action, title, content });
        setAiOutput(text.trim() || "The provider returned an empty response.");
      } catch {
        setAiOutput("Add a valid provider key in Settings, then try again. Your note is still safe locally.");
      }
      return;
    }
    assist.mutate({ action, title, content, model: aiSettings.model }, { onSuccess: (data) => setAiOutput(data.text), onError: () => setAiOutput("The managed assistant is unavailable right now. Your note is still safe locally."), });
  };

  const closeEditor = () => { updateNote(note.id, { title: title.trim() || "Untitled note", content }); router.back(); };
  const handleDelete = () => { deleteNote(note.id); router.back(); };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <Pressable onPress={closeEditor} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}><IconSymbol name="arrow-left" size={22} color={colors.foreground} /></Pressable>
          <View style={styles.topMeta}><Text style={[styles.saved, { color: colors.primary }]}>{assist.isPending ? "Thinking…" : "Saved locally"}</Text><Text style={[styles.wordCount, { color: colors.muted }]}>{getWordCount(content)} words</Text></View>
          <View style={styles.topActions}><Pressable onPress={() => setShowActions((value) => !value)} style={({ pressed }) => [styles.aiButton, { backgroundColor: `${colors.primary}15` }, pressed && styles.pressed]}><IconSymbol name="sparkles" size={18} color={colors.primary} /></Pressable><Pressable onPress={() => setShowMore((value) => !value)} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}><IconSymbol name="more" size={22} color={colors.foreground} /></Pressable></View>
        </View>
        {showActions && <View style={[styles.actionTray, { backgroundColor: colors.surface, borderColor: colors.border }]}>{(Object.keys(actionLabels) as Action[]).map((action) => <Pressable key={action} onPress={() => handleAI(action)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><IconSymbol name="sparkles" size={15} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>{actionLabels[action]}</Text></Pressable>)}</View>}
        {showMore && <View style={[styles.moreMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}><Pressable onPress={handleDelete} style={({ pressed }) => [styles.deleteAction, pressed && styles.pressed]}><IconSymbol name="delete" size={17} color={colors.error} /><Text style={[styles.actionText, { color: colors.error }]}>Move to trash</Text></Pressable></View>}
        <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
          <TextInput value={title} onChangeText={setTitle} placeholder="Untitled note" placeholderTextColor={colors.muted} style={[styles.titleInput, { color: colors.foreground }]} multiline />
          <TextInput value={content} onChangeText={setContent} placeholder="Start with a thought…" placeholderTextColor={colors.muted} style={[styles.bodyInput, { color: colors.foreground }]} multiline textAlignVertical="top" autoFocus={!content} />
          {aiOutput ? <View style={[styles.aiOutput, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}35` }]}><View style={styles.aiHeading}><IconSymbol name="sparkles" size={16} color={colors.primary} /><Text style={[styles.aiLabel, { color: colors.primary }]}>ASSISTANT</Text></View><Text style={[styles.aiText, { color: colors.foreground }]}>{aiOutput}</Text><Pressable onPress={() => setContent((value) => `${value}${value ? "\n\n" : ""}${aiOutput}`)} style={({ pressed }) => [styles.insertButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.insertText}>Insert into note</Text></Pressable></View> : null}
          {note.tags.length > 0 && <View style={styles.detailRow}><IconSymbol name="tag" size={15} color={colors.muted} /><View style={styles.tagWrap}>{note.tags.map((tag) => <Text key={tag} style={[styles.detailTag, { color: colors.primary, backgroundColor: `${colors.primary}15` }]}>#{tag}</Text>)}</View></View>}
          {backlinks.length > 0 && <View style={[styles.backlinksCard, { borderTopColor: colors.border }]}><Text style={[styles.backlinkLabel, { color: colors.muted }]}>LINKED FROM</Text>{backlinks.map((backlink) => <Pressable key={backlink.id} onPress={() => router.replace({ pathname: "/note/[id]", params: { id: backlink.id } })} style={({ pressed }) => [styles.backlink, pressed && styles.pressed]}><View style={[styles.backlinkDot, { backgroundColor: colors.primary }]} /><Text style={[styles.backlinkTitle, { color: colors.foreground }]}>{backlink.title}</Text><IconSymbol name="chevron.right" size={16} color={colors.muted} /></Pressable>)}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { height: 61, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  topButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiButton: { width: 35, height: 35, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  topMeta: { alignItems: "center" },
  saved: { fontSize: 11, fontWeight: "700" },
  wordCount: { fontSize: 10, marginTop: 2 },
  actionTray: { position: "absolute", right: 56, top: 55, zIndex: 3, borderWidth: 1, borderRadius: 13, paddingVertical: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  action: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, paddingVertical: 9, minWidth: 130 },
  actionText: { fontSize: 13, fontWeight: "600" },
  moreMenu: { position: "absolute", right: 18, top: 55, zIndex: 3, borderWidth: 1, borderRadius: 13, paddingVertical: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  deleteAction: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, paddingVertical: 9, minWidth: 150 },
  editorContent: { paddingHorizontal: 22, paddingTop: 30, paddingBottom: 50 },
  titleInput: { fontSize: 31, lineHeight: 38, fontWeight: "800", letterSpacing: -0.6, padding: 0, marginBottom: 18 },
  bodyInput: { fontSize: 16, lineHeight: 27, minHeight: 280, padding: 0 },
  aiOutput: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 16 },
  aiHeading: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 },
  aiLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  aiText: { fontSize: 14, lineHeight: 21 },
  insertButton: { alignSelf: "flex-start", borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  insertText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 24 },
  tagWrap: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  detailTag: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: "700" },
  backlinksCard: { borderTopWidth: 1, marginTop: 26, paddingTop: 17 },
  backlinkLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: "800", marginBottom: 10 },
  backlink: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9 },
  backlinkDot: { width: 7, height: 7, borderRadius: 4 },
  backlinkTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
