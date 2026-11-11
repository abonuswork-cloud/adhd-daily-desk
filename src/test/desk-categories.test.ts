import { describe, expect, it } from "vitest";
import { CATS, deskCategory } from "@/lib/desk-categories";

describe("Generated desk categories", () => {
  it("retains every Focus on category", () => {
    for (const category of CATS) expect(deskCategory(category.name)).toBe(category.name);
  });
  it("assigns French activities to Hobby Maxxing", () => {
    expect(deskCategory("Languages", "French practice")).toBe("Hobby Maxxing");
    expect(deskCategory("Technology", "Practice", ["Learn five French words"])).toBe("Hobby Maxxing");
  });
  it("assigns books and reading to Hobby Maxxing", () => {
    expect(deskCategory("Books", "Read a chapter")).toBe("Hobby Maxxing");
    expect(deskCategory("Personal development", "Recharge", ["Read 10 pages of your book"])).toBe("Hobby Maxxing");
    expect(deskCategory("Job Search", "Research", ["Read a job description"])).toBe("Job Search");
  });
  it("assigns Lovable activities to Technology", () => {
    expect(deskCategory("Creative", "Build in Lovable")).toBe("Technology");
    expect(deskCategory("AI tools", "Explore", ["Try a prompt in Lovable"])).toBe("Technology");
    expect(deskCategory("tech")).toBe("Technology");
  });
  it("keeps breaks neutral", () => {
    expect(deskCategory("Break", "Rest", ["Read a book"])).toBe("Break");
  });
});