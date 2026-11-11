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
    const { generateChatCompletion, GatewayError } = await import("@lovable.dev/ai-gateway");
    const shapes = {
      plan: `{"blocks":[{"label":"Deep focus","minutes":60,"category":"...","tasks":["..."]}],"note":"one encouraging sentence"}  — total about 240 minutes, labels are short names only (never clock times), 4-6 blocks including one or two 10-15 min breaks (category "Break"). 2-4 small concrete tasks per block, each doable in 10-25 minutes, starting with a verb.`,
      suggest: `{"topics":[{"category":"...","title":"short micro-topic","why":"one line","checklist":["3-5 tiny steps"]}]} — 6 topics across the chosen categories, PLUS always 2-3 extra topics with category "Hobby Maxxing" (French, reading, or gaming).`,
      stuck: `{"nudge":"one warm sentence","tasks":["3 ultra-small 2-5 minute starter tasks"]}`,
    };
    const input = `You are a friendly ADHD-aware desk coach for Angelica. Keep things tiny, concrete, dopamine-friendly. "Hobby Maxxing" covers her hobbies: learning French, reading, and gaming (emulator experimenting, cozy games, PS5 Call of Duty).
Chosen focus categories: ${data.categories.join(", ") || "any"}.
She is a photographer/videographer. Never suggest anything resembling a "Not for me" item below.
What she's taught you before (her notebook, newest last):
${data.notebook.map((n) => "- " + n).join("\n") || "(nothing yet)"}
${data.currentTasks?.length ? "Current open tasks: " + data.currentTasks.join("; ") : ""}
Today's prompt: ${data.prompt || "(none)"}
Return JSON only in this shape: ${shapes[data.mode]}`;
    try {
      const res = await generateChatCompletion({
        model: "google/gemini-3.8-flash",
        messages: [{ role: "user", content: input }],
        response_format: { type: "json_object" },
      });
      const raw = res.choices?.[0]?.message?.content;
      const text = (typeof raw === "string" ? raw : "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      JSON.parse(text);
      return { ok: true as const, json: text };
    } catch (e) {
      console.error(e);
      const msg = e instanceof GatewayError && e.httpStatus === 429 ? "Busy right now — try again in a minute." : e instanceof GatewayError && e.httpStatus === 402 ? "AI credits ran out." : "Couldn't generate that. Try again.";
      return { ok: false as const, error: msg };
    }
  });
