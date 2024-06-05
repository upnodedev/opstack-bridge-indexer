import { depositFetch } from '../deposit';
import { withdrawFetch } from '../withdraw';
import { recieverDeposit } from '../recieverDeposit';
import { recieverWithdrawal } from '../recieverWithdrawal';
import { attemptOperationInfinitely, connectDb } from '../utils';
import {
  getContractPortal,
  publicClientL1,
  publicClientL2,
  selectWorkingProviderL1,
  selectWorkingProviderL2,
} from '../utils/chain';
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

  // const fromBlock = 15006433;
  // const toBlock = 15006435;

  // const fromBlock = 15306634;
  // const toBlock = 15306635;

  const fromBlock = 20012183;
  const toBlock = 20012184;

  const logs = await attemptOperationInfinitely(() =>
    contract.queryFilter('TransactionDeposited', fromBlock, toBlock)
  );
  console.log(
    `Fetching TransactionDeposited from block ${fromBlock} to ${toBlock} for a total of ${logs.length} events.`
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

    console.log({
      transactionHash,
      from,
      to,
      version: version.toString(),
      opaqueData,
    });

    if (event.version === '0') {
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

      // Define the ABI of the relayMessage function (0xd764ad0b)
      const abi = [
        'function relayMessage(uint256 _nonce, address _sender, address _target, uint256 _value, uint256 _minGasLimit, bytes _message)',
      ];

      // Create an Interface object
      const iface = new ethers.utils.Interface(abi);

      // Decode the _data using the relayMessage ABI
      const decodedData = iface.decodeFunctionData(
        'relayMessage',
        ethers.utils.hexlify(_data)
      );

      // console.log('Decoded Data:', decodedData);
      console.log('----------------------');

      // Output the decoded values
      console.log('Nonce:', decodedData._nonce.toString());
      console.log('Sender:', decodedData._sender);
      console.log('Target:', decodedData._target);
      console.log('Value:', decodedData._value.toString());
      console.log('Min Gas Limit:', decodedData._minGasLimit.toString());
      console.log('Message:', ethers.utils.hexlify(decodedData._message));

      // console.log('----------------------');

      const msgSlice = ethers.utils.hexlify(decodedData._message).slice(0, 10);
      console.log('Message Slice:', msgSlice);

      // //  address _from,address _to, uint256 _amount,bytes calldata _extraData (0x1635f5fd)
      // const abiFinal = [
      //   'function finalizeBridgeETH(address _from, address _to, uint256 _amount, bytes _extraData)',
      // ];

      // // Create an Interface object
      // const ifaceFinal = new ethers.utils.Interface(abiFinal);

      // // Decode the data using the finalizeBridgeETH ABI
      // const decodedDataFinal = ifaceFinal.decodeFunctionData(
      //   'finalizeBridgeETH',
      //   ethers.utils.hexlify(decodedData._message)
      // );

      // // console.log('Decoded Data:', decodedDataFinal);

      // // Output the decoded values
      // console.log('From:', decodedDataFinal._from);
      // console.log('To:', decodedDataFinal._to);
      // console.log('Amount:', decodedDataFinal._amount.toString());
      // console.log(
      //   'Extra Data:',
      //   ethers.utils.hexlify(decodedDataFinal._extraData)
      // );

      // finalize bridge erc20 0x0166a07a

      const abiFinal = [
        'function finalizeBridgeERC20(address _localToken, address _remoteToken, address _from, address _to, uint256 _amount, bytes _extraData)',
      ];

      // Create an Interface object
      const ifaceFinal = new ethers.utils.Interface(abiFinal);

      // Decode the data using the finalizeBridgeETH ABI

      const decodedDataFinal = ifaceFinal.decodeFunctionData(
        'finalizeBridgeERC20',
        ethers.utils.hexlify(decodedData._message)
      );

      console.log('Decoded Data:', decodedDataFinal);


      const _extraData = ethers.utils.hexlify(decodedDataFinal._extraData).slice(0, 10);
      console.log('Extra Data:', _extraData);
    } else {
    }
  }
};

main().catch((error) => {
  console.error('Error in main function:', error);
  process.exit(1);
});
