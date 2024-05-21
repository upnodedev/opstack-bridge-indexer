import { mainnet, type Chain } from 'viem/chains';
import { ENV } from './ENV';
import { createPublicClient, http, webSocket } from 'viem';
import 'dotenv/config';
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';

export const RPC_URLS_L1 = [
  ENV.L1_RPC_URL_1,
  ENV.L1_RPC_URL_2,
  ENV.L1_RPC_URL_3,
];
export const RPC_URLS_L2 = [
  ENV.L2_RPC_URL_1,
  ENV.L2_RPC_URL_2,
  ENV.L2_RPC_URL_3,
];

// clone of mainnet and edit the chainId
export const l1ChainConfig: Chain = {
  name: ENV.L1_CHAIN_NAME,
  id: ENV.L1_CHAIN_ID,
  rpcUrls: {
    default: {
      http: RPC_URLS_L1,
    },
  },
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const l2ChainConfig: Chain = {
  name: ENV.L2_CHAIN_NAME,
  id: ENV.L2_CHAIN_ID,
  rpcUrls: {
    default: {
      http: RPC_URLS_L2,
    },
  },
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const publicClientL1 = createPublicClient({
  chain: l1ChainConfig,
  transport: http(),
});

export const publicClientL2 = createPublicClient({
  chain: l2ChainConfig,
  transport: http(),
});

// Function to select a working provider from a list of URLs
export const selectWorkingProviderL1 = async () => {
  for (let url of RPC_URLS_L1) {
    try {
      let provider = new ethers.providers.JsonRpcProvider(url);
      await provider.getBlockNumber(); // Test connection by getting the block number
      // console.log(`Connected to provider at ${url}`);
      return provider; // Return the first working provider
    } catch (error) {
      console.log(`Failed to connect to provider at ${url}: ${error.message}`);
    }
  }
  throw new Error('All JSON RPC providers failed to connect.');
};

export const selectWorkingProviderL2 = async () => {
  for (let url of RPC_URLS_L2) {
    try {
      let provider = new ethers.providers.JsonRpcProvider(url);
      await provider.getBlockNumber(); // Test connection by getting the block number
      // console.log(`Connected to provider at ${url}`);
      return provider; // Return the first working provider
    } catch (error) {
      console.log(`Failed to connect to provider at ${url}: ${error.message}`);
    }
  }
  throw new Error('All JSON RPC providers failed to connect.');
};

export const StandartBridgeABI = [
  'event WithdrawalInitiated(address indexed l1Token, address indexed l2Token, address indexed from, address to, uint256 amount, bytes extraData)',
];

export const PortalAbi = [
  'event TransactionDeposited(address indexed from, address indexed to, uint256 indexed version, bytes opaqueData)',
];

export const getContractStandartBridge = async (provider: JsonRpcProvider) => {
  return new ethers.Contract(
    ENV.L2_STANDARD_BRIDGE_ADDRESS,
    StandartBridgeABI,
    provider
  );
};

export const getContractPortal = async (provider: JsonRpcProvider) => {
  return new ethers.Contract(ENV.L1_PORTAL_ADDRESS, PortalAbi, provider);
};
