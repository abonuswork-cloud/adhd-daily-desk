import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Loader2, LifeBuoy, Sparkles, Plus, Trash2, BookOpen, Wand2, Clock, History, ChevronDown } from "lucide-react";
import { askDesk } from "@/lib/desk.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AB ADHD Daily Desk — today's checklist" },
      { name: "description", content: "Angelica's morning home page: a 4-hour time-blocked task list, suggested micro-topics and an I'm stuck button." },
      { property: "og:title", content: "AB ADHD Daily Desk" },
      { property: "og:description", content: "Time-blocked daily checklists and suggested micro-topics by category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Desk,
});

type Task = { id: string; text: string; done: boolean };
type Block = { id: string; label: string; minutes: number; category: string; tasks: Task[] };
type Topic = { category: string; title: string; why: string; checklist: string[] };

const CATS = [
  { name: "Job Search", color: "cat-1" },
  { name: "Starting a Company", color: "cat-2" },
  { name: "Sports Tech", color: "cat-3" },
  { name: "Technology", color: "cat-6" },
  { name: "Learning Claude", color: "cat-4" },
  { name: "Life Admin", color: "cat-5" },
  { name: "Hobby Maxxing", color: "cat-7" },
] as const;
const colorOf = (c: string) => CATS.find((x) => x.name === c)?.color ?? "muted-foreground";
const bg: Record<string, string> = { "cat-1": "bg-cat-1", "cat-2": "bg-cat-2", "cat-3": "bg-cat-3", "cat-4": "bg-cat-4", "cat-5": "bg-cat-5", "cat-6": "bg-cat-6", "cat-7": "bg-cat-7", "muted-foreground": "bg-muted-foreground" };
const border: Record<string, string> = { "cat-1": "border-cat-1", "cat-2": "border-cat-2", "cat-3": "border-cat-3", "cat-4": "border-cat-4", "cat-5": "border-cat-5", "cat-6": "border-cat-6", "cat-7": "border-cat-7", "muted-foreground": "border-border" };

const STARTER: Topic[] = [
  { category: "Job Search", title: "Polish one resume bullet", why: "Small wins compound.", checklist: ["Pick your weakest bullet", "Add a number or result", "Read it out loud"] },
  { category: "Starting a Company", title: "Write a one-line problem statement", why: "Clarity before building.", checklist: ["Who has the problem?", "What does it cost them?", "Write it in 20 words"] },
  { category: "Sports Tech", title: "Map 5 sports tech companies", why: "Know the landscape.", checklist: ["List 5 companies", "Note what each one sells", "Star the one you'd love to work at"] },
  { category: "Technology", title: "Learn one new term", why: "Build vocabulary daily.", checklist: ["Pick a term (e.g. RAG)", "Read one explainer", "Write a 1-sentence definition"] },
  { category: "Learning Claude", title: "Try a role prompt", why: "Prompting is a skill.", checklist: ["Give Claude a role", "Ask it to critique your idea", "Save the best prompt"] },
  { category: "Life Admin", title: "Clear 5 emails", why: "Lighter inbox, lighter brain.", checklist: ["Open inbox", "Reply or archive 5", "Celebrate"] },
];
const HOBBY: Topic[] = [
  { category: "Hobby Maxxing", title: "10 minutes of French", why: "Hobbies recharge focus.", checklist: ["Open your French app or podcast", "Learn 5 new words", "Say one sentence out loud"] },
  { category: "Hobby Maxxing", title: "Read 10 pages", why: "A tiny chapter win.", checklist: ["Grab your current book", "Set a 15-min timer", "Jot one line you liked"] },
  { category: "Hobby Maxxing", title: "Try one emulator tweak", why: "Tinkering is play.", checklist: ["Pick a game or setting", "Change one thing (shader, upscale)", "Note if it looks better"] },
  { category: "Hobby Maxxing", title: "Cozy game session", why: "Rest counts too.", checklist: ["Pick a cozy game", "Set a 30-min timer", "Finish one in-game task"] },
  { category: "Hobby Maxxing", title: "COD warm-up", why: "Skill practice, short and sweet.", checklist: ["Play one warm-up match", "Focus on one skill (aim, movement)", "Note one thing to improve"] },
];
STARTER.push(...HOBBY);
type LogEntry = { id: string; savedAt: string; date: string; note: string; blocks: Block[] };
const WEEK = 7 * 24 * 60 * 60 * 1000;

const uid = () => Math.random().toString(36).slice(2, 10);
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => dayKey(new Date());

function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setV(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(v)); }, [key, v, ready]);
  return [v, setV] as const;
}

