import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SourceKind = "pdf" | "text" | "image" | "link" | "file";

export type Source = {
  id: string;
  name: string;
  kind: SourceKind;
  mimeType: string;
  size: number;
  createdAt: string;
  url?: string;
  content?: string;
  previewData?: string;
};

type SourcesContextValue = {
  sources: Source[];
  isHydrated: boolean;
  addSource: (source: Omit<Source, "id" | "createdAt">) => Source;
  removeSource: (id: string) => void;
};

const SOURCES_KEY = "mindloom.sources.v1";
const SourcesContext = createContext<SourcesContextValue | null>(null);
const makeId = () => `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function SourcesProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SOURCES_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored) as Source[];
          if (Array.isArray(parsed)) setSources(parsed);
        } catch {
          // Keep an empty library when stored data is malformed.
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (isHydrated) void AsyncStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
  }, [isHydrated, sources]);

  const addSource = useCallback((source: Omit<Source, "id" | "createdAt">) => {
    const created: Source = { ...source, id: makeId(), createdAt: new Date().toISOString() };
    setSources((current) => [created, ...current]);
    return created;
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources((current) => current.filter((source) => source.id !== id));
  }, []);

  const value = useMemo(() => ({ sources, isHydrated, addSource, removeSource }), [sources, isHydrated, addSource, removeSource]);
  return <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>;
}

export function useSources() {
  const value = useContext(SourcesContext);
  if (!value) throw new Error("useSources must be used inside SourcesProvider");
  return value;
}
