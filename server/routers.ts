import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import {
  createNativeSession,
  clearNativeSession,
  hashPassword,
  MINDLOOM_SESSION_COOKIE,
  normalizeEmail,
  sessionCookieOptions,
  verifyPassword,
} from "./_core/native-auth";
import {
  createNativeUser,
  deleteNoteForUser,
  getUserByEmail,
  listNotesByUser,
  updateUserLastSignedIn,
  upsertNoteForUser,
} from "./db";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const actionPrompts = {
  summarize:
    "Summarize the note in 3 concise bullets. Preserve the author's intent and do not invent facts.",
  continue:
    "Continue the note in the author's tone for one short paragraph. Do not repeat the existing text.",
  outline:
    "Turn the note into a clean outline with headings and concise bullets. Keep useful specifics.",
} as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email().max(320),
          password: z.string().min(8).max(128),
          name: z.string().trim().min(1).max(80),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const email = normalizeEmail(input.email);
        const existing = await getUserByEmail(email);
        if (existing) throw new Error("Unable to create this account");
        const { hash, salt } = hashPassword(input.password);
        const user = await createNativeUser({
          email,
          name: input.name.trim(),
          passwordHash: hash,
          passwordSalt: salt,
        });
        if (!user) throw new Error("Unable to create this account");
        const token = await createNativeSession(user);
        ctx.res.cookie(
          MINDLOOM_SESSION_COOKIE,
          token,
          sessionCookieOptions(ctx.req),
        );
        return { id: user.id, email: user.email, name: user.name };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email().max(320),
          password: z.string().max(128),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(normalizeEmail(input.email));
        if (
          !user?.passwordHash ||
          !user.passwordSalt ||
          !verifyPassword(input.password, user.passwordHash, user.passwordSalt)
        ) {
          throw new Error("Email or password is incorrect");
        }
        await updateUserLastSignedIn(user.id);
        const token = await createNativeSession(user);
        ctx.res.cookie(
          MINDLOOM_SESSION_COOKIE,
          token,
          sessionCookieOptions(ctx.req),
        );
        return { id: user.id, email: user.email, name: user.name };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      clearNativeSession(ctx.res, ctx.req);
      return { success: true } as const;
    }),
  }),
  notes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const rows = await listNotesByUser(ctx.user.id);
      return rows.map((row) => ({
        id: row.noteId,
        title: row.title,
        content: row.content,
        tags: JSON.parse(row.tags) as string[],
        folder: row.folder,
        pinned: Boolean(row.pinned),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),
    save: protectedProcedure
      .input(
        z.object({
          id: z.string().max(80),
          title: z.string().max(255),
          content: z.string().max(100000),
          tags: z.array(z.string().max(80)).max(50),
          folder: z.string().max(128),
          pinned: z.boolean(),
          createdAt: z.string().datetime().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const row = await upsertNoteForUser(ctx.user.id, {
          noteId: input.id,
          title: input.title,
          content: input.content,
          tags: JSON.stringify(input.tags),
          folder: input.folder,
          pinned: input.pinned ? 1 : 0,
          createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
          updatedAt: new Date(),
        });
        return { id: row?.noteId ?? input.id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.string().max(80) }))
      .mutation(({ ctx, input }) => deleteNoteForUser(ctx.user.id, input.id)),
  }),
  ai: router({
    models: publicProcedure.query(async () => {
      try {
        const response = await listLLMModels();
        return {
          models: response.data.map((model) => ({
            id: model.id,
            owner: model.owned_by,
          })),
        };
      } catch {
        return { models: [] };
      }
    }),
    ask: protectedProcedure
      .input(
        z.object({
          prompt: z.string().trim().min(1).max(4000),
          noteIds: z.array(z.string().max(80)).max(20),
          model: z.string().max(255).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const allNotes = await listNotesByUser(ctx.user.id);
        const selected = allNotes.filter((note) =>
          input.noteIds.includes(note.noteId),
        );
        if (selected.length === 0)
          return {
            text: "Select at least one note so Mindloom has a source to work from.",
            sources: [],
          };
        const sourceContext = selected
          .map(
            (note, index) =>
              `[${index + 1}] ${note.title}\n${note.content.slice(0, 12000)}`,
          )
          .join("\n\n");
        const response = await invokeLLM({
          model:
            input.model && input.model !== "auto" ? input.model : undefined,
          maxTokens: 900,
          messages: [
            {
              role: "system",
              content:
                "You are Mindloom, a source-grounded thinking partner. Answer only from the supplied notes. If the notes do not contain enough information, say so plainly. End with compact source markers like [1] or [2] when making claims.",
            },
            {
              role: "user",
              content: `Question: ${input.prompt}\n\nSources:\n${sourceContext}`,
            },
          ],
        });
        const raw = response.choices[0]?.message?.content;
        const text =
          typeof raw === "string"
            ? raw
            : (raw
                ?.map((part) => (part.type === "text" ? part.text : ""))
                .join("") ?? "");
        return {
          text:
            text.trim() ||
            "Mindloom could not produce an answer from those sources.",
          sources: selected.map((note, index) => ({
            index: index + 1,
            id: note.noteId,
            title: note.title,
          })),
        };
      }),
    assist: publicProcedure
      .input(
        z.object({
          action: z.enum(["summarize", "continue", "outline"]),
          title: z.string().max(255),
          content: z.string().max(20000),
          model: z.string().max(255).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        if (!input.content.trim())
          return { text: "Add a little more context and I can help shape it." };
        const response = await invokeLLM({
          model:
            input.model && input.model !== "auto" ? input.model : undefined,
          maxTokens: 600,
          messages: [
            {
              role: "system",
              content:
                "You are the Mindloom writing partner. Be concise, thoughtful, and useful. Return only the requested result, with no preamble.",
            },
            {
              role: "user",
              content: `${actionPrompts[input.action]}\n\nTitle: ${input.title}\n\nNote:\n${input.content}`,
            },
          ],
        });
        const raw = response.choices[0]?.message?.content;
        const text =
          typeof raw === "string"
            ? raw
            : (raw
                ?.map((part) => (part.type === "text" ? part.text : ""))
                .join("") ?? "");
        return {
          text: text.trim() || "The assistant returned an empty response.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