const AFFIRMATIONS = [
  "Starting small still counts as starting.",
  "My brain works differently, and that's a strength.",
  "One checked box is proof I showed up.",
  "I don't need to do it all — just the next thing.",
  "Rest is part of the plan, not a break from it.",
  "I'm allowed to change course without losing progress.",
  "Curiosity is my superpower.",
  "Done is better than perfect.",
  "I can do hard things for ten minutes.",
  "My worth isn't measured by my to-do list.",
  "Every expert was once a beginner.",
  "I'm building something, one block at a time.",
  "It's okay to ask for help — even from a button.",
  "Today I'll be kind to future me.",
  "Progress, not pressure.",
  "My ideas deserve space on the page.",
  "I'm exactly where I need to start.",
  "Small wins add up to big changes.",
  "I can focus on one thing at a time.",
  "I celebrate every step forward.",
  "My energy is valuable; I spend it on what matters.",
  "I'm learning, and that's the whole point.",
  "Messy action beats perfect planning.",
  "I trust myself to figure it out.",
  "Today's effort is enough.",
  "I'm the kind of person who keeps coming back.",
  "Hobbies aren't a distraction — they're fuel.",
  "I give myself permission to go at my own pace.",
  "My future is being written in pencil, and I hold it.",
  "I've done hard days before. I can do this one.",
  "Joy is productive too.",
];

function Affirmation() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date();
    const n = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
    setText(AFFIRMATIONS[n % AFFIRMATIONS.length] ?? null);
  }, []);
  return (
    <section className="paper">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Today's affirmation</p>
      <p className="font-display text-xl italic leading-snug">{text ? `“${text}”` : "\u00a0"}</p>
      <p className="mt-2 text-[10px] text-muted-foreground">A new one every day.</p>
    </section>
  );
}

function DeskClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  return (
    <div className="paper-sm text-right" aria-live="off">
      <p className="font-display text-2xl font-bold tabular-nums">{now ? now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "--:--"}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">local time</p>
    </div>
  );
}

const weekNo = (d: Date) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7); };

