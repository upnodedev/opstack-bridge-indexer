import { L2StandardBridgeABI } from './abi/L2StandardBridgeABI';
import { connectDb, insertEventWithdraw } from './utils';
import { ENV } from './utils/ENV';
import { publicClientL2 } from './utils/chain';

console.log('Listening for withdrawal events...');

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
    // const currentBlock = (await publicClientL2.getBlockNumber());
    console.log(`Reciever withdrawal from block : ${currentBlock}`);

    publicClientL2.watchContractEvent({
      address: ENV.L2_STANDARD_BRIDGE_ADDRESS,
      abi: L2StandardBridgeABI,
      eventName: 'WithdrawalInitiated',
      fromBlock: currentBlock,
      onLogs: async (logs) => {
        console.log(`Received ${logs.length} logs`);
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
            console.log('Event inserted successfully:', event.transactionHash);
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
      // poll: true,
    });
  } catch (error) {
    console.error('Error in main function:', error);
  }
};

// main().catch((error) => {
//   console.error('Unhandled error:', error);
// });

export { main as recieverWithdrawal };
