import { depositFetch } from './deposit';
import { withdrawFetch } from './withdraw';
import { recieverDeposit } from './recieverDeposit';
import { recieverWithdrawal } from './recieverWithdrawal';
import { attemptOperationInfinitely, connectDb } from './utils';
import {
  getContractPortal,
  publicClientL1,
  publicClientL2,
  selectWorkingProviderL1,
  selectWorkingProviderL2,
} from './utils/chain';
import { decodeAbiParameters, parseAbiParameters } from 'viem';
import { ethers } from 'ethers';

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

  const provider = await selectWorkingProviderL1();
  const contract = await getContractPortal(provider);

  // const fromBlock = 15101340;
  // const toBlock = 15101345;

  const fromBlock = 15006433;
  const toBlock = 15006435;

  const logs = await attemptOperationInfinitely(() =>
    contract.queryFilter('TransactionDeposited', fromBlock, toBlock)
  );
  console.log(
    `Fetching TransactionDeposited from block ${fromBlock} to ${toBlock} for a total of ${logs.length} events.`
  );
  for (const log of logs) {
    console.log('log:', log);
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

    console.log('event:', event);

    const receipt = await publicClientL1.getTransactionReceipt({
      hash: log.transactionHash,
    });

    // console.log({ receipt, logs: receipt.logs });

    // Create an ethers.js Interface with the expected types in the correct order

    // Decode the data

    if (event.version === '0') {
      // // Define the types for the fixed-length part of the opaque data
      // const fixedPartTypes = ['uint256', 'uint256', 'uint64', 'bool'];

      // // Calculate the size of the fixed part
      // const fixedPartSize = ethers.utils.defaultAbiCoder.encode(
      //   fixedPartTypes,
      //   [0, 0, 0, false]
      // ).length;

      // // Decode the fixed part
      // const fixedPartHex = opaqueData.slice(0, fixedPartSize);
      // const [mint, value, gasLimit, isCreation] =
      //   ethers.utils.defaultAbiCoder.decode(fixedPartTypes, fixedPartHex);

      // // Decode the dynamic part (_data)
      // const dataHex = '0x' + opaqueData.slice(fixedPartSize);

      // console.log('Mint:', mint.toString());
      // console.log('Value:', value.toString());
      // console.log('GasLimit:', gasLimit.toString());
      // console.log('IsCreation:', isCreation);
      // console.log('Data:', dataHex);

      // ---------------------------- --  --

      // Create a data buffer from the opaqueData
      const data = ethers.utils.arrayify(opaqueData);

      // Offsets to read data from the buffer
      let offset = 0;

      // Read uint256 _mint (32 bytes)
      const _mint = ethers.BigNumber.from(data.slice(offset, offset + 32));
      offset += 32;

      // Read uint256 _value (32 bytes)
      const _value = ethers.BigNumber.from(data.slice(offset, offset + 32));
      offset += 32;

      // Read uint64 _gasLimit (8 bytes)
      const _gasLimit = ethers.BigNumber.from(data.slice(offset, offset + 8));
      offset += 8;

      // Read bool _isCreation (1 byte)
      const _isCreation = data[offset] !== 0;
      offset += 1;

      // The remaining data is _data (variable length)
      const _data = data.slice(offset);

      console.log('Mint:', _mint.toString());
      console.log('Value:', _value.toString());
      console.log('Gas Limit:', _gasLimit.toString());
      console.log('Is Creation:', _isCreation);
      console.log('Data:', ethers.utils.hexlify(_data));

      // decode data
      // Define the types for each parameter
      const types = [
        'address', // _remoteToken
        'address', // _localToken
        'address', // _from
        'address', // _to
        'uint256', // _amount
        'bytes', // _extraData
      ];

      // Decode the parameters
      const decoded = ethers.utils.defaultAbiCoder.decode(types, '0x' + _data);

      console.log('remoteToken:', decoded[0]);
      console.log('localToken:', decoded[1]);
      console.log('from:', decoded[2]);
      console.log('to:', decoded[3]);
      console.log('amount:', decoded[4].toString());
      console.log('extraData:', ethers.utils.toUtf8String(decoded[5]));
    } else {
    }
  }
};

main().catch((error) => {
  console.error('Error in main function:', error);
  process.exit(1);
});