function Desk() {
  const ask = useServerFn(askDesk);
  const [cats, setCats] = useStored<string[]>("abd.cats", ["Job Search", "Learning Claude"]);
  const [notebook, setNotebook] = useStored<{ id: string; text: string; date: string }[]>("abd.notebook", []);
  const [plan, setPlan] = useStored<{ date: string; note: string; blocks: Block[] }>("abd.plan", { date: "", note: "", blocks: [] });
  const [topics, setTopics] = useStored<Topic[]>("abd.topics", STARTER);
  useEffect(() => { setTopics((t) => t.some((x) => x.category === "Hobby Maxxing") ? t : [...t, ...HOBBY]); }, [topics.length, setTopics]);
  useEffect(() => { if (cats.includes("Breaking into Sports Tech")) setCats((c) => c.map((x) => x === "Breaking into Sports Tech" ? "Sports Tech" : x)); }, [cats, setCats]);
  useEffect(() => { if (topics.some((t) => t.category === "Breaking into Sports Tech")) setTopics((t) => t.map((x) => x.category === "Breaking into Sports Tech" ? { ...x, category: "Sports Tech" } : x)); }, [topics, setTopics]);
  const [log, setLog] = useStored<LogEntry[]>("abd.log", []);
  const [openCats, setOpenCats] = useState<string[]>([]);
  const [openLog, setOpenLog] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  useEffect(() => { setLog((l) => { const k = l.filter((e) => Date.now() - new Date(e.savedAt).getTime() < WEEK); return k.length === l.length ? l : k; }); }, [log.length, setLog]);
  const saveToLog = (p: typeof plan, quiet = false) => {
    if (!p.blocks.length) return;
    setLog((l) => [{ id: uid(), savedAt: new Date().toISOString(), date: p.date || today(), note: p.note, blocks: p.blocks }, ...l]);
    if (!quiet) toast.success("Saved to your log 📒");
  };
  const [busy, setBusy] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");

  const all = plan.blocks.flatMap((b) => b.tasks);
  const done = all.filter((t) => t.done).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const stale = plan.date && plan.date !== today();
  const notes = useMemo(() => notebook.slice(-30).map((n) => n.text), [notebook]);

  const remember = (text: string) => setNotebook((n) => [...n, { id: uid(), text, date: today() }].slice(-100));

  async function run(mode: "plan" | "suggest" | "stuck") {
    setBusy(mode);
    if (prompt.trim() && mode !== "stuck") remember(prompt.trim());
    const res = await ask({ data: { mode, categories: cats, prompt: prompt.trim() || undefined, notebook: notes, currentTasks: all.filter((t) => !t.done).map((t) => t.text).slice(0, 30) } });
    setBusy(null);
    if (!res.ok) { toast.error(res.error); return; }
    const j = JSON.parse(res.json) as { blocks?: any[]; note?: string; topics?: any[]; tasks?: string[]; nudge?: string };
    if (mode === "plan") {
      const blocks: Block[] = (j.blocks ?? []).map((b: any) => ({ id: uid(), label: String(b.label), minutes: Number(b.minutes) || 30, category: String(b.category ?? ""), tasks: (b.tasks ?? []).map((t: string) => ({ id: uid(), text: String(t), done: false })) }));
      saveToLog(plan, true);
      setPlan({ date: today(), note: String(j.note ?? ""), blocks });
      setPrompt("");
      toast.success("Your 4-hour plan is ready ✨");
    } else if (mode === "suggest") {
      setTopics((j.topics ?? []).map((t: any) => ({ category: String(t.category), title: String(t.title), why: String(t.why ?? ""), checklist: (t.checklist ?? []).map(String) })));
      setPrompt("");
    } else {
      const tasks = (j.tasks ?? []).map((t: string) => ({ id: uid(), text: String(t), done: false }));
      setPlan((p) => ({ ...p, date: p.date || today(), blocks: [{ id: uid(), label: "Right now · Tiny start", minutes: 10, category: "Unstuck", tasks }, ...p.blocks] }));
      toast(String(j.nudge ?? "You've got this."), { icon: "💛" });
    }
  }

  function toggle(bid: string, tid: string) {
    setPlan((p) => ({ ...p, blocks: p.blocks.map((b) => b.id !== bid ? b : { ...b, tasks: b.tasks.map((t) => {
      if (t.id !== tid) return t;
      if (!t.done) toast.success(["Nice! 🎉", "Done & dusted ✅", "Look at you go 🚀", "Another one 💥"][Math.floor(Math.random() * 4)]);
      return { ...t, done: !t.done };
    }) }) }));
  }

  function addTopic(t: Topic) {
    remember(`Interested in: ${t.title} (${t.category})`);
    setPlan((p) => ({ ...p, date: p.date || today(), blocks: [...p.blocks, { id: uid(), label: t.title, minutes: 20, category: t.category, tasks: t.checklist.map((x) => ({ id: uid(), text: x, done: false })) }] }));
    toast.success("Added to today");
  }

  function addOwn() {
    if (!newTask.trim()) return;
    setPlan((p) => {
      const blocks = p.blocks.length ? p.blocks : [{ id: uid(), label: "My tasks", minutes: 30, category: "", tasks: [] }];
      return { ...p, date: p.date || today(), blocks: blocks.map((b, i) => i === blocks.length - 1 ? { ...b, tasks: [...b.tasks, { id: uid(), text: newTask.trim(), done: false }] } : b) };
    });
    setNewTask("");
  }

  const week = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = dayKey(d);
      const sources = [...log.filter((e) => e.date === key), ...(plan.date === key ? [plan] : [])];
      const ts = sources.flatMap((x) => x.blocks.flatMap((b) => b.tasks));
      return { key, label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2), done: ts.filter((t) => t.done).length, total: ts.length, isToday: key === today() };
    });
  }, [log, plan]);
  const grouped = CATS.map((c) => ({ ...c, items: topics.filter((t) => t.category === c.name) })).filter((g) => g.items.length);
  const other = topics.filter((t) => !CATS.some((c) => c.name === t.category));
  const groups = [...grouped, ...(other.length ? [{ name: "Other", color: "muted-foreground", items: other }] : [])];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-6 pt-10">
        <div>
          <div className="mb-2 flex items-center gap-3 border-b-2 border-double border-foreground/40 pb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="font-bold text-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long" })}</span>
            <span>{new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
            <span>· Week {weekNo(new Date())}</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">AB ADHD <span className="text-primary">Daily Desk</span></h1>
        </div>
        <div className="flex items-stretch gap-3"><DeskClock />
        <div className="flex items-center gap-4 rounded-sm border bg-card px-5 py-3 shadow-[3px_4px_0_-1px_var(--border)]">
          <div className="relative h-14 w-14">
            <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--muted)" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${pct * 0.942} 100`} className="transition-all duration-500" /></svg>
            <span className="absolute inset-0 grid place-items-center text-xs font-bold">{pct}%</span>
          </div>
          <div><p className="font-display text-2xl font-bold">{done}/{all.length}</p><p className="text-xs text-muted-foreground">done today</p></div>
        </div></div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Categories */}
          <section className="paper">
            <h2 className="mb-3 font-display text-lg font-bold">Today I want to focus on…</h2>
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => {
                const on = cats.includes(c.name);
                return (
                  <button key={c.name} onClick={() => setCats((s) => on ? s.filter((x) => x !== c.name) : [...s, c.name])}
                    className={cn("flex items-center gap-2 rounded-sm border-2 px-3 py-2 text-xs font-semibold transition", on ? cn(bg[c.color], border[c.color], "text-foreground") : "border-border bg-background text-muted-foreground hover:text-foreground")}>
                    {on ? <Check className="h-4 w-4" /> : <span className={cn("h-2.5 w-2.5 rounded-full", bg[c.color])} />}{c.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Prompt */}
          <section className="paper">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold"><Wand2 className="h-5 w-5 text-primary" />What's on your mind?</h2>
            <p className="mb-3 text-sm text-muted-foreground">Everything you type is saved to your notebook so suggestions get more "you" over time.</p>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. I have a call with a sports analytics startup Thursday, and I want to finish my Claude course…" className="min-h-24 rounded-2xl" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => run("plan")} disabled={!!busy} className="rounded-full">{busy === "plan" ? <Loader2 className="animate-spin" /> : <Clock />}Generate my 4-hour plan</Button>
              <Button onClick={() => run("suggest")} disabled={!!busy} variant="secondary" className="rounded-full">{busy === "suggest" ? <Loader2 className="animate-spin" /> : <Sparkles />}Suggest micro-topics</Button>
            </div>
          </section>

          {/* Plan */}
          <section className="paper">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Today's desk list</h2>
              {plan.blocks.length > 0 && <div className="flex gap-3"><button onClick={() => saveToLog(plan)} className="text-xs font-semibold text-primary hover:underline">Save to log</button><button onClick={() => { saveToLog(plan, true); setPlan({ date: "", note: "", blocks: [] }); }} className="text-xs text-muted-foreground hover:text-destructive">Clear</button></div>}
            </div>
            {stale && <p className="mb-3 rounded-xl bg-accent px-3 py-2 text-sm">This list is from {plan.date}. Generate a fresh plan for today?</p>}
            {plan.note && <p className="mb-4 text-sm italic text-muted-foreground">{plan.note}</p>}
            {plan.blocks.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">Pick your focus, then hit <b>Generate my 4-hour plan</b>.</p>
            ) : (
              <div className="space-y-4">
                {plan.blocks.map((b) => {
                  const c = colorOf(b.category);
                  const bd = b.tasks.length && b.tasks.every((t) => t.done);
                  return (
                    <div key={b.id} className={cn("rounded-2xl border-l-8 bg-background p-4", border[c], bd && "opacity-60")}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-display font-bold">{b.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{b.minutes} min</span>
                          <button aria-label="Remove block" onClick={() => setPlan((p) => ({ ...p, blocks: p.blocks.filter((x) => x.id !== b.id) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {b.tasks.map((t) => (
                          <li key={t.id}>
                            <button onClick={() => toggle(b.id, t.id)} className="group flex w-full items-start gap-3 rounded-lg p-1 text-left hover:bg-muted">
                              <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition", t.done ? cn(bg[c], border[c], "scale-110") : "border-border")}>{t.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
                              <span className={cn("text-sm", t.done && "text-muted-foreground ink-strike")}>{t.text}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addOwn()} placeholder="Add your own task…" className="rounded-full" />
              <Button onClick={addOwn} size="icon" variant="secondary" className="shrink-0 rounded-full" aria-label="Add task"><Plus /></Button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Affirmation />
          <button onClick={() => run("stuck")} disabled={!!busy} className="flex w-full items-center justify-center gap-3 rounded-sm border-2 border-foreground bg-accent px-6 py-6 shadow-[4px_4px_0_var(--foreground)] font-display text-2xl font-extrabold text-accent-foreground shadow-sm transition hover:-rotate-1 hover:scale-[1.02] disabled:opacity-60">
            {busy === "stuck" ? <Loader2 className="h-7 w-7 animate-spin" /> : <LifeBuoy className="h-7 w-7" />} I'm stuck
          </button>

          <section className="paper">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Sparkles className="h-5 w-5 text-primary" />Suggested micro-topics</h2>
              <button onClick={() => setOpenCats(openCats.length >= groups.length ? [] : groups.map((g) => g.name))} className="text-xs font-semibold text-primary hover:underline">{openCats.length >= groups.length ? "Hide all" : "Show all"}</button>
            </div>
            <div className="space-y-3">
              {groups.map((g) => { const open = openCats.includes(g.name); return (
                <div key={g.name}>
                  <button onClick={() => setOpenCats((s) => open ? s.filter((x) => x !== g.name) : [...s, g.name])} aria-expanded={open} className="flex w-full items-center gap-2 rounded-lg py-1 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"><span className={cn("h-2.5 w-2.5 rounded-full", bg[g.color])} />{g.name}<span className="font-normal normal-case">({g.items.length})</span><ChevronDown className={cn("ml-auto h-4 w-4 transition", open && "rotate-180")} /></button>
                  {open && <div className="mt-2 space-y-2">
                    {g.items.map((t, i) => (
                      <div key={i} className="rounded-2xl border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="text-sm font-semibold">{t.title}</p><p className="text-xs text-muted-foreground">{t.why}</p></div>
                          <Button size="sm" variant="outline" className="h-7 shrink-0 rounded-full px-2 text-xs" onClick={() => addTopic(t)}><Plus className="h-3 w-3" />Today</Button>
                        </div>
                        <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">{t.checklist.map((x, j) => <li key={j}>{x}</li>)}</ul>
                      </div>
                    ))}
                  </div>}
                </div>
              ); })}
            </div>
          </section>

          <div className="relative">
          <section className="paper relative z-10 -mb-2 rotate-[-0.6deg]">
            <h2 className="mb-2 font-display text-lg font-bold">This week</h2>
            <div className="grid grid-cols-7 gap-1 text-center">
              {week.map((d) => (
                <div key={d.key} className={cn("rounded-sm border px-0.5 py-1.5", d.isToday ? "border-foreground bg-accent" : "border-border bg-background")}>
                  <p className="text-[10px] font-bold uppercase">{d.label}</p>
                  <p className="font-display text-lg font-bold leading-tight">{d.done}</p>
                  <p className="text-[9px] text-muted-foreground">/{d.total}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{week.reduce((a, d) => a + d.done, 0)} tasks checked off this week{week.filter((d) => d.done).length ? ` · ${week.filter((d) => d.done).length} active days` : ""}.</p>
          </section>
          <section className="paper">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold"><History className="h-5 w-5 text-primary" />Log</h2>
            <p className="mb-3 text-xs text-muted-foreground">Past desk lists, kept for 7 days. Old lists save here automatically when you make a new plan.</p>
            {log.length === 0 ? <p className="text-sm text-muted-foreground">No saved lists yet.</p> : (
              <ul className="max-h-96 space-y-2 overflow-auto">
                {log.map((e) => {
                  const ts = e.blocks.flatMap((b) => b.tasks);
                  return (
                    <li key={e.id} className="rounded-2xl border bg-background p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => setOpenLog(openLog === e.id ? null : e.id)} className="text-left font-semibold hover:text-primary">{new Date(e.savedAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {ts.filter((t) => t.done).length}/{ts.length} done</button>
                        <div className="flex gap-2">
                          <button onClick={() => { saveToLog(plan, true); setPlan({ date: today(), note: e.note, blocks: e.blocks }); setLog((l) => l.filter((x) => x.id !== e.id)); toast.success("Restored to today"); }} className="font-semibold text-primary hover:underline">Restore</button>
                          <button aria-label="Delete log entry" onClick={() => setLog((l) => l.filter((x) => x.id !== e.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      {openLog === e.id && e.blocks.map((b) => (
                        <div key={b.id} className="mt-2"><p className="font-semibold">{b.label}</p><ul className="ml-1">{b.tasks.map((t) => <li key={t.id} className={cn(t.done && "text-muted-foreground ink-strike")}>{t.done ? "✓" : "○"} {t.text}</li>)}</ul></div>
                      ))}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          </div>

          <section className="paper">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold"><BookOpen className="h-5 w-5 text-primary" />My notebook</h2>
            <p className="mb-3 text-xs text-muted-foreground">What the desk has learned about you. Remove anything that's no longer true.</p>
            {notebook.length === 0 ? <p className="text-sm text-muted-foreground">Empty for now — type a prompt to start.</p> : (
              <ul className="max-h-72 space-y-1.5 overflow-auto">
                {[...notebook].reverse().map((n) => (
                  <li key={n.id} className="group flex items-start justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                    <span>{n.text}</span>
                    <button aria-label="Forget" onClick={() => setNotebook((s) => s.filter((x) => x.id !== n.id))} className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}
