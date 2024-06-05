import { L2StandardBridgeABI } from './abi/L2StandardBridgeABI';
import { connectDb, insertEventWithdraw } from './utils';
import { ENV } from './utils/ENV';
import { publicClientL2 } from './utils/chain';

console.log('Listening for withdrawal events...');

const MAX_RETRIES = 5;

const watchWithdrawEvents = async (db, currentBlock, retryCount = 0) => {
  try {
    console.log(
      `Starting to watch withdrawal events from block: ${currentBlock}`
    );

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
            console.error('Error inserting event withdraw:', err);
          }
        }
      },
      onError: async (error) => {
        console.error('Error watching contract event withdraw:', error);
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay / 1000} seconds...`);
          setTimeout(() => {
            watchWithdrawEvents(db, currentBlock, retryCount + 1);
          }, delay);
        } else {
          console.error('Max retries reached. Stopping watch.');
        }
      },
      poll: true,
    });
  } catch (error) {
    console.error('Error in watchWithdrawEvents function:', error);
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`Retrying in ${delay / 1000} seconds...`);
      setTimeout(() => {
        watchWithdrawEvents(db, currentBlock, retryCount + 1);
      }, delay);
    } else {
      console.error('Max retries reached. Stopping watch.');
    }
  }
};

const main = async (db, currentBlock) => {
  try {
    console.log(`Receiver withdrawal from block: ${currentBlock}`);
    await watchWithdrawEvents(db, currentBlock);
  } catch (error) {
    console.error('Error in main function:', error);
  }
};

export { main as recieverWithdrawal };
