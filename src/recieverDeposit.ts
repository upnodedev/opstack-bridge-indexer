import { portalABI } from './abi/portalABI';
import { connectDb, insertEventDeposit } from './utils';
import { ENV } from './utils/ENV';
import { publicClientL1 } from './utils/chain';
import { decodeOpqdata } from './utils/decodeOpaquedata';

console.log('Listening for deposit events...');

const main = async (db: any, currentBlock: any) => {
  // const db = await connectDb()
  //   .catch((error) => {
  //     console.error('Error connecting to database:', error);
  //     process.exit(1);
  //   })
  //   .then((value) => {
  //     console.log('Connected to database');
  //     return value;
  //   });
  try {
    // const currentBlock = await publicClientL1.getBlockNumber();
    console.log(`Reciever deposit from block : ${currentBlock}`);

    publicClientL1.watchContractEvent({
      address: ENV.L1_PORTAL_ADDRESS,
      abi: portalABI,
      eventName: 'TransactionDeposited',
      fromBlock: currentBlock,
      onLogs: async (logs) => {
        console.log(`Received ${logs.length} logs`);
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
            console.log(
              `Event inserted successfully hash : ${transactionHash}`
            );
          } catch (err) {
            console.error('Error inserting event deposit:', err);
          }
        }
      },
      onError: (error) => {
        console.error('Error watching contract event:', error);
      },
      // Uncomment the following lines if polling is necessary
      // pollingInterval: 1000,
      poll: true,
    });
  } catch (error) {
    console.error('Error in main function:', error);
  }
};

// main().catch((error) => {
//   console.error('Unhandled error:', error);
// });

export { main as recieverDeposit };
