import { avg, formatDuration } from "./number";

describe("utils/number", () => {
  describe("avg", () => {
    it("calculates the average of a non-empty array", () => {
      expect(avg([1, 2, 3, 4])).toBe(2.5);
      expect(avg([10, 20, 30])).toBe(20);
    });

    it("returns NaN for an empty array", () => {
      expect(avg([])).toBeNaN();
    });
  });

  describe("formatDuration", () => {
    it("formats seconds correctly", () => {
      expect(formatDuration(45)).toBe("45s");
      expect(formatDuration(0)).toBe("0s");
    });

    it("formats minutes and seconds", () => {
      expect(formatDuration(90)).toBe("1min 30s");
      expect(formatDuration(125)).toBe("2min 5s");
    });

    it("formats hours, minutes, and seconds", () => {
      expect(formatDuration(3665)).toBe("1h 1min 5s");
      expect(formatDuration(7200)).toBe("2h 0min 0s");
    });

    it("handles negative values", () => {
      expect(formatDuration(-5)).toBe("-5s");
    });
  });
});
