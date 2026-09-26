import { expect, test } from "bun:test";
import { ccc } from "@ckb-ccc/core";
import { currentCycleEnd, unlockEpoch } from "../src/cycle.ts";

function epoch(integer: number, numerator = 0, denominator = 1000): ccc.Epoch {
  return ccc.Epoch.from([integer, numerator, denominator]);
}

test("matches the RFC 23 example transaction", () => {
  const deposit = ccc.Epoch.fromNum("0x68d0288000002");
  const withdraw = ccc.Epoch.fromNum("0x645017e00002f");
  expect(unlockEpoch(deposit, withdraw).toPackedHex()).toBe("0x68d02880000b6");
});

test("unlocks at the end of the cycle the withdrawal falls in", () => {
  expect(unlockEpoch(epoch(5), epoch(100))).toEqual(epoch(185));
  expect(unlockEpoch(epoch(5), epoch(600))).toEqual(epoch(725));
});

test("locks a full cycle when the withdrawal is in the deposit epoch", () => {
  expect(unlockEpoch(epoch(5, 300), epoch(5, 300))).toEqual(epoch(185, 300));
});

test("a withdrawal exactly at the cycle end unlocks at that end", () => {
  expect(unlockEpoch(epoch(5, 1, 2), epoch(185, 500, 1000))).toEqual(epoch(185, 1, 2));
});

test("a withdrawal just after the cycle end waits for the next cycle", () => {
  expect(unlockEpoch(epoch(5, 1, 2), epoch(185, 501, 1000))).toEqual(epoch(365, 1, 2));
});

test("the current cycle of a deposit ends after the tip", () => {
  expect(currentCycleEnd(epoch(5, 500), epoch(100))).toEqual(epoch(185, 500));
});

test("a deposit whose cycle ends at the tip rolls into the next cycle", () => {
  expect(currentCycleEnd(epoch(5, 500), epoch(185, 600, 1200))).toEqual(epoch(365, 500));
});
