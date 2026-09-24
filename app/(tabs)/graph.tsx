import { useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { extractLinks, useNotes } from "@/lib/notes-context";

const positions = [
  { x: 0.5, y: 0.47 },
  { x: 0.23, y: 0.27 },
  { x: 0.79, y: 0.3 },
  { x: 0.28, y: 0.72 },
  { x: 0.76, y: 0.73 },
  { x: 0.5, y: 0.15 },
];

export default function GraphScreen() {
  const colors = useColors();
  const router = useRouter();
  const { notes } = useNotes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const width = Math.min(Dimensions.get("window").width - 40, 520);
  const height = 400;
  const nodes = useMemo(() => notes.map((note, index) => ({ ...note, x: width * (positions[index % positions.length].x), y: height * positions[index % positions.length].y })), [notes, width]);
  const edges = useMemo(() => nodes.flatMap((node) => extractLinks(node.content).map((title) => {
    const target = nodes.find((candidate) => candidate.title.toLowerCase() === title.toLowerCase());
    return target ? { from: node, to: target } : null;
  }).filter(Boolean)), [nodes]);
  const selected = nodes.find((node) => node.id === selectedId);

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>MINDLOOM / KNOWLEDGE MAP</Text>
          <Text style={[styles.heading, { color: colors.foreground }]}>Graph</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{notes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>notes</Text>
        </View>
      </View>
      <Text style={[styles.intro, { color: colors.muted }]}>Every [[link]] becomes a thread. Tap a node to follow an idea.</Text>
      <View style={[styles.graphCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Svg width={width} height={height}>
          {edges.map((edge, index) => edge && <Line key={`${edge.from.id}-${edge.to.id}-${index}`} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} stroke={colors.border} strokeWidth={1.5} strokeDasharray="4 5" />)}
          {nodes.map((node) => <Circle key={node.id} cx={node.x} cy={node.y} r={node.id === selectedId ? 25 : 19} fill={node.id === selectedId ? colors.primary : `${colors.primary}28`} stroke={node.id === selectedId ? colors.primary : colors.primary} strokeWidth={node.id === selectedId ? 3 : 1.5} />)}
          {nodes.map((node) => <SvgText key={`${node.id}-label`} x={node.x} y={node.y + 42} fill={colors.foreground} fontSize="11" fontWeight="600" textAnchor="middle">{node.title.length > 18 ? `${node.title.slice(0, 16)}…` : node.title}</SvgText>)}
        </Svg>
        {nodes.map((node) => <Pressable key={`${node.id}-hit`} onPress={() => setSelectedId(node.id)} style={[styles.nodeHit, { left: node.x - 28, top: node.y - 28 }]} />)}
      </View>
      <View style={styles.legend}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={[styles.legendText, { color: colors.muted }]}>Tap to inspect a note</Text><View style={[styles.legendLine, { backgroundColor: colors.border }]} /><Text style={[styles.legendText, { color: colors.muted }]}>Backlinks</Text></View>
      {selected ? <Pressable onPress={() => router.push({ pathname: "/note/[id]", params: { id: selected.id } })} style={({ pressed }) => [styles.selectedCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}42` }, pressed && styles.pressed]}>
        <View style={styles.selectedCopy}><Text style={[styles.selectedEyebrow, { color: colors.primary }]}>SELECTED NOTE</Text><Text style={[styles.selectedTitle, { color: colors.foreground }]}>{selected.title}</Text><Text style={[styles.selectedMeta, { color: colors.muted }]}>{extractLinks(selected.content).length} outgoing links · {selected.tags.length} tags</Text></View><IconSymbol name="chevron.right" size={20} color={colors.primary} />
      </Pressable> : <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="sparkles" size={18} color={colors.primary} /><Text style={[styles.tip, { color: colors.muted }]}>Add a [[link]] in any note to grow your map.</Text></View>}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 16, paddingBottom: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: "800", marginBottom: 5 },
  heading: { fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.8 },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 17, maxWidth: 310 },
  statPill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignItems: "center", minWidth: 58 },
  statNumber: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, marginTop: -1 },
  graphCard: { borderWidth: 1, borderRadius: 20, overflow: "hidden", alignItems: "center", minHeight: 402 },
  nodeHit: { width: 56, height: 56, position: "absolute", borderRadius: 28 },
  legend: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 14, marginBottom: 18 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLine: { width: 18, height: 1, marginLeft: 9 },
  legendText: { fontSize: 11 },
  selectedCard: { borderWidth: 1, borderRadius: 17, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedCopy: { flex: 1 },
  selectedEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginBottom: 4 },
  selectedTitle: { fontSize: 17, fontWeight: "700" },
  selectedMeta: { fontSize: 12, marginTop: 4 },
  tipCard: { borderWidth: 1, borderRadius: 17, padding: 15, flexDirection: "row", gap: 9, alignItems: "center" },
  tip: { fontSize: 13, flex: 1, lineHeight: 19 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
