import { expect, test } from "bun:test";
import { formatTimeLeft } from "../src/table.ts";

const minute = 60_000;

test("formats time left in hours and minutes under a day", () => {
  expect(formatTimeLeft(90 * minute)).toBe("1h 30m");
});

test("formats time left in days and hours from a day on", () => {
  expect(formatTimeLeft(26 * 60 * minute)).toBe("1d 2h");
});

test("shows under a minute as <1m", () => {
  expect(formatTimeLeft(30_000)).toBe("<1m");
});

test("shows now once the time has passed", () => {
  expect(formatTimeLeft(0)).toBe("now");
  expect(formatTimeLeft(-minute)).toBe("now");
});
