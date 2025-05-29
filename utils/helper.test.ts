import { sleep } from "./helper";

describe("utils/helper", () => {
  describe("sleep", () => {
    it("resolves after the specified time", async () => {
      const ms = 100;
      const start = Date.now();
      await sleep(ms);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(ms);
    });

    it("resolves immediately for zero milliseconds", async () => {
      const ms = 0;
      const start = Date.now();
      await sleep(ms);
      const end = Date.now();
      expect(end - start).toBeLessThan(10);
    });

    it("resolves immediately for negative milliseconds", async () => {
      const ms = -100;
      const start = Date.now();
      await sleep(ms);
      const end = Date.now();
      expect(end - start).toBeLessThan(10);
    });
  });
});
