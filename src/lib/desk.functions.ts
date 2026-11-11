import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  mode: z.enum(["plan", "suggest", "stuck"]),
  categories: z.array(z.string().max(80)).max(20),
  prompt: z.string().max(2000).optional(),
  notebook: z.array(z.string().max(500)).max(40),
  currentTasks: z.array(z.string().max(200)).max(30).optional(),
});

export const askDesk = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const shapes = {
      plan: `{"blocks":[{"label":"9:00–10:00 · Deep focus","minutes":60,"category":"...","tasks":["..."]}],"note":"one encouraging sentence"}  — total about 240 minutes, 4-6 blocks including one or two 10-15 min breaks (category "Break"). 2-4 small concrete tasks per block, each doable in 10-25 minutes, starting with a verb.`,
      suggest: `{"topics":[{"category":"...","title":"short micro-topic","why":"one line","checklist":["3-5 tiny steps"]}]} — 6 topics across the chosen categories.`,
      stuck: `{"nudge":"one warm sentence","tasks":["3 ultra-small 2-5 minute starter tasks"]}`,
    };
    const input = `You are a friendly ADHD-aware desk coach for Angelica. Keep things tiny, concrete, dopamine-friendly. "Hobby Maxxing" covers her hobbies: learning French, reading, and gaming (emulator experimenting, cozy games, PS5 Call of Duty).
Chosen focus categories: ${data.categories.join(", ") || "any"}.
What she's taught you before (her notebook, newest last):
${data.notebook.map((n) => "- " + n).join("\n") || "(nothing yet)"}
${data.currentTasks?.length ? "Current open tasks: " + data.currentTasks.join("; ") : ""}
Today's prompt: ${data.prompt || "(none)"}
Return JSON only in this shape: ${shapes[data.mode]}`;
    try {
      const res = await generateResponse({
        model: "google/gemini-3-flash-preview",
        input: [{ role: "user", content: input }],
        text: { format: { type: "json_object" } },
      });
      let text = "";
      for (const item of (res as { output?: unknown[] }).output ?? []) {
        const content = (item as { content?: { type: string; text?: string }[] }).content ?? [];
        for (const c of content) if (c.type === "output_text" && c.text) text += c.text;
      }
      JSON.parse(text);
      return { ok: true as const, json: text };
    } catch (e) {
      console.error(e);
      const msg = e instanceof GatewayError && e.httpStatus === 429 ? "Busy right now — try again in a minute." : e instanceof GatewayError && e.httpStatus === 402 ? "AI credits ran out." : "Couldn't generate that. Try again.";
      return { ok: false as const, error: msg };
    }
  });
