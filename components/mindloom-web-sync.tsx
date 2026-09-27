import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useNotes, type Note } from "@/lib/notes-context";

export function MindloomWebSync({ children }: { children: React.ReactNode }) {
  const { notes, replaceNotes } = useNotes();
  const web = Platform.OS === "web";
  const remote = trpc.notes.list.useQuery(undefined, {
    // This component is mounted only after MindloomAuthGate confirms a user.
    enabled: web,
    retry: false,
    staleTime: 30_000,
  });
  const save = trpc.notes.save.useMutation();
  const remove = trpc.notes.remove.useMutation();
  const remoteApplied = useRef(false);
  const lastSynced = useRef<Map<string, Note>>(new Map());

  useEffect(() => {
    if (!web || !remote.isSuccess || remoteApplied.current) return;
    const items = (remote.data as Note[]).filter((note) => note.id !== "design-system" && note.id !== "reading-list");
    for (const legacyId of ["design-system", "reading-list"]) {
      if ((remote.data as Note[]).some((note) => note.id === legacyId)) {
        void remove.mutateAsync({ id: legacyId }).catch(() => undefined);
      }
    }
    lastSynced.current = new Map(items.map((note) => [note.id, note]));
    remoteApplied.current = true;
    replaceNotes(items);
  }, [remote.data, remote.isSuccess, remove, replaceNotes, web]);

  useEffect(() => {
    if (!web || !remoteApplied.current) return;
    const timer = setTimeout(() => {
      const currentIds = new Set(notes.map((note) => note.id));
      const deletedIds = [...lastSynced.current.keys()].filter((id) => !currentIds.has(id));
      const changedNotes = notes.filter((note) => {
        const previous = lastSynced.current.get(note.id);
        return !previous || JSON.stringify(previous) !== JSON.stringify(note);
      });

      if (deletedIds.length === 0 && changedNotes.length === 0) return;

      for (const id of deletedIds) {
        void remove.mutateAsync({ id }).catch(() => undefined);
        lastSynced.current.delete(id);
      }
      for (const note of changedNotes) {
        void save.mutateAsync(note).catch(() => undefined);
        lastSynced.current.set(note.id, note);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [notes, remove, save, web]);

  return <>{children}</>;
}
