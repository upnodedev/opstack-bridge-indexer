import { portalABI } from './abi/portalABI';
import { connectDb, insertEventDeposit } from './utils';
import { ENV } from './utils/ENV';
import { publicClientL1 } from './utils/chain';
import { decodeOpqdata } from './utils/decodeOpaquedata';

console.log('Listening for deposit events...');

const MAX_RETRIES = 5;

const watchDepositEvents = async (db, currentBlock, retryCount = 0) => {
  try {
    console.log(`Starting to watch deposit events from block: ${currentBlock}`);

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
      onError: async (error) => {
        console.error('Error watching contract event deposit:', error);
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay / 1000} seconds...`);
          setTimeout(() => {
            watchDepositEvents(db, currentBlock, retryCount + 1);
          }, delay);
        } else {
          console.error('Max retries reached. Stopping watch.');
        }
      },
      poll: true,
    });
  } catch (error) {
    console.error('Error in watchDepositEvents function:', error);
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`Retrying in ${delay / 1000} seconds...`);
      setTimeout(() => {
        watchDepositEvents(db, currentBlock, retryCount + 1);
      }, delay);
    } else {
      console.error('Max retries reached. Stopping watch.');
    }
  }
};

const main = async (db, currentBlock) => {
  try {
    console.log(`Receiver deposit from block: ${currentBlock}`);
    await watchDepositEvents(db, currentBlock);
  } catch (error) {
    console.error('Error in main function:', error);
  }
};

export { main as recieverDeposit };
