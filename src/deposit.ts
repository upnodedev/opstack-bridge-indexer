import 'dotenv/config';
import { ENV } from './utils/ENV';
import { attemptOperationInfinitely, connectDb, formatSeconds, insertEventDeposit } from './utils';
import { getContractPortal, selectWorkingProviderL1 } from './utils/chain';
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
  const provider = await selectWorkingProviderL1();
  const contract = await getContractPortal(provider);

  const logs = await attemptOperationInfinitely(() =>
    contract.queryFilter('TransactionDeposited', fromBlock, toBlock)
  );
  console.log(
    `Fetching TransactionDeposited from block ${fromBlock} to ${toBlock} for a total of ${
      logs.length
    } events. ${i + 1}/${times}`
  );
  for (const log of logs) {
    const { from, to, version, opaqueData } = log.args;
    const { transactionHash, address, blockNumber } = log;
    const event = {
      from,
      to,
      version: version.toString(),
      opaqueData,
      transactionHash,
      address,
      blockNumber: +blockNumber.toString(),
    };

    try {
      await insertEventDeposit(db, event);
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

const main = async (
  db: any,
  currentBlock: number
) => {
  console.time('depositFetch');
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
  const diff = currentBlockPass - ENV.L1_PORTAL_BLOCK_CREATED;
  // console.log({ currentBlock, currentBlockPass, diff });

  if (diff < 0) {
    console.log('portal contract has not been deployed yet');
    return;
  }

  const times = Math.ceil(diff / LIMIT_BLOCK);

  console.log({ currentBlockPass, diff, times });

  for (let i = 0; i < times; i++) {
    const fromBlock = ENV.L1_PORTAL_BLOCK_CREATED + i * LIMIT_BLOCK;
    const toBlock = fromBlock + LIMIT_BLOCK;
    await fetchPastEvents(db, fromBlock, toBlock, i, times);
    await sleep(100);
  }

  console.timeEnd('depositFetch');
};

// main();
export { main as depositFetch };
