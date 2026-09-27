import { useMemo, useRef, useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSources, type Source, type SourceKind } from "@/lib/sources-context";

type BrowserFile = { name: string; type: string; size: number; text: () => Promise<string>; arrayBuffer: () => Promise<ArrayBuffer> };

const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const kindForFile = (file: BrowserFile): SourceKind => {
  const ext = extensionOf(file.name);
  if (file.type === "application/pdf" || ext === "pdf") return "pdf";
  if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (file.type.startsWith("text/") || ["txt", "md", "markdown", "csv", "json"].includes(ext)) return "text";
  return "file";
};
const formatSize = (size: number) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
const sourceIcon = (kind: SourceKind) => kind === "pdf" ? "description" : kind === "image" ? "image" : kind === "link" ? "link" : kind === "text" ? "article" : "attach-file";

export default function SourcesScreen() {
  const colors = useColors();
  const { sources, addSource, removeSource, isHydrated } = useSources();
  const inputRef = useRef<any>(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | SourceKind>("all");
  const filtered = useMemo(() => filter === "all" ? sources : sources.filter((source) => source.kind === filter), [filter, sources]);

  const importFile = async (file: BrowserFile) => {
    setError("");
    if (file.size > 8 * 1024 * 1024) {
      setError("Keep imports under 8 MB for this local-first library.");
      return;
    }
    const kind = kindForFile(file);
    const source: Omit<Source, "id" | "createdAt"> = { name: file.name, kind, mimeType: file.type || "application/octet-stream", size: file.size };
    if (kind === "text") source.content = (await file.text()).slice(0, 200_000);
    if (kind === "image" && file.size <= 2 * 1024 * 1024) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      source.previewData = `data:${file.type || "image/*"};base64,${btoa(binary)}`;
    }
    addSource(source);
  };

  const chooseFile = () => {
    if (Platform.OS !== "web") {
      Alert.alert("Import on web", "The browser source picker is ready in the website build. Native document picking will be added with the mobile release wave.");
      return;
    }
    inputRef.current?.click();
  };

  const addLink = () => {
    const value = link.trim();
    try {
      const url = new URL(value);
      if (!/^https?:$/.test(url.protocol)) throw new Error();
      addSource({ name: url.hostname.replace(/^www\./, ""), kind: "link", mimeType: "text/uri-list", size: 0, url: url.toString() });
      setLink("");
      setError("");
    } catch {
      setError("Paste a valid http:// or https:// web link.");
    }
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={[styles.eyebrow, { color: colors.primary }]}>MINDLOOM / SOURCE LIBRARY</Text><Text style={[styles.heading, { color: colors.foreground }]}>Sources</Text></View>
          <View style={[styles.count, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.countNumber, { color: colors.primary }]}>{sources.length}</Text><Text style={[styles.countLabel, { color: colors.muted }]}>saved</Text></View>
        </View>
        <Text style={[styles.intro, { color: colors.muted }]}>Bring your own context into a notebook. Files stay local in this first source-library release.</Text>
        <View style={[styles.importCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.importTitle}><View style={[styles.importIcon, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="upload" size={19} color={colors.primary} /></View><View style={styles.importCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Add files</Text><Text style={[styles.cardHint, { color: colors.muted }]}>PDF, TXT, Markdown, images, or other files</Text></View></View>
          <Pressable onPress={chooseFile} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><IconSymbol name="add" size={17} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Choose a file</Text></Pressable>
          {Platform.OS === "web" && <input ref={inputRef} type="file" accept=".pdf,.txt,.md,.markdown,.csv,.json,.jpg,.jpeg,.png,.webp,.gif,*/*" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0] as BrowserFile | undefined; if (file) void importFile(file); event.target.value = ""; }} />}
        </View>
        <View style={[styles.importCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.importTitle}><View style={[styles.importIcon, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="link" size={19} color={colors.primary} /></View><View style={styles.importCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Add a web link</Text><Text style={[styles.cardHint, { color: colors.muted }]}>Save an article, reference, or public page</Text></View></View>
          <View style={styles.linkRow}><TextInput value={link} onChangeText={setLink} placeholder="https://example.com/article" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="url" style={[styles.linkInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /><Pressable onPress={addLink} style={({ pressed }) => [styles.addLink, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Add</Text></Pressable></View>
        </View>
        {!!error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
        <View style={styles.libraryHeader}><View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your library</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>{isHydrated ? `${sources.length} source${sources.length === 1 ? "" : "s"} ready for your notebook` : "Loading sources…"}</Text></View><View style={styles.filters}>{(["all", "pdf", "text", "image", "link"] as const).map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, { backgroundColor: filter === value ? `${colors.primary}18` : colors.surface, borderColor: filter === value ? `${colors.primary}55` : colors.border }]}><Text style={[styles.filterText, { color: filter === value ? colors.primary : colors.muted }]}>{value === "all" ? "All" : value.toUpperCase()}</Text></Pressable>)}</View></View>
        {filtered.length === 0 ? <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="folder" size={22} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your source shelf is empty</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Import a source above to make it part of your connected thinking.</Text></View> : filtered.map((source) => <View key={source.id} style={[styles.sourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.sourceType, { backgroundColor: `${colors.primary}15` }]}><IconSymbol name={sourceIcon(source.kind) as any} size={19} color={colors.primary} /></View><View style={styles.sourceCopy}><Text style={[styles.sourceName, { color: colors.foreground }]} numberOfLines={1}>{source.name}</Text><Text style={[styles.sourceMeta, { color: colors.muted }]}>{source.kind.toUpperCase()} · {source.size ? formatSize(source.size) : "Web link"}</Text>{source.url && <Text style={[styles.sourceUrl, { color: colors.primary }]} numberOfLines={1}>{source.url}</Text>}</View>{source.previewData && <Image source={{ uri: source.previewData }} style={styles.preview} />}{source.url && <Pressable onPress={() => { if (Platform.OS === "web") window.open(source.url, "_blank", "noopener,noreferrer"); }} style={styles.openButton}><IconSymbol name="arrow.up.right" size={16} color={colors.primary} /></Pressable>}<Pressable onPress={() => removeSource(source.id)} style={styles.deleteButton}><IconSymbol name="delete" size={17} color={colors.muted} /></Pressable></View>)}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 16, paddingBottom: 12 }, eyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: "800", marginBottom: 5 }, heading: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 }, intro: { fontSize: 13, lineHeight: 20, maxWidth: 520, marginBottom: 18 }, count: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignItems: "center" }, countNumber: { fontSize: 18, fontWeight: "800" }, countLabel: { fontSize: 10 }, importCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 10 }, importTitle: { flexDirection: "row", alignItems: "center", marginBottom: 12 }, importIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }, importCopy: { marginLeft: 10, flex: 1 }, cardTitle: { fontSize: 14, fontWeight: "800" }, cardHint: { fontSize: 11, marginTop: 3 }, primaryButton: { minHeight: 40, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, primaryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, linkRow: { flexDirection: "row", gap: 8 }, linkInput: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, fontSize: 12 }, addLink: { minWidth: 58, minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" }, error: { fontSize: 12, marginBottom: 10 }, libraryHeader: { marginTop: 10, marginBottom: 11 }, sectionTitle: { fontSize: 20, fontWeight: "800" }, sectionHint: { fontSize: 11, marginTop: 3 }, filters: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 12 }, filter: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 }, filterText: { fontSize: 9, fontWeight: "800" }, empty: { borderWidth: 1, borderRadius: 17, padding: 24, alignItems: "center" }, emptyTitle: { fontSize: 15, fontWeight: "800", marginTop: 9 }, emptyText: { textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 260 }, sourceCard: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }, sourceType: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" }, sourceCopy: { flex: 1, minWidth: 0 }, sourceName: { fontSize: 13, fontWeight: "800" }, sourceMeta: { fontSize: 10, marginTop: 4, letterSpacing: 0.5 }, sourceUrl: { fontSize: 10, marginTop: 4 }, preview: { width: 42, height: 42, borderRadius: 8 }, openButton: { padding: 5 }, deleteButton: { padding: 5 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
