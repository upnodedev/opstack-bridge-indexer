import { decodeEventLog, getContract, parseAbiItem } from 'viem';
import { ENV } from './utils/ENV';
import { publicClientL1 } from './utils/chain';

// 1. Import modules.
const getContractInstance = async (client) => {
  return getContract({
    address: ENV.L1_PORTAL_ADDRESS,
    abi: [
      {
        anonymous: false,
        inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: true, name: 'version', type: 'uint256' },
          { name: 'opaqueData', type: 'bytes' },
        ],
        name: 'TransactionDeposited',
        type: 'event',
      },
    ],
    client,
  });
};

const fetchPastEvents = async (db, fromBlock, toBlock, i, times) => {
  const contract = await getContractInstance(publicClientL1);
  const logs = await publicClientL1.getLogs({
    address: ENV.L1_PORTAL_ADDRESS,
    fromBlock,
    toBlock,
    event: parseAbiItem(
      'event TransactionDeposited(address indexed from, address indexed to, uint256 indexed version, bytes opaqueData)'
    ),
  });

  console.log(
    `Fetching events from block ${fromBlock} to ${toBlock} for a total of ${
      logs.length
    } events. ${i + 1}/${times}`
  );

  for (const log of logs) {
    const event: any = decodeEventLog({
      abi: contract.abi,
      ...log,
    });

    const { from, to, version, opaqueData } = event.args;
    const { transactionHash, address, blockNumber } = log;

    const eventDetails = {
      from,
      to,
      version: version.toString(),
      opaqueData,
      transactionHash,
      address,
      blockNumber,
    };

    console.log(eventDetails);
  }
};

const main = async () => {
  console.time('fetchPastEvents');

  const currentBlock = await publicClientL1.getBlockNumber();

  const currentBlockPass = currentBlock - BigInt(1);
  const diff = currentBlockPass - BigInt(ENV.L1_PORTAL_BLOCK_CREATED);
  console.log({ currentBlock, currentBlockPass, diff });

  if (diff < BigInt(0)) {
    console.log('Portal contract has not been deployed yet');
    return;
  }

  // 17365802, 17366601

  await fetchPastEvents(null, currentBlockPass - BigInt(799), currentBlockPass, 0, 1);

  console.timeEnd('fetchPastEvents');
};

main();
