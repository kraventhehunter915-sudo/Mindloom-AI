import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getPreview, useNotes, type Note } from "@/lib/notes-context";
import { trpc } from "@/lib/trpc";

const formatDate = (date: string) => {
  const value = new Date(date);
  const today = new Date();
  if (value.toDateString() === today.toDateString()) {
    return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return value.toLocaleDateString([], { month: "short", day: "numeric" });
};

function NoteCard({
  note,
  onPress,
  onPin,
}: {
  note: Note;
  onPress: () => void;
  onPin: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.noteCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.noteCardTop}>
        <View style={styles.folderRow}>
          <IconSymbol name="folder" size={14} color={colors.muted} />
          <Text style={[styles.folderText, { color: colors.muted }]}>
            {note.folder}
          </Text>
        </View>
        <Pressable
          onPress={onPin}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <IconSymbol
            name={note.pinned ? "pin" : "pin-outline"}
            size={17}
            color={note.pinned ? colors.primary : colors.muted}
          />
        </Pressable>
      </View>
      <Text
        style={[styles.noteTitle, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {note.title}
      </Text>
      <Text
        style={[styles.notePreview, { color: colors.muted }]}
        numberOfLines={3}
      >
        {getPreview(note.content) || "Start writing your next thought…"}
      </Text>
      <View style={styles.noteFooter}>
        <View style={styles.tagsRow}>
          {note.tags.slice(0, 2).map((tag) => (
            <Text
              key={tag}
              style={[
                styles.tag,
                {
                  color: colors.primary,
                  backgroundColor: `${colors.primary}15`,
                },
              ]}
            >
              #{tag}
            </Text>
          ))}
        </View>
        <Text style={[styles.dateText, { color: colors.muted }]}>
          {formatDate(note.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function MiniNav({
  active,
  label,
  icon,
  onPress,
}: {
  active?: boolean;
  label: string;
  icon: "note.text" | "share" | "settings";
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.miniNavItem,
        active && { backgroundColor: `${colors.primary}14` },
        pressed && styles.pressed,
      ]}
    >
      <IconSymbol
        name={icon}
        size={18}
        color={active ? colors.primary : colors.muted}
      />
      <Text
        style={[
          styles.miniNavLabel,
          { color: active ? colors.primary : colors.muted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AIWorkspace({
  notes,
  onOpenSettings,
}: {
  notes: Note[];
  onOpenSettings: () => void;
}) {
  const colors = useColors();
  const [prompt, setPrompt] = useState(
    "What themes keep appearing in my notes?",
  );
  const ask = trpc.ai.ask.useMutation();
  const askMindloom = () =>
    ask.mutate({
      prompt,
      noteIds: notes.slice(0, 8).map((note) => note.id),
      model: "auto",
    });
  return (
    <View
      style={[
        styles.aiPanel,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.aiPanelHeader}>
        <View
          style={[styles.aiIcon, { backgroundColor: `${colors.primary}18` }]}
        >
          <IconSymbol name="sparkles" size={18} color={colors.primary} />
        </View>
        <View style={styles.aiHeadingWrap}>
          <Text style={[styles.aiTitle, { color: colors.foreground }]}>
            Ask Mindloom
          </Text>
          <Text style={[styles.aiSubtitle, { color: colors.muted }]}>
            Your notes, connected.
          </Text>
        </View>
        <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
      </View>
      <View
        style={[
          styles.aiPromptCard,
          {
            backgroundColor: `${colors.primary}0A`,
            borderColor: `${colors.primary}22`,
          },
        ]}
      >
        <Text style={[styles.aiPromptLabel, { color: colors.primary }]}>
          TRY ASKING
        </Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          style={[styles.aiPromptInput, { color: colors.foreground }]}
        />
        <Pressable
          onPress={askMindloom}
          disabled={ask.isPending || notes.length === 0}
          style={({ pressed }) => [
            styles.askButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
            ask.isPending && styles.disabled,
          ]}
        >
          <Text style={styles.askButtonText}>
            {ask.isPending ? "Thinking…" : "Ask from these notes"}
          </Text>
          <IconSymbol name="paperplane.fill" size={14} color="#FFFFFF" />
        </Pressable>
      </View>
      {!!ask.data?.text && (
        <View
          style={[
            styles.answerCard,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.answerLabel, { color: colors.primary }]}>
            MINDLOOM ANSWER
          </Text>
          <Text
            style={[styles.answerText, { color: colors.foreground }]}
            numberOfLines={6}
          >
            {ask.data.text}
          </Text>
          {ask.data.sources.length > 0 && (
            <Text style={[styles.citationText, { color: colors.muted }]}>
              Sources:{" "}
              {ask.data.sources
                .map((source) => `[${source.index}] ${source.title}`)
                .join(" · ")}
            </Text>
          )}
        </View>
      )}
      <View style={styles.sourceBlock}>
        <View style={styles.sourceHeader}>
          <Text style={[styles.sourceLabel, { color: colors.muted }]}>
            CURRENT SOURCES
          </Text>
          <Text style={[styles.sourceCount, { color: colors.primary }]}>
            3 notes
          </Text>
        </View>
        {["Welcome to Mindloom", "Design system", "Reading list"].map(
          (source, index) => (
            <View key={source} style={styles.sourceRow}>
              <View
                style={[
                  styles.sourceNumber,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Text
                  style={[styles.sourceNumberText, { color: colors.primary }]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[styles.sourceName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {source}
              </Text>
              <IconSymbol name="chevron.right" size={14} color={colors.muted} />
            </View>
          ),
        )}
      </View>
      <Pressable
        onPress={onOpenSettings}
        style={({ pressed }) => [
          styles.modelButton,
          { borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <IconSymbol name="settings" size={14} color={colors.muted} />
        <Text style={[styles.modelText, { color: colors.muted }]}>
          Managed AI · Auto model
        </Text>
        <IconSymbol name="chevron.right" size={14} color={colors.muted} />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 1100;
  const { notes, createNote, togglePin, isHydrated } = useNotes();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return notes;
    return notes.filter((note) =>
      `${note.title} ${note.content} ${note.tags.join(" ")}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [notes, query]);
  const handleNewNote = () => {
    const note = createNote();
    router.push({ pathname: "/note/[id]", params: { id: note.id } });
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <View style={[styles.shell, desktop && styles.desktopShell]}>
        {desktop && (
          <View
            style={[styles.contextRail, { borderRightColor: colors.border }]}
          >
            <View style={styles.brand}>
              <View
                style={[
                  styles.brandMark,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Image
                  source={require("../../assets/images/mindloom-logo-cropped.png")}
                  style={styles.brandMarkImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>
                Mindloom
              </Text>
            </View>
            <Text style={[styles.railEyebrow, { color: colors.muted }]}>
              PERSONAL SPACE
            </Text>
            <MiniNav
              active
              label="Notes"
              icon="note.text"
              onPress={() => router.replace("/")}
            />
            <MiniNav
              label="Graph"
              icon="share"
              onPress={() => router.push("/graph")}
            />
            <View style={styles.railGap} />
            <MiniNav
              label="Settings"
              icon="settings"
              onPress={() => router.push("/settings")}
            />
            <View
              style={[
                styles.accountChip,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: `${colors.primary}22` },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  Y
                </Text>
              </View>
              <View>
                <Text
                  style={[styles.accountName, { color: colors.foreground }]}
                >
                  Your space
                </Text>
                <Text style={[styles.accountMeta, { color: colors.muted }]}>
                  Local workspace
                </Text>
              </View>
            </View>
          </View>
        )}
        <View style={styles.mainColumn}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>
                MINDLOOM / PERSONAL SPACE
              </Text>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Notes
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setShowSearch((value) => !value)}
                style={({ pressed }) => [
                  styles.roundButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <IconSymbol name="search" size={19} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={handleNewNote}
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                <IconSymbol name="add" size={22} color="#FFFFFF" />
                <Text style={styles.addLabel}>New note</Text>
              </Pressable>
            </View>
          </View>
          {showSearch && (
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <IconSymbol name="search" size={17} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                autoFocus
                placeholder="Search notes, tags, ideas…"
                placeholderTextColor={colors.muted}
                style={[styles.searchInput, { color: colors.foreground }]}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")}>
                  <IconSymbol name="close" size={17} color={colors.muted} />
                </Pressable>
              )}
            </View>
          )}
          <View style={styles.subhead}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Your library
              </Text>
              <Text style={[styles.sectionMeta, { color: colors.muted }]}>
                {isHydrated
                  ? `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"} · ideas in motion`
                  : "Loading your space…"}
              </Text>
            </View>
            {!desktop && (
              <Pressable
                onPress={() => router.push("/graph")}
                style={({ pressed }) => [
                  styles.graphChip,
                  { backgroundColor: `${colors.primary}12` },
                  pressed && styles.pressed,
                ]}
              >
                <IconSymbol name="share" size={15} color={colors.primary} />
                <Text style={[styles.graphChipText, { color: colors.primary }]}>
                  Open graph
                </Text>
              </Pressable>
            )}
          </View>
          <FlatList
            data={filteredNotes}
            keyExtractor={(item) => item.id}
            numColumns={desktop ? 2 : 1}
            columnWrapperStyle={desktop ? styles.columnGap : undefined}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() =>
                  router.push({
                    pathname: "/note/[id]",
                    params: { id: item.id },
                  })
                }
                onPin={() => togglePin(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No notes match that search
                </Text>
                <Text style={[styles.emptyCopy, { color: colors.muted }]}>
                  Try a title, tag, or a word from the note.
                </Text>
              </View>
            }
          />
        </View>
        {desktop && (
          <View style={styles.aiColumn}>
            <AIWorkspace
              notes={notes}
              onOpenSettings={() => router.push("/settings")}
            />
            <View
              style={[
                styles.tipCard,
                {
                  backgroundColor: `${colors.primary}0A`,
                  borderColor: `${colors.primary}18`,
                },
              ]}
            >
              <Text style={[styles.tipLabel, { color: colors.primary }]}>
                A CALMER WAY TO THINK
              </Text>
              <Text style={[styles.tipText, { color: colors.foreground }]}>
                Capture first. Connect later. Let the shape of your thinking
                emerge.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, width: "100%" },
  desktopShell: { flexDirection: "row", alignSelf: "center", maxWidth: 1480 },
  contextRail: {
    width: 206,
    borderRightWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 20,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 34,
  },
  brandMark: {
    width: 31,
    height: 31,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  brandMarkText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  brandMarkImage: { width: 27, height: 16 },
  brandName: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  railEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  miniNavItem: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 11,
    borderRadius: 12,
    marginBottom: 5,
  },
  miniNavLabel: { fontSize: 13, fontWeight: "700" },
  railGap: { flex: 1 },
  accountChip: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", fontSize: 12 },
  accountName: { fontSize: 11, fontWeight: "700" },
  accountMeta: { fontSize: 9, marginTop: 2 },
  mainColumn: { flex: 1, minWidth: 0, paddingHorizontal: 28 },
  aiColumn: { width: 310, paddingTop: 28, paddingRight: 28, gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    paddingBottom: 22,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    marginBottom: 4,
  },
  heading: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  headerActions: { flexDirection: "row", gap: 9, alignItems: "center" },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  searchBar: {
    borderWidth: 1,
    borderRadius: 15,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 9,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 11 },
  subhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 19, fontWeight: "800" },
  sectionMeta: { fontSize: 12, marginTop: 4 },
  graphChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  graphChipText: { fontSize: 12, fontWeight: "700" },
  listContent: { paddingBottom: 34, gap: 13 },
  columnGap: { gap: 13 },
  noteCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 156,
    shadowColor: "#1D2620",
    shadowOpacity: 0.045,
    shadowRadius: 16,
    elevation: 2,
  },
  noteCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  folderRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  folderText: { fontSize: 11, fontWeight: "600" },
  iconButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  noteTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    marginBottom: 5,
  },
  notePreview: { fontSize: 13, lineHeight: 19, minHeight: 38 },
  noteFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
  },
  tagsRow: { flexDirection: "row", gap: 6, flex: 1 },
  tag: {
    borderRadius: 9,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: "700",
  },
  dateText: { fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyCopy: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 7,
    lineHeight: 19,
  },
  aiPanel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 17,
    shadowColor: "#1D2620",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  aiPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  aiIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  aiHeadingWrap: { flex: 1 },
  aiTitle: { fontSize: 15, fontWeight: "800" },
  aiSubtitle: { fontSize: 11, marginTop: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  aiPromptCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    marginBottom: 18,
  },
  aiPromptLabel: {
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "800",
    marginBottom: 7,
  },
  aiPrompt: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  aiPromptInput: { fontSize: 13, lineHeight: 19, minHeight: 42, padding: 0 },
  askButton: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 11,
  },
  askButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  answerCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "800",
    marginBottom: 7,
  },
  answerText: { fontSize: 12, lineHeight: 18 },
  citationText: { fontSize: 10, lineHeight: 15, marginTop: 9 },
  sourceBlock: { gap: 10 },
  sourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  sourceLabel: { fontSize: 9, letterSpacing: 1.1, fontWeight: "800" },
  sourceCount: { fontSize: 10, fontWeight: "700" },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  sourceNumber: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceNumberText: { fontSize: 10, fontWeight: "800" },
  sourceName: { flex: 1, fontSize: 12, fontWeight: "600" },
  modelButton: {
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  modelText: { flex: 1, fontSize: 10, fontWeight: "600" },
  tipCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  tipLabel: {
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "800",
    marginBottom: 8,
  },
  tipText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
