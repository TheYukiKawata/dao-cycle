import { ccc } from "@ckb-ccc/core";
import { currentCycleEnd, unlockEpoch } from "./cycle.ts";

type DaoCell = {
  outPoint: ccc.OutPoint;
  capacity: ccc.Num;
  depositEpoch: ccc.Epoch;
  unlockEpoch: ccc.Epoch;
};

export type DepositedCell = DaoCell & { state: "deposited" };

export type WithdrawingCell = DaoCell & { state: "withdrawing"; withdrawEpoch: ccc.Epoch };

export type DaoPosition = DepositedCell | WithdrawingCell;

export async function findDaoPositions(
  client: ccc.Client,
  lock: ccc.ScriptLike,
  tipEpoch: ccc.Epoch,
): Promise<DaoPosition[]> {
  const daoType = await ccc.Script.fromKnownScript(client, ccc.KnownScript.NervosDao, "0x");
  const cells = await Array.fromAsync(client.findCellsByLock(lock, daoType, true));
  return Promise.all(cells.map((cell) => daoPosition(client, cell, tipEpoch)));
}

async function daoPosition(client: ccc.Client, cell: ccc.Cell, tipEpoch: ccc.Epoch): Promise<DaoPosition> {
  const { depositHeader, withdrawHeader } = await cell.getNervosDaoInfo(client);
  if (!depositHeader) throw new Error(`${cell.outPoint.txHash} is not a Nervos DAO cell`);
  const depositEpoch = depositHeader.epoch;
  const common = { outPoint: cell.outPoint, capacity: cell.cellOutput.capacity, depositEpoch };
  if (!withdrawHeader) {
    return { ...common, state: "deposited", unlockEpoch: currentCycleEnd(depositEpoch, tipEpoch) };
  }
  const withdrawEpoch = withdrawHeader.epoch;
  return { ...common, state: "withdrawing", withdrawEpoch, unlockEpoch: unlockEpoch(depositEpoch, withdrawEpoch) };
}
