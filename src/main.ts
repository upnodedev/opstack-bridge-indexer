import { depositFetch } from './deposit';
import { withdrawFetch } from './withdraw';
import { recieverDeposit } from './recieverDeposit';
import { recieverWithdrawal } from './recieverWithdrawal';
import { attemptOperationInfinitely, connectDb } from './utils';
import { publicClientL1, publicClientL2, selectWorkingProviderL1, selectWorkingProviderL2 } from './utils/chain';

const main = async () => {
  const db = await connectDb()
    .catch((error) => {
      console.error('Error connecting to database:', error);
      process.exit(1);
    })
    .then((value) => {
      console.log('Connected to database');
      return value;
    });

  const currentBlockL1 = await attemptOperationInfinitely(async () => {
    return selectWorkingProviderL1().then((provider) =>
      provider.getBlockNumber()
    );
  });

  const currentBlockL2 = await attemptOperationInfinitely(async () => {
    return selectWorkingProviderL2().then((provider) =>
      provider.getBlockNumber()
    );
  });

  const currentBlockL1BigInt = await publicClientL1.getBlockNumber();
  const currentBlockL2BigInt = await publicClientL2.getBlockNumber();

  // listen event
  recieverDeposit(db, currentBlockL1BigInt - 100n);
  // recieverWithdrawal(db, currentBlockL2BigInt - 100n);

  // fetch past events
  depositFetch(db, currentBlockL1);
  // withdrawFetch(db, currentBlockL2);
};

main().catch((error) => {
  console.error('Error in main function:', error);
  process.exit(1);
});
