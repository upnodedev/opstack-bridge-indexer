import 'dotenv/config';
import { ENV } from './utils/ENV';
import {
  attemptOperationInfinitely,
  connectDb,
  formatSeconds,
  insertEventWithdraw,
} from './utils';
import {
  getContractStandartBridge,
  selectWorkingProviderL2,
} from './utils/chain';
const sleep = require('util').promisify(setTimeout);

const LIMIT_BLOCK = 10000;

let estimateTime = 0;

// Fetch past events and index them
const fetchPastEvents = async (
  db: any,
  fromBlock: number,
  toBlock: number,
  i: number,
  times: number
) => {
  var start = new Date().getTime();
  const provider = await selectWorkingProviderL2();
  const contract = await getContractStandartBridge(provider);

  const logs = await attemptOperationInfinitely(() =>
    contract.queryFilter('WithdrawalInitiated', fromBlock, toBlock)
  );
  console.log(
    `Fetching WithdrawalInitiated from block ${fromBlock} to ${toBlock} for a total of ${
      logs.length
    } events. ${i + 1}/${times}`
  );
  for (const log of logs) {
    const { l1Token, l2Token, from, to, amount, extraData } = log.args;
    const { transactionHash, address, blockNumber } = log;
    const event = {
      l1Token,
      l2Token,
      from,
      to,
      amount: amount.toString(),
      extraData,
      transactionHash,
      blockNumber: +blockNumber.toString(),
      address,
    };

    try {
      await insertEventWithdraw(db, event);
    } catch (err) {
      console.error('Error handling in fetchPastEvents:', err);
      // Continue processing next event despite the error
    }
  }
  var end = new Date().getTime();
  estimateTime = (end - start) / 1000;
  console.log(
    'Execution time: ' + estimateTime + 's',
    `estiamted to be done in ${formatSeconds(estimateTime * (times - i))}`
  );
};

const main = async (db: any, currentBlock: number) => {
  console.time('withdrawFetch');
  // Connect to the database and initialize it
  // const db = await connectDb().catch((err) => {
  //   console.error('Failed to connect to the database:', err);
  //   process.exit(1);
  // });
  // const currentBlock = await attemptOperationInfinitely(async () => {
  //   return selectWorkingProviderL1().then((provider) =>
  //     provider.getBlockNumber()
  //   );
  // });

  const currentBlockPass = currentBlock;
  const diff = currentBlockPass - ENV.L2_STANDARD_BRIDGE_BLOCK_CREATED;

  if (diff < 0) {
    console.log('l2 standart bridge contract has not been deployed yet');
    return;
  }

  const times = Math.ceil(diff / LIMIT_BLOCK);

  console.log({ currentBlockPass, diff, times });

  for (let i = 0; i < times; i++) {
    const fromBlock = ENV.L2_STANDARD_BRIDGE_BLOCK_CREATED + i * LIMIT_BLOCK;
    const toBlock = fromBlock + LIMIT_BLOCK;
    await fetchPastEvents(db, fromBlock, toBlock, i, times);
    await sleep(5);
  }

  console.timeEnd('withdrawFetch');
};

// main();

export { main as withdrawFetch };
