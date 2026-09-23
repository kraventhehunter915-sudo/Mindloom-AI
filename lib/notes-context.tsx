import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
};

const NOTES_KEY = "notenest.notes.v1";
const AI_KEY = "notenest.ai-settings.v1";

const starterNotes: Note[] = [
  {
    id: "welcome",
    title: "Welcome to NoteNest",
    content:
      "A quiet place for connected thinking.\n\nTry linking ideas with [[Design system]] or [[Reading list]]. Add #tags anywhere in a note and use the Graph tab to see how your thoughts connect.\n\nThe assistant can summarize, continue, or suggest structure without leaving your note.",
    tags: ["welcome", "guide"],
    folder: "Getting started",
    pinned: true,
    createdAt: "2026-09-20T10:00:00.000Z",
    updatedAt: "2026-09-23T09:20:00.000Z",
  },
  {
    id: "design-system",
    title: "Design system",
    content:
      "A small visual language for NoteNest: warm paper, ink, and a single green accent.\n\nPrinciples\n- Make capture feel immediate\n- Keep AI actions close to the cursor\n- Prefer calm hierarchy over chrome\n\nSee also: [[Welcome to NoteNest]] and [[Reading list]]",
    tags: ["product", "design"],
    folder: "Projects",
    pinned: false,
    createdAt: "2026-09-21T08:45:00.000Z",
    updatedAt: "2026-09-22T16:30:00.000Z",
  },
  {
    id: "reading-list",
    title: "Reading list",
    content:
      "Books and essays to return to.\n\n- The Art of Memory\n- Ways of Seeing\n- Designing for Focus\n\nThe common thread is attention as a design material. This connects back to [[Design system]].",
    tags: ["reading", "ideas"],
    folder: "Inbox",
    pinned: false,
    createdAt: "2026-09-22T11:15:00.000Z",
    updatedAt: "2026-09-23T08:05:00.000Z",
  },
];

const nowISO = () => new Date().toISOString();
const makeId = () => `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const extractLinks = (content: string) => {
  const links = Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g)).map((match) => match[1].trim());
  return Array.from(new Set(links.filter(Boolean)));
};

const extractTags = (content: string) => {
  const tags = Array.from(content.matchAll(/(?:^|\s)#([a-zA-Z0-9_-]+)/g)).map((match) => match[1].toLowerCase());
  return Array.from(new Set(tags));
};

const mergeTags = (content: string, explicitTags: string[] = []) =>
  Array.from(new Set([...explicitTags, ...extractTags(content)].map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean)));

const sortNotes = (items: Note[]) =>
  [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(starterNotes);
  const [aiSettings, setAISettingsState] = useState<AISettings>({ provider: "managed", model: "auto" });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(NOTES_KEY), AsyncStorage.getItem(AI_KEY)])
      .then(([storedNotes, storedAI]) => {
        if (storedNotes) {
          try {
            const parsed = JSON.parse(storedNotes) as Note[];
            if (Array.isArray(parsed) && parsed.length > 0) setNotes(sortNotes(parsed));
          } catch {
            // Keep the curated starter notes when storage is malformed.
          }
        }
        if (storedAI) {
          try {
            setAISettingsState(JSON.parse(storedAI) as AISettings);
          } catch {
            // Keep defaults when storage is malformed.
          }
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (isHydrated) void AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [isHydrated, notes]);

  const createNote = useCallback((seed: Partial<Note> = {}) => {
    const timestamp = nowISO();
    const note: Note = {
      id: makeId(),
      title: seed.title ?? "Untitled note",
      content: seed.content ?? "",
      tags: mergeTags(seed.content ?? "", seed.tags),
      folder: seed.folder ?? "Inbox",
      pinned: seed.pinned ?? false,
      createdAt: seed.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    setNotes((current) => sortNotes([note, ...current]));
    return note;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((current) => sortNotes(current.map((note) => note.id === id
      ? { ...note, ...patch, tags: mergeTags(patch.content ?? note.content, patch.tags ?? note.tags), updatedAt: nowISO() }
      : note)));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes((current) => sortNotes(current.map((note) => note.id === id ? { ...note, pinned: !note.pinned, updatedAt: nowISO() } : note)));
  }, []);

  const setAISettings = useCallback((settings: AISettings) => {
    setAISettingsState(settings);
    void AsyncStorage.setItem(AI_KEY, JSON.stringify(settings));
  }, []);

  const getNote = useCallback((id: string) => notes.find((note) => note.id === id), [notes]);
  const getBacklinks = useCallback((title: string) => notes.filter((note) => extractLinks(note.content).some((link) => link.toLowerCase() === title.toLowerCase())), [notes]);
  const getOutgoingLinks = useCallback((content: string) => extractLinks(content), []);

  const value = useMemo(() => ({ notes, aiSettings, isHydrated, createNote, updateNote, deleteNote, togglePin, setAISettings, getNote, getBacklinks, getOutgoingLinks }), [notes, aiSettings, isHydrated, createNote, updateNote, deleteNote, togglePin, setAISettings, getNote, getBacklinks, getOutgoingLinks]);
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const value = useContext(NotesContext);
  if (!value) throw new Error("useNotes must be used inside NotesProvider");
  return value;
}

export function getWordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function getPreview(text: string, length = 120) {
  return text.replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\n+/g, " ").trim().slice(0, length);
}

export { extractLinks, extractTags };
