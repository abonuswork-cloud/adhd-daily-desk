import { describe, expect, it } from "vitest";
import { dailyTaskCounts } from "../lib/desk-week";

const today = "2026-11-14";
const list = (count: number, completed = 0) => ({
  blocks: [{ tasks: Array.from({ length: count }, (_, i) => ({ done: i < completed })) }],
});

describe("today's weekly task count", () => {
  it("counts only the 9 board tasks, not the 23 archived tasks making 32", () => {
    const log = [{ ...list(12, 4), date: today }, { ...list(11, 2), date: today }];
    expect(dailyTaskCounts(today, today, list(9, 3), log)).toEqual({ total: 9, done: 3 });
  });

  it("stays unchanged when the current board is saved repeatedly", () => {
    const board = list(9, 3);
    expect(dailyTaskCounts(today, today, board, [
      { ...board, date: today }, { ...board, date: today },
    ])).toEqual({ total: 9, done: 3 });
  });

  it("shows zero after clearing the board even if today's log has tasks", () => {
    expect(dailyTaskCounts(today, today, list(0), [{ ...list(9), date: today }]))
      .toEqual({ total: 0, done: 0 });
  });

  it("updates as tasks are added, removed, and checked on the board", () => {
    expect(dailyTaskCounts(today, today, list(12, 4), [])).toEqual({ total: 12, done: 4 });
    expect(dailyTaskCounts(today, today, list(8, 4), [])).toEqual({ total: 8, done: 4 });
  });

  it("preserves historical days from the log without counting the current board", () => {
    const yesterday = "2026-11-13";
    expect(dailyTaskCounts(yesterday, today, list(9, 3), [{ ...list(5, 2), date: yesterday }]))
      .toEqual({ total: 5, done: 2 });
  });
});