import { BigNumber } from 'ethers';

export interface EventDepositLogType {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  address: string;
  data: string;
  topics: string[];
  transactionHash: string;
  logIndex: number;
  removeListener: Function;
  getBlock: Function;
  getTransaction: Function;
  getTransactionReceipt: Function;
  event: string;
  eventSignature: string;
  decode: Function;
  args: [
    string,
    string,
    BigNumber,
    string,
    {
      from: string;
      to: string;
      version: BigNumber;
      opaqueData: string;
    }
  ];
}

export interface TransactionDepositedDto {
  from: string;
  to: string;
  version: string;
  opaqueData: string;
  transactionHash: string;
  blockNumber: number;
  addressContract: string;
}

export interface TransactionWithdrawnDto {
  l1Token: string;
  l2Token: string;
  from: string;
  to: string;
  amount: string;
  extraData: string;
  transactionHash: string;
  blockNumber: number;
  addressContract: string;
}
