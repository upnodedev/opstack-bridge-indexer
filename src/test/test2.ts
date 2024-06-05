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

    console.log({ transactionHash });

    if (event.version === '0') {
      const abi = [
        'function relayMessage(uint256 _nonce, address _sender, address _target, uint256 _value, uint256 _minGasLimit, bytes _message)',
        'function finalizeBridgeETH(address _from, address _to, uint256 _amount, bytes _extraData)',
        'function finalizeBridgeERC20(address _localToken, address _remoteToken, address _from, address _to, uint256 _amount, bytes _extraData)',
      ];
      const ifaceAbi = new ethers.utils.Interface(abi);

      console.log({ opaqueData });

      // decode opaqueData
      const data = ethers.utils.arrayify(opaqueData);
      // Offsets to read data from the buffer
      let offset = 0;

      // Read uint256 _mint (32 bytes) or msg.value
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
      const _datahex = ethers.utils.hexlify(_data);

      console.log({ _datahex });

      if (_datahex.startsWith('0xd764ad0b')) {
        // decode relayMessage
        const decoded = ifaceAbi.decodeFunctionData('relayMessage', _datahex);

        const _messageHex = ethers.utils.hexlify(decoded._message);

        // if finalizeBridgeETH
        if (_messageHex.startsWith('0x1635f5fd')) {
          console.log('finalizeBridgeETH');
          const decoded = ifaceAbi.decodeFunctionData(
            'finalizeBridgeETH',
            _messageHex
          );
          const _from = decoded._from;
          const _to = decoded._to;
          const _amount = decoded._amount;
          const _extraData = decoded._extraData;
          const _extraDataHex = ethers.utils.hexlify(_extraData);
        }

        // if finalizeBridgeERC20
        if (_messageHex.startsWith('0x0166a07a')) {
          console.log('finalizeBridgeERC20');
          const decoded = ifaceAbi.decodeFunctionData(
            'finalizeBridgeERC20',
            _messageHex
          );
          const _localToken = decoded._localToken;
          const _remoteToken = decoded._remoteToken;
          const _from = decoded._from;
          const _to = decoded._to;
          const _amount = decoded._amount;
          const _extraData = decoded._extraData;
          const _extraDataHex = ethers.utils.hexlify(_extraData);
        }
      }
    }
  }
};

main().catch((error) => {
  console.error('Error in main function:', error);
  process.exit(1);
});
