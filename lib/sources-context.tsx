import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccountScope } from "@/lib/account-scope";

export type SourceKind = "pdf" | "text" | "image" | "link" | "file";
export type Source = { id: string; name: string; kind: SourceKind; mimeType: string; size: number; createdAt: string; url?: string; content?: string; previewData?: string };
type SourcesContextValue = { sources: Source[]; isHydrated: boolean; addSource: (source: Omit<Source, "id" | "createdAt">) => Source; removeSource: (id: string) => void };
const SOURCES_KEY = "mindloom.sources.v1";
const SourcesContext = createContext<SourcesContextValue | null>(null);
const makeId = () => `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const safeSource = (source: Source): Source => ({ ...source, name: source.name.slice(0, 255), content: source.content?.slice(0, 200_000), previewData: source.previewData?.slice(0, 2_800_000), url: source.url?.slice(0, 2048) });

export function SourcesProvider({ children }: { children: React.ReactNode }) {
  const { scope } = useAccountScope();
  const storageKey = `${SOURCES_KEY}.${scope}`;
  const [sources, setSources] = useState<Source[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(false);
    setSources([]);
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (!stored) return;
      try { const parsed = JSON.parse(stored) as Source[]; if (Array.isArray(parsed)) setSources(parsed.map(safeSource)); } catch { setSources([]); }
    }).finally(() => setIsHydrated(true));
  }, [storageKey]);
  useEffect(() => { if (isHydrated) void AsyncStorage.setItem(storageKey, JSON.stringify(sources)); }, [isHydrated, sources, storageKey]);
  const addSource = useCallback((source: Omit<Source, "id" | "createdAt">) => {
    const created = safeSource({ ...source, id: makeId(), createdAt: new Date().toISOString() });
    setSources((current) => [created, ...current.filter((item) => !(created.url && item.url === created.url) && !(created.kind !== "link" && item.name === created.name && item.size === created.size))]);
    return created;
  }, []);
  const removeSource = useCallback((id: string) => setSources((current) => current.filter((source) => source.id !== id)), []);
  const value = useMemo(() => ({ sources, isHydrated, addSource, removeSource }), [sources, isHydrated, addSource, removeSource]);
  return <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>;
}
export function useSources() { const value = useContext(SourcesContext); if (!value) throw new Error("useSources must be used inside SourcesProvider"); return value; }
