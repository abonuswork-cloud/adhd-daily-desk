type TaskList = { blocks: { tasks: { done: boolean }[] }[] };
type SavedList = TaskList & { date: string };

// Today's visible board is authoritative, even when it was restored or is stale.
export function dailyTaskCounts(day: string, today: string, board: TaskList, log: SavedList[]) {
  const sources = day === today ? [board] : log.filter((entry) => entry.date === day);
  const tasks = sources.flatMap((source) => source.blocks.flatMap((block) => block.tasks));
  return { done: tasks.filter((task) => task.done).length, total: tasks.length };
}