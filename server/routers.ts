import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const actionPrompts = {
  summarize: "Summarize the note in 3 concise bullets. Preserve the author's intent and do not invent facts.",
  continue: "Continue the note in the author's tone for one short paragraph. Do not repeat the existing text.",
  outline: "Turn the note into a clean outline with headings and concise bullets. Keep useful specifics.",
} as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  ai: router({
    models: publicProcedure.query(async () => {
      try {
        const response = await listLLMModels();
        return { models: response.data.map((model) => ({ id: model.id, owner: model.owned_by })) };
      } catch {
        return { models: [] };
      }
    }),
    assist: publicProcedure
      .input(z.object({ action: z.enum(["summarize", "continue", "outline"]), title: z.string().max(255), content: z.string().max(20000), model: z.string().max(255).optional() }))
      .mutation(async ({ input }) => {
        if (!input.content.trim()) return { text: "Add a little more context and I can help shape it." };
        const response = await invokeLLM({
          model: input.model && input.model !== "auto" ? input.model : undefined,
          maxTokens: 600,
          messages: [
            { role: "system", content: "You are the Mindloom writing partner. Be concise, thoughtful, and useful. Return only the requested result, with no preamble." },
            { role: "user", content: `${actionPrompts[input.action]}\n\nTitle: ${input.title}\n\nNote:\n${input.content}` },
          ],
        });
        const raw = response.choices[0]?.message?.content;
        const text = typeof raw === "string" ? raw : raw?.map((part) => part.type === "text" ? part.text : "").join("") ?? "";
        return { text: text.trim() || "The assistant returned an empty response." };
      }),
  }),
});

export type AppRouter = typeof appRouter;
