import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getPreview, useNotes, type Note } from "@/lib/notes-context";

const formatDate = (date: string) => {
  const value = new Date(date);
  const today = new Date();
  if (value.toDateString() === today.toDateString()) return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return value.toLocaleDateString([], { month: "short", day: "numeric" });
};

function NoteCard({ note, onPress, onPin }: { note: Note; onPress: () => void; onPin: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <View style={styles.folderRow}>
          <IconSymbol name="folder" size={14} color={colors.muted} />
          <Text style={[styles.folder, { color: colors.muted }]}>{note.folder}</Text>
        </View>
        <Pressable onPress={onPin} hitSlop={10} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <IconSymbol name={note.pinned ? "pin" : "pin-outline"} size={17} color={note.pinned ? colors.primary : colors.muted} />
        </Pressable>
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{note.title}</Text>
      <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={2}>{getPreview(note.content) || "Start writing your next thought…"}</Text>
      <View style={styles.cardBottom}>
        <View style={styles.tagsRow}>
          {note.tags.slice(0, 2).map((tag) => <Text key={tag} style={[styles.tag, { color: colors.primary, backgroundColor: `${colors.primary}15` }]}>#{tag}</Text>)}
        </View>
        <Text style={[styles.date, { color: colors.muted }]}>{formatDate(note.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { notes, createNote, togglePin, isHydrated } = useNotes();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return notes;
    return notes.filter((note) => `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase().includes(normalized));
  }, [notes, query]);

  const handleNewNote = () => {
    const note = createNote();
    router.push({ pathname: "/note/[id]", params: { id: note.id } });
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR SPACE</Text>
          <Text style={[styles.heading, { color: colors.foreground }]}>Notes</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowSearch((value) => !value)} style={({ pressed }) => [styles.roundButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <IconSymbol name="search" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={handleNewNote} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
            <IconSymbol name="add" size={23} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {showSearch && <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="search" size={18} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} autoFocus placeholder="Search notes, tags, ideas…" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" />
        {query.length > 0 && <Pressable onPress={() => setQuery("")}><IconSymbol name="close" size={17} color={colors.muted} /></Pressable>}
      </View>}

      <View style={styles.subhead}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All notes</Text>
          <Text style={[styles.sectionMeta, { color: colors.muted }]}>{isHydrated ? `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"}` : "Loading your space…"}</Text>
        </View>
        <Pressable onPress={() => router.push("/graph")} style={({ pressed }) => [styles.graphChip, { backgroundColor: `${colors.primary}12` }, pressed && styles.pressed]}>
          <IconSymbol name="share" size={15} color={colors.primary} />
          <Text style={[styles.graphChipText, { color: colors.primary }]}>View graph</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NoteCard note={item} onPress={() => router.push({ pathname: "/note/[id]", params: { id: item.id } })} onPin={() => togglePin(item.id)} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notes match that search</Text><Text style={[styles.emptyCopy, { color: colors.muted }]}>Try a title, tag, or a word from the note.</Text></View>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 18 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: "800", marginBottom: 5 },
  heading: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 },
  headerActions: { flexDirection: "row", gap: 9, alignItems: "center" },
  roundButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  addButton: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  searchBar: { borderWidth: 1, borderRadius: 15, minHeight: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 9, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 11 },
  subhead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  sectionMeta: { fontSize: 12, marginTop: 3 },
  graphChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 16 },
  graphChipText: { fontSize: 12, fontWeight: "700" },
  listContent: { paddingBottom: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 146 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  folderRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  folder: { fontSize: 11, fontWeight: "600" },
  iconButton: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, lineHeight: 23, fontWeight: "700", marginBottom: 5 },
  preview: { fontSize: 13, lineHeight: 19, minHeight: 38 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 13 },
  tagsRow: { flexDirection: "row", gap: 6, flex: 1 },
  tag: { borderRadius: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: "700" },
  date: { fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyCopy: { fontSize: 13, textAlign: "center", marginTop: 7, lineHeight: 19 },
});
