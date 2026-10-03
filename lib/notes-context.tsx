import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccountScope } from "./account-scope";

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AISettings = {
  provider: "managed" | "openai" | "anthropic" | "google" | "ollama";
  model: string;
  apiKeyLabel?: string;
};

type NotesContextValue = {
  notes: Note[];
  aiSettings: AISettings;
  isHydrated: boolean;
  createNote: (seed?: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  setAISettings: (settings: AISettings) => void;
  getNote: (id: string) => Note | undefined;
  getBacklinks: (title: string) => Note[];
  getOutgoingLinks: (content: string) => string[];
  replaceNotes: (items: Note[]) => void;
};

const NOTES_KEY = "mindloom.notes.v1";
const AI_KEY = "mindloom.ai-settings.v1";
const starterNotes: Note[] = [{
  id: "welcome",
  title: "Welcome to Mindloom AI",
  content: "A quiet place for connected thinking.\n\nAdd #tags anywhere in a note and use the Graph tab to see how your thoughts connect.\n\nThe assistant can summarize, continue, or suggest structure without leaving your note.",
  tags: ["welcome", "guide"],
  folder: "Getting started",
  pinned: true,
  createdAt: "2026-09-20T10:00:00.000Z",
  updatedAt: "2026-09-23T09:20:00.000Z",
}];

const nowISO = () => new Date().toISOString();
const makeId = () => `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const extractLinks = (content: string) => Array.from(new Set(Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g)).map((match) => match[1].trim()).filter(Boolean)));
const extractTags = (content: string) => Array.from(new Set(Array.from(content.matchAll(/(?:^|\s)#([a-zA-Z0-9_-]+)/g)).map((match) => match[1].toLowerCase())));
const mergeTags = (content: string, explicitTags: string[] = []) => Array.from(new Set([...explicitTags, ...extractTags(content)].map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean)));
const sortNotes = (items: Note[]) => [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
const isWelcomeNote = (note: Note) => note.id === "welcome" || note.title.trim().toLowerCase() === "welcome to mindloom ai";
const normalizeNotes = (items: Note[]) => {
  let welcomeFound = false;
  return items.filter((note) => {
    if (!isWelcomeNote(note)) return true;
    if (welcomeFound) return false;
    welcomeFound = true;
    return true;
  });
};

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { scope } = useAccountScope();
  const notesKey = `${NOTES_KEY}.${scope}`;
  const aiKey = `${AI_KEY}.${scope}`;
  const [notes, setNotes] = useState<Note[]>(starterNotes);
  const [aiSettings, setAISettingsState] = useState<AISettings>({ provider: "managed", model: "auto" });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(false);
    setNotes(starterNotes);
    setAISettingsState({ provider: "managed", model: "auto" });
    Promise.all([AsyncStorage.getItem(notesKey), AsyncStorage.getItem(aiKey)])
      .then(([storedNotes, storedAI]) => {
        if (storedNotes) {
          try {
            const parsed = JSON.parse(storedNotes) as Note[];
            if (Array.isArray(parsed)) {
              const migrated = parsed.filter((note) => note.id !== "design-system" && note.id !== "reading-list");
              setNotes(sortNotes(normalizeNotes(migrated.length > 0 ? migrated : starterNotes)));
            }
          } catch {
            setNotes(starterNotes);
          }
        }
        if (storedAI) {
          try {
            const parsed = JSON.parse(storedAI) as AISettings;
            if (parsed && typeof parsed.provider === "string" && typeof parsed.model === "string") setAISettingsState(parsed);
          } catch {
            setAISettingsState({ provider: "managed", model: "auto" });
          }
        }
      })
      .finally(() => setIsHydrated(true));
  }, [aiKey, notesKey]);

  useEffect(() => { if (isHydrated) void AsyncStorage.setItem(notesKey, JSON.stringify(notes)); }, [isHydrated, notes, notesKey]);

  const createNote = useCallback((seed: Partial<Note> = {}) => {
    const timestamp = nowISO();
    const note: Note = { id: makeId(), title: seed.title ?? "Untitled note", content: seed.content ?? "", tags: mergeTags(seed.content ?? "", seed.tags), folder: seed.folder ?? "Inbox", pinned: seed.pinned ?? false, createdAt: seed.createdAt ?? timestamp, updatedAt: timestamp };
    setNotes((current) => sortNotes([note, ...current]));
    return note;
  }, []);
  const updateNote = useCallback((id: string, patch: Partial<Note>) => setNotes((current) => sortNotes(current.map((note) => note.id === id ? { ...note, ...patch, tags: mergeTags(patch.content ?? note.content, patch.tags ?? note.tags), updatedAt: nowISO() } : note))), []);
  const deleteNote = useCallback((id: string) => setNotes((current) => current.filter((note) => note.id !== id)), []);
  const togglePin = useCallback((id: string) => setNotes((current) => sortNotes(current.map((note) => note.id === id ? { ...note, pinned: !note.pinned, updatedAt: nowISO() } : note))), []);
  const setAISettings = useCallback((settings: AISettings) => { setAISettingsState(settings); void AsyncStorage.setItem(aiKey, JSON.stringify(settings)); }, [aiKey]);
  const getNote = useCallback((id: string) => notes.find((note) => note.id === id), [notes]);
  const getBacklinks = useCallback((title: string) => notes.filter((note) => extractLinks(note.content).some((link) => link.toLowerCase() === title.toLowerCase())), [notes]);
  const getOutgoingLinks = useCallback((content: string) => extractLinks(content), []);
  const replaceNotes = useCallback((items: Note[]) => { setNotes(sortNotes(normalizeNotes(items.length > 0 ? items : starterNotes))); setIsHydrated(true); }, []);
  const value = useMemo(() => ({ notes, aiSettings, isHydrated, createNote, updateNote, deleteNote, togglePin, setAISettings, getNote, getBacklinks, getOutgoingLinks, replaceNotes }), [notes, aiSettings, isHydrated, createNote, updateNote, deleteNote, togglePin, setAISettings, getNote, getBacklinks, getOutgoingLinks, replaceNotes]);
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() { const value = useContext(NotesContext); if (!value) throw new Error("useNotes must be used inside NotesProvider"); return value; }
export function getWordCount(text: string) { return text.trim() ? text.trim().split(/\s+/).length : 0; }
export function getPreview(text: string, length = 120) { return text.replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\n+/g, " ").trim().slice(0, length); }
export { extractLinks, extractTags, isWelcomeNote, normalizeNotes };
