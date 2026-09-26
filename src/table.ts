import { ccc } from "@ckb-ccc/core";
import { estimateTime, type EpochClock } from "./clock.ts";
import type { DaoPosition } from "./positions.ts";

const columns = ["Deposit", "CKB", "State", "Unlock epoch", "Around (UTC)", "Time left"];
const hourMilliseconds = 60 * 60 * 1000;
const shannonsPerCkb = 100_000_000n;

export function positionsTable(positions: DaoPosition[], clock: EpochClock): string {
  const rows = positions
    .toSorted((first, second) => first.unlockEpoch.compare(second.unlockEpoch))
    .map((position) => positionRow(position, clock));
  return alignColumns([columns, ...rows]);
}

function positionRow(position: DaoPosition, clock: EpochClock): string[] {
  const unlockTime = estimateTime(clock, position.unlockEpoch);
  const referenceTime = Number(clock.reference.timestamp);
  return [
    `${shortHash(position.outPoint.txHash)}:${position.outPoint.index}`,
    (position.capacity / shannonsPerCkb).toLocaleString("en-US"),
    stateLabel(position, clock.reference.epoch),
    formatEpoch(position.unlockEpoch),
    unlockTime.toISOString().slice(0, 16).replace("T", " "),
    formatTimeLeft(unlockTime.getTime() - referenceTime),
  ];
}

function stateLabel(position: DaoPosition, tipEpoch: ccc.Epoch): string {
  if (position.state === "deposited") return "deposited";
  return position.unlockEpoch.le(tipEpoch) ? "ready to unlock" : "withdrawing";
}

function formatEpoch(epoch: ccc.Epoch): string {
  return `${epoch.integer} + ${epoch.numerator}/${epoch.denominator}`;
}

export function formatTimeLeft(milliseconds: number): string {
  if (milliseconds <= 0) return "now";
  if (milliseconds < 60_000) return "<1m";
  const hours = Math.floor(milliseconds / hourMilliseconds);
  if (hours < 24) return `${hours}h ${Math.floor((milliseconds % hourMilliseconds) / 60_000)}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function shortHash(hash: ccc.Hex): string {
  return `${hash.slice(0, 6)}..${hash.slice(-4)}`;
}

function alignColumns(rows: string[][]): string {
  const widths = columns.map((_, index) => Math.max(...rows.map((row) => row[index]?.length ?? 0)));
  return rows.map((row) => row.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join("  ").trimEnd()).join("\n");
}
