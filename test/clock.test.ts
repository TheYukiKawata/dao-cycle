import { expect, test } from "bun:test";
import { ccc } from "@ckb-ccc/core";
import { epochClockBetween, estimateTime } from "../src/clock.ts";

const hour = 60n * 60n * 1000n;

test("measures the average epoch length between two headers", () => {
  const older = { epoch: ccc.Epoch.from([100, 0, 1]), timestamp: 0n };
  const newer = { epoch: ccc.Epoch.from([102, 1, 2]), timestamp: 10n * hour };
  expect(epochClockBetween(older, newer).epochMilliseconds).toBe(4n * hour);
});

test("estimates the time of a later epoch from the newer header", () => {
  const older = { epoch: ccc.Epoch.from([100, 0, 1]), timestamp: 0n };
  const newer = { epoch: ccc.Epoch.from([102, 1, 2]), timestamp: 10n * hour };
  const clock = epochClockBetween(older, newer);
  expect(estimateTime(clock, ccc.Epoch.from([103, 0, 1])).getTime()).toBe(Number(12n * hour));
});
