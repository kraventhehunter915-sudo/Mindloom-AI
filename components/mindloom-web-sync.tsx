import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useNotes, type Note } from "@/lib/notes-context";

export function MindloomWebSync({ children }: { children: React.ReactNode }) {
  const { notes, replaceNotes } = useNotes();
  const web = Platform.OS === "web";
  const account = trpc.auth.me.useQuery(undefined, { enabled: web, retry: false, staleTime: 30_000 });
  const remote = trpc.notes.list.useQuery(undefined, { enabled: web && !!account.data, retry: false });
  const save = trpc.notes.save.useMutation();
  const remove = trpc.notes.remove.useMutation();
  const remoteApplied = useRef(false);
  const previousIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!web || !remote.isSuccess || remoteApplied.current) return;
    const items = remote.data as Note[];
    previousIds.current = new Set(items.map((note) => note.id));
    remoteApplied.current = true;
    replaceNotes(items);
  }, [remote.data, remote.isSuccess, replaceNotes, web]);

  useEffect(() => {
    if (!web || !remoteApplied.current) return;
    const currentIds = new Set(notes.map((note) => note.id));
    for (const oldId of previousIds.current) {
      if (!currentIds.has(oldId)) void remove.mutateAsync({ id: oldId }).catch(() => undefined);
    }
    for (const note of notes) {
      void save.mutateAsync(note).catch(() => undefined);
    }
    previousIds.current = currentIds;
  }, [notes, remove, save, web]);

  return <>{children}</>;
}
