import { ccc } from "@ckb-ccc/core";

const sampleBlocks = 300_000n;

type EpochTimestamp = Pick<ccc.ClientBlockHeader, "epoch" | "timestamp">;

export type EpochClock = {
  reference: EpochTimestamp;
  epochMilliseconds: bigint;
};

export function epochClockBetween(older: EpochTimestamp, newer: EpochTimestamp): EpochClock {
  const elapsed = newer.epoch.sub(older.epoch);
  const elapsedFractions = elapsed.integer * elapsed.denominator + elapsed.numerator;
  const epochMilliseconds = ((newer.timestamp - older.timestamp) * elapsed.denominator) / elapsedFractions;
  return { reference: newer, epochMilliseconds };
}

export async function fetchEpochClock(client: ccc.Client, tip: ccc.ClientBlockHeader): Promise<EpochClock> {
  const older = await client.getHeaderByNumber(tip.number - sampleBlocks);
  if (!older) throw new Error(`Block ${tip.number - sampleBlocks} not found`);
  return epochClockBetween(older, tip);
}

export function estimateTime(clock: EpochClock, epoch: ccc.Epoch): Date {
  return new Date(Number(epoch.toUnix(clock.reference, clock.epochMilliseconds)));
}
