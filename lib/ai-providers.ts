import type { AISettings } from "./notes-context";

type AssistantAction = "summarize" | "continue" | "outline";

const instructions: Record<AssistantAction, string> = {
  summarize: "Summarize the note in 3 concise bullets. Preserve the author's intent and do not invent facts.",
  continue: "Continue the note in the author's tone for one short paragraph. Do not repeat the existing text.",
  outline: "Turn the note into a clean outline with headings and concise bullets. Keep useful specifics.",
};

const promptFor = (action: AssistantAction, title: string, content: string) => `${instructions[action]}\n\nTitle: ${title}\n\nNote:\n${content}`;

const readOpenAIText = (data: any) => data?.choices?.[0]?.message?.content ?? "";

export async function runExternalAssistant({ provider, model, apiKey, action, title, content }: AISettings & { apiKey: string; action: AssistantAction; title: string; content: string }) {
  const prompt = promptFor(action, title, content);
  let response: Response;

  if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, max_tokens: 600, messages: [{ role: "system", content: "You are the Mindloom writing partner. Return only the requested result." }, { role: "user", content: prompt }] }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message ?? "OpenAI request failed");
    return readOpenAIText(data);
  }

  if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 600, system: "You are the Mindloom writing partner. Return only the requested result.", messages: [{ role: "user", content: prompt }] }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message ?? "Anthropic request failed");
    return data?.content?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
  }

  if (provider === "google") {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `You are the Mindloom writing partner. Return only the requested result.\n\n${prompt}` }] }] }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message ?? "Google AI request failed");
    return data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
  }

  if (provider === "ollama") {
    response = await fetch("http://localhost:11434/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model, stream: false, messages: [{ role: "user", content: prompt }] }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? "Ollama request failed");
    return data?.message?.content ?? "";
  }

  throw new Error("Select a supported provider first");
}
