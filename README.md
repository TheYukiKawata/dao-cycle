# dao-cycle

Find when each Nervos DAO deposit on a CKB address reaches the end of its 180-epoch cycle.

A Nervos DAO deposit unlocks only at the end of a 180-epoch cycle, about 30 days ([RFC 23](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)). You can start a withdrawal at any time, but the CKB stays locked until the cycle ends. Start it one epoch after the end and you wait for the next cycle.

```sh
bun install
bun src/cli.ts check ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqg8teat6kuk9stkykmvw9s5wrjc8k00kxsgx0lcg
```

```
Deposit         CKB     State      Unlock epoch      Around (UTC)      Time left
0x33a1..249d:0  60,000  deposited  15182 + 711/1549  2026-10-26 20:01  29d 20h
```

## How the unlock epoch is found

The Nervos DAO script counts the epochs from the deposit to the withdrawal and rounds a part of an epoch up. It rounds that count up to a multiple of 180, with 180 as the minimum. The cell unlocks at the deposit epoch plus that count, at the same fraction of an epoch as the deposit. `unlockEpoch` follows the steps in the script's [C code](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/dao.c).

For a withdrawing cell, the withdrawal epoch is the epoch of the block that holds the withdrawing cell. For a deposited cell, `dao-cycle` uses the chain tip instead, so the unlock epoch is the end of the current cycle: start the withdrawal before it, and the CKB unlocks at it.

Times are estimates. The CLI measures the average epoch length over the last 300,000 blocks, about 180 epochs, and counts forward from the chain tip.

## Library

```ts
import { ccc } from "@ckb-ccc/core";
import { estimateTime, fetchEpochClock, findDaoPositions } from "dao-cycle";

const owner = ccc.ClientPublicMainnet.open();
const client = owner.value;
const { script } = await ccc.Address.fromString("ckb1...", client);
const tip = await client.getTipHeader();
const clock = await fetchEpochClock(client, tip);

for (const position of await findDaoPositions(client, script, tip.epoch)) {
  console.log(position.state, position.capacity, estimateTime(clock, position.unlockEpoch));
}
await owner.dispose();
```

The library reads public chain data through [CCC](https://github.com/ckb-devrel/ccc). It never needs a private key.

Run the tests with `bun test`. They include the example transaction from RFC 23.

Yuki Kawata maintains this library.

## License

MIT
