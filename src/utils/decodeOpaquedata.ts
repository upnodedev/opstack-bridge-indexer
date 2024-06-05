import { ethers } from 'ethers';

export const decodeOpqdata = (opaqueData: string) => {
  const result = {
    _mint: undefined,
    _value: undefined,
    _gasLimit: undefined,
    _isCreation: undefined,
    _dataOpaque: undefined,
    _nouce: undefined,
    _sender: undefined,
    _target: undefined,
    _valueRelay: undefined,
    _minGasLimit: undefined,
    _message: undefined,
    _from: undefined,
    _to: undefined,
    _amount: undefined,
    _extraData: undefined,
    _localToken: undefined,
    _remoteToken: undefined,
    isFinalizeBridgeETH: false,
    isFinalizeBridgeERC20: false,
  };
  const abi = [
    'function relayMessage(uint256 _nonce, address _sender, address _target, uint256 _value, uint256 _minGasLimit, bytes _message)',
    'function finalizeBridgeETH(address _from, address _to, uint256 _amount, bytes _extraData)',
    'function finalizeBridgeERC20(address _localToken, address _remoteToken, address _from, address _to, uint256 _amount, bytes _extraData)',
  ];
  const ifaceAbi = new ethers.utils.Interface(abi);

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

  result._mint = _mint.toString();
  result._value = _value.toString();
  result._gasLimit = _gasLimit.toString();
  result._isCreation = _isCreation;
  result._dataOpaque = ethers.utils.hexlify(data.slice(offset));

  // The remaining data is _data (variable length)
  const _data = data.slice(offset);
  const _datahex = ethers.utils.hexlify(_data);

  if (_datahex.startsWith('0xd764ad0b')) {
    // decode relayMessage
    const decoded = ifaceAbi.decodeFunctionData('relayMessage', _datahex);

    const _messageHex = ethers.utils.hexlify(decoded._message);

    result._nouce = decoded._nonce.toString();
    result._sender = decoded._sender;
    result._target = decoded._target;
    result._valueRelay = decoded._value.toString();
    result._minGasLimit = decoded._minGasLimit.toString();
    result._message = decoded._message;

    // if finalizeBridgeETH
    if (_messageHex.startsWith('0x1635f5fd')) {
      // console.log('finalizeBridgeETH');
      const decoded = ifaceAbi.decodeFunctionData(
        'finalizeBridgeETH',
        _messageHex
      );
      const _from = decoded._from;
      const _to = decoded._to;
      const _amount = decoded._amount;
      const _extraData = decoded._extraData;
      const _extraDataHex = ethers.utils.hexlify(_extraData);

      result._from = _from;
      result._to = _to;
      result._amount = _amount.toString();
      result._extraData = _extraDataHex;
      result.isFinalizeBridgeETH = true;
    }

    // if finalizeBridgeERC20
    if (_messageHex.startsWith('0x0166a07a')) {
      // console.log('finalizeBridgeERC20');
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

      result._localToken = _localToken;
      result._remoteToken = _remoteToken;
      result._from = _from;
      result._to = _to;
      result._amount = _amount.toString();
      result._extraData = _extraDataHex;
      result.isFinalizeBridgeERC20 = true;
    }
  }

  return result;
};
