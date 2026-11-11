export const CATS = [
  { name: "Job Search", color: "cat-1" },
  { name: "Starting a Company", color: "cat-2" },
  { name: "Sports Tech", color: "cat-3" },
  { name: "Technology", color: "cat-6" },
  { name: "Learning Claude", color: "cat-4" },
  { name: "Health & Movement", color: "cat-5" },
  { name: "Creative", color: "cat-8" },
  { name: "Hobby Maxxing", color: "cat-7" },
] as const;

/** Resolve AI labels to the same categories used by the focus controls. */
export function deskCategory(category: string, label = "", tasks: string[] = []): string {
  const key = category.trim().toLowerCase().replace(/\s*&\s*/g, " & ");
  if (key === "break" || key === "unstuck") return category;
  const subject = `${category} ${label}`;
  const hobby = /\b(french|books?|reading|hobbies|hobby|gaming|emulators?|cozy game|call of duty)\b/i;
  if (hobby.test(subject)) return "Hobby Maxxing";
  if (/\blovable\b/i.test(subject)) return "Technology";
  if (tasks.some((task) => /\bfrench\b|\b(read|reading)\b.*\b(book|chapter|pages|novel)\b|\b(current book|novel)\b/i.test(task))) return "Hobby Maxxing";
  if (tasks.some((task) => /\blovable\b/i.test(task))) return "Technology";
  const aliases: Record<string, string> = {
    tech: "Technology",
    "creative projects": "Creative",
    "breaking into sports tech": "Sports Tech",
    "health and movement": "Health & Movement",
  };
  return CATS.find((c) => c.name.toLowerCase() === key)?.name ?? aliases[key] ?? category;
}

export const colorOf = (category: string) => CATS.find((c) => c.name === deskCategory(category))?.color ?? "muted-foreground";