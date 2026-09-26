#!/usr/bin/env bun
import { ccc } from "@ckb-ccc/core";
import { fetchEpochClock } from "./clock.ts";
import { findDaoPositions } from "./positions.ts";
import { positionsTable } from "./table.ts";

const depositedNote =
  "For a deposited cell, the unlock epoch is the end of its current 180-epoch cycle. " +
  "Start the withdrawal before then to unlock at that epoch. Later, the unlock moves 180 epochs on.";

async function checkAddress(client: ccc.Client, address: string): Promise<string> {
  const { script: lock } = await ccc.Address.fromString(address, client);
  const tip = await client.getTipHeader();
  const [positions, clock] = await Promise.all([
    findDaoPositions(client, lock, tip.epoch),
    fetchEpochClock(client, tip),
  ]);
  if (positions.length === 0) return "No Nervos DAO cells on this address.";
  const table = positionsTable(positions, clock);
  return positions.some((position) => position.state === "deposited") ? `${table}\n\n${depositedNote}` : table;
}

const [command, address] = process.argv.slice(2);
if (command !== "check" || !address) {
  console.error("Usage: dao-cycle check <mainnet ckb address>");
  process.exit(1);
}

const client = ccc.ClientPublicMainnet.open();
try {
  console.log(await checkAddress(client.value, address));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.dispose();
}
