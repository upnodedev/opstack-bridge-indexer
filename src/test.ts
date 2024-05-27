import { depositFetch } from './deposit';
import { withdrawFetch } from './withdraw';
import { recieverDeposit } from './recieverDeposit';
import { recieverWithdrawal } from './recieverWithdrawal';
import {
  attemptOperationInfinitely,
  connectDb,
  insertEventWithdraw,
} from './utils';
import {
  getContractStandartBridge,
  publicClientL1,
  publicClientL2,
  selectWorkingProviderL1,
  selectWorkingProviderL2,
} from './utils/chain';

const main = async () => {
  // console.log("test")
  const db = await connectDb()
    .catch((error) => {
      console.error('Error connecting to database:', error);
      process.exit(1);
    })
    .then((value) => {
      console.log('Connected to database');
      return value;
    });

  // const currentBlockL1 = await attemptOperationInfinitely(async () => {
  //   return selectWorkingProviderL1().then((provider) =>
  //     provider.getBlockNumber()
  //   );
  // });

  // const currentBlockL2 = await attemptOperationInfinitely(async () => {
  //   return selectWorkingProviderL2().then((provider) =>
  //     provider.getBlockNumber()
  //   );
  // });

  // const currentBlockL1BigInt = await publicClientL1.getBlockNumber();
  // const currentBlockL2BigInt = await publicClientL2.getBlockNumber();

  // // listen event
  // // recieverDeposit(db, currentBlockL1BigInt - 100n);
  // recieverWithdrawal(db, 4173268n);

  // // fetch past events
  // // depositFetch(db, currentBlockL1);
  // // withdrawFetch(db, currentBlockL2);

  const provider = await selectWorkingProviderL2();
  const contract = await getContractStandartBridge(provider);

  const logs = await attemptOperationInfinitely(() =>
    contract.queryFilter('WithdrawalInitiated', 4173260, 4173270)
  );

  console.log(logs);

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
};

main().catch((error) => {
  console.error('Error in main function:', error);
  process.exit(1);
});
