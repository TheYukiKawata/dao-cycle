import { ccc } from "@ckb-ccc/core";

const lockPeriodEpochs = 180n;

export function unlockEpoch(depositEpoch: ccc.Epoch, withdrawEpoch: ccc.Epoch): ccc.Epoch {
  const cycles = ceilDiv(depositedEpochs(depositEpoch, withdrawEpoch), lockPeriodEpochs);
  const lockedEpochs = (cycles > 0n ? cycles : 1n) * lockPeriodEpochs;
  return ccc.Epoch.from([depositEpoch.integer + lockedEpochs, depositEpoch.numerator, depositEpoch.denominator]);
}

function depositedEpochs(depositEpoch: ccc.Epoch, withdrawEpoch: ccc.Epoch): bigint {
  const wholeEpochs = withdrawEpoch.integer - depositEpoch.integer;
  const withdrawFraction = withdrawEpoch.numerator * depositEpoch.denominator;
  const depositFraction = depositEpoch.numerator * withdrawEpoch.denominator;
  return withdrawFraction > depositFraction ? wholeEpochs + 1n : wholeEpochs;
}

function ceilDiv(dividend: bigint, divisor: bigint): bigint {
  return (dividend + divisor - 1n) / divisor;
}
